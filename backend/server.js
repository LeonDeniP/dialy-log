import { createServer } from 'node:http';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { Client } from 'pg';
import ExcelJS from 'exceljs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import db, { postgresConfig } from './config/db.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT || 5000);
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60 * 1000;
const ADMIN_SESSION_COOKIE = 'daily_log_admin';
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const REPORT_STATUSES = new Set(['OK', 'Trouble', 'Maintenance', 'Trouble (Ext)']);
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim())
);
const activeSessions = new Map();
const loginAttempts = new Map();
const eventClients = new Map();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMPORT_BYTES, files: 1 }
});

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

function logError(context, error) {
  console.error(`${context}:`, error);
}

function safeEqual(left, right) {
  const leftHash = createHash('sha256').update(String(left)).digest();
  const rightHash = createHash('sha256').update(String(right)).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function signAdminPayload(payload) {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');
}

function getAdminSession(req) {
  try {
    const cookie = req.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
    if (!cookie || !process.env.ADMIN_SESSION_SECRET) return null;

    const token = decodeURIComponent(cookie.slice(ADMIN_SESSION_COOKIE.length + 1));
    const separator = token.lastIndexOf('.');
    if (separator < 0) return null;

    const payload = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!safeEqual(signature, signAdminPayload(payload))) return null;

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const activeSession = activeSessions.get(session.id);
    if (!activeSession || activeSession.expiresAt <= Date.now()) {
      activeSessions.delete(session.id);
      return null;
    }
    return { id: session.id, expiresAt: activeSession.expiresAt };
  } catch {
    return null;
  }
}

function adminCookie(token, maxAge) {
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function requireAllowedOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ success: false, message: 'Origin tidak diizinkan.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Login admin diperlukan.' });
  }
  req.adminSession = session;
  next();
}

function loginAttemptsFor(ip) {
  const now = Date.now();
  let attempts = loginAttempts.get(ip);
  if (!attempts || attempts.resetAt <= now) {
    attempts = { count: 0, resetAt: now + LOGIN_ATTEMPT_WINDOW };
    loginAttempts.set(ip, attempts);
  }
  return attempts;
}

function normalizeHeader(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const HEADER_ALIASES = {
  report_date: ['reportdate', 'date', 'tanggal', 'tanggal laporan', 'tanggalshift'],
  shift: ['shift', 'shiftduty', 'shiftkerja'],
  toa_on_duty: ['toaonduty', 'toa', 'personeltoa', 'personelonduty', 'operator'],
  mcr_on_duty: ['mcronduty', 'mcr', 'personelmcr'],
  live_feed_name: ['livefeedname', 'liveprogram', 'program', 'feed', 'namaprogram'],
  status_report: ['statusreport', 'status', 'statuslaporan'],
  car_device: ['cardevice', 'car'],
  mcr_device: ['mcrdevice'],
  qc_device: ['qcdevice', 'qc'],
  event_title: ['eventtitle', 'event', 'troubleonevent', 'judulkejadian'],
  description: ['description', 'deskripsi', 'keterangan'],
  solution: ['solution', 'solusi', 'penyelesaian']
};
const NORMALIZED_ALIASES = new Map(
  Object.entries(HEADER_ALIASES).flatMap(([field, aliases]) =>
    aliases.map((alias) => [normalizeHeader(alias), field])
  )
);

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  }

  const text = String(value ?? '').trim();
  const isoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (date.toISOString().slice(0, 10) === `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`) {
      return date.toISOString().slice(0, 10);
    }
  }

  const localizedDate = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (localizedDate) {
    const [, first, second, year] = localizedDate;
    const day = Number(first);
    const month = Number(second);
    const date = new Date(Date.UTC(Number(year), month - 1, day));
    if (date.getUTCDate() === day && date.getUTCMonth() === month - 1) {
      return date.toISOString().slice(0, 10);
    }
  }
  return null;
}

function normalizePersonnel(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return [value];
  const text = String(value).trim();
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return text.split(/[,;|]/).map((person) => person.trim()).filter(Boolean);
  }
}

function normalizeReport(source, rowNumber, mapping = {}) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return { error: { row: rowNumber, message: 'baris harus berupa object dengan header kolom.' } };
  }
  const report = {};
  for (const [header, value] of Object.entries(source)) {
    const field = NORMALIZED_ALIASES.get(normalizeHeader(header));
    if (field && value != null && value !== '') report[field] = value;
  }
  for (const [field, header] of Object.entries(mapping)) {
    if (source[header] != null && source[header] !== '') report[field] = source[header];
  }

  const reportDate = normalizeDate(report.report_date);
  const shift = String(report.shift ?? '').trim();
  const mcrOnDuty = String(report.mcr_on_duty ?? '').trim();
  const liveFeedName = String(report.live_feed_name ?? '').trim();
  const statusReport = String(report.status_report || 'OK').trim();
  const errors = [];

  if (!reportDate) errors.push('tanggal tidak valid atau tidak tersedia');
  if (!shift) errors.push('shift tidak tersedia');
  if (!mcrOnDuty) errors.push('MCR on duty tidak tersedia');
  if (!liveFeedName) errors.push('nama program/feed tidak tersedia');
  if (!REPORT_STATUSES.has(statusReport)) errors.push(`status "${statusReport}" tidak valid`);

  if (errors.length) {
    return { error: { row: rowNumber, message: errors.join(', ') } };
  }

  return {
    values: [
      reportDate,
      shift,
      JSON.stringify(normalizePersonnel(report.toa_on_duty)),
      mcrOnDuty,
      liveFeedName,
      statusReport,
      report.car_device || null,
      report.mcr_device || null,
      report.qc_device || null,
      report.event_title || null,
      report.description || null,
      report.solution || null
    ]
  };
}

async function readImportRows(file) {
  const extension = extname(file.originalname).toLowerCase();
  if (extension === '.json') {
    const parsed = JSON.parse(file.buffer.toString('utf8'));
    const rows = Array.isArray(parsed) ? parsed : parsed?.data;
    if (!Array.isArray(rows)) throw new Error('JSON harus berupa array atau memiliki properti "data" berupa array.');
    return rows;
  }
  if (extension !== '.xlsx' && extension !== '.csv') {
    const error = new Error('Format file tidak didukung. Gunakan .xlsx, .csv, atau .json.');
    error.status = 415;
    throw error;
  }

  const workbook = new ExcelJS.Workbook();
  if (extension === '.xlsx') {
    await workbook.xlsx.load(file.buffer);
  } else {
    await workbook.csv.read(Readable.from([file.buffer]), { dateFormats: [] });
  }
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) throw new Error('File harus memiliki header dan minimal satu baris data.');

  const headers = sheet.getRow(1).values.slice(1).map((value) => String(value ?? '').trim());
  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values.slice(1);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? null])));
  });
  return rows;
}

function broadcastReportChange(payload) {
  const message = `event: report-change\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const response of eventClients.keys()) response.write(message);
}

function connectNotificationListener() {
  const client = new Client(postgresConfig);
  client.on('notification', (notification) => {
    if (notification.channel !== 'reports_changed') return;
    try {
      broadcastReportChange(JSON.parse(notification.payload));
    } catch (error) {
      logError('Payload notifikasi PostgreSQL tidak valid', error);
    }
  });
  client.on('error', (error) => {
    logError('Listener real-time PostgreSQL mengalami error', error);
  });
  return client.connect().then(() => client.query('LISTEN reports_changed')).then(() => client);
}

app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ success: true, database: 'connected', realtime: notificationClient ? 'connected' : 'unavailable' });
  } catch (error) {
    logError('Pemeriksaan health PostgreSQL gagal', error);
    res.status(503).json({ success: false, database: 'unavailable' });
  }
});

app.post('/api/admin/login', requireAllowedOrigin, (req, res) => {
  const { username, password } = req.body ?? {};
  const adminConfigured = process.env.ADMIN_USERNAME
    && process.env.ADMIN_PASSWORD
    && process.env.ADMIN_SESSION_SECRET;
  if (!adminConfigured) {
    return res.status(503).json({ success: false, message: 'Login admin belum dikonfigurasi pada backend.' });
  }

  for (const [sessionId, session] of activeSessions) {
    if (session.expiresAt <= Date.now()) activeSessions.delete(sessionId);
  }

  const attempts = loginAttemptsFor(req.ip);
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan login. Coba lagi 15 menit kemudian.' });
  }

  const validCredentials = typeof username === 'string'
    && typeof password === 'string'
    && safeEqual(username, process.env.ADMIN_USERNAME)
    && safeEqual(password, process.env.ADMIN_PASSWORD);
  if (!validCredentials) {
    attempts.count += 1;
    return res.status(401).json({ success: false, message: 'Username atau password admin salah.' });
  }

  loginAttempts.delete(req.ip);
  const sessionId = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE;
  const payload = Buffer.from(JSON.stringify({ id: sessionId })).toString('base64url');
  const token = `${payload}.${signAdminPayload(payload)}`;
  activeSessions.set(sessionId, { expiresAt });
  res.setHeader('Set-Cookie', adminCookie(token, ADMIN_SESSION_MAX_AGE / 1000));
  res.json({ success: true, username: process.env.ADMIN_USERNAME });
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
  res.json({ success: true, username: process.env.ADMIN_USERNAME });
});

app.post('/api/admin/logout', requireAllowedOrigin, (req, res) => {
  const session = getAdminSession(req);
  if (session) {
    activeSessions.delete(session.id);
    for (const [response, sessionId] of eventClients) {
      if (sessionId === session.id) response.end();
    }
  }
  res.setHeader('Set-Cookie', adminCookie('', 0));
  res.json({ success: true });
});

app.get('/api/events', requireAdmin, (req, res) => {
  if (!notificationClient) {
    return res.status(503).json({ success: false, message: 'Listener real-time PostgreSQL belum tersedia.' });
  }
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();
  res.write('retry: 3000\nevent: ready\ndata: {}\n\n');
  eventClients.set(res, req.adminSession.id);

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000);
  const sessionTimeout = setTimeout(() => {
    res.write('event: session-expired\ndata: {}\n\n');
    res.end();
  }, req.adminSession.expiresAt - Date.now());
  req.on('close', () => {
    clearInterval(heartbeat);
    clearTimeout(sessionTimeout);
    eventClients.delete(res);
  });
});

app.get('/api/reports', requireAdmin, async (req, res) => {
  const requestedLimit = Number(req.query.limit ?? 100);
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 200)
    : 100;
  try {
    const result = await db.query(
      'SELECT * FROM reports ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logError('Gagal mengambil laporan', error);
    res.status(500).json({ success: false, message: 'Laporan gagal dimuat.' });
  }
});

app.get('/api/reports/:id', requireAdmin, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID laporan tidak valid.' });
  }
  try {
    const result = await db.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logError('Gagal mengambil laporan', error);
    res.status(500).json({ success: false, message: 'Laporan gagal dimuat.' });
  }
});

app.post('/api/reports', async (req, res) => {
  const {
    date, shift, toaOnDuty, mcrOnDuty, liveFeedName, statusReport,
    carDevice, mcrDevice, qcDevice, eventTitle, description, solution
  } = req.body;

  if (!date || !shift || !Array.isArray(toaOnDuty) || toaOnDuty.length === 0 || !mcrOnDuty || !liveFeedName) {
    return res.status(400).json({ success: false, message: 'Lengkapi tanggal, shift, personel, MCR on duty, dan nama program.' });
  }
  if (!REPORT_STATUSES.has(statusReport)) {
    return res.status(400).json({ success: false, message: 'Status laporan tidak valid.' });
  }
  const reportDate = normalizeDate(date);
  if (!reportDate) return res.status(400).json({ success: false, message: 'Tanggal laporan tidak valid.' });

  try {
    const result = await db.query(
      `INSERT INTO reports (
        report_date, shift, toa_on_duty, mcr_on_duty, live_feed_name,
        status_report, car_device, mcr_device, qc_device, event_title,
        description, solution
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        reportDate, shift, JSON.stringify(toaOnDuty), mcrOnDuty, liveFeedName,
        statusReport, carDevice || null, mcrDevice || null, qcDevice || null,
        eventTitle || null, description || null, solution || null
      ]
    );
    res.status(201).json({ success: true, message: 'Laporan berhasil disimpan.', data: result.rows[0] });
  } catch (error) {
    logError('Gagal menyimpan laporan', error);
    res.status(500).json({ success: false, message: 'Laporan gagal disimpan.' });
  }
});

app.post('/api/import/reports', requireAllowedOrigin, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Pilih file .xlsx, .csv, atau .json untuk diimpor.' });
  }

  let mapping = {};
  if (req.body.mapping) {
    try {
      mapping = JSON.parse(req.body.mapping);
      if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
        throw new Error('Pemetaan kolom harus berupa object JSON.');
      }
      for (const [field, header] of Object.entries(mapping)) {
        if (!Object.hasOwn(HEADER_ALIASES, field) || typeof header !== 'string' || !header.trim()) {
          throw new Error(`Pemetaan kolom "${field}" tidak valid.`);
        }
      }
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message || 'Pemetaan kolom bukan JSON yang valid.' });
    }
  }

  let rows;
  try {
    rows = await readImportRows(req.file);
  } catch (error) {
    const status = error.status || 400;
    logError('Gagal membaca file impor', error);
    return res.status(status).json({ success: false, message: error.message || 'File impor tidak dapat dibaca.' });
  }
  if (rows.length === 0) {
    return res.status(400).json({ success: false, message: 'File tidak memiliki baris data.' });
  }

  const normalized = rows.map((row, index) => normalizeReport(row, index + 2, mapping));
  const errors = normalized.filter((row) => row.error).map((row) => row.error);
  if (errors.length) {
    return res.status(422).json({
      success: false,
      message: `Impor dibatalkan: ${errors.length} baris tidak valid. Tidak ada data yang disimpan.`,
      errors: errors.slice(0, 50),
      totalErrors: errors.length
    });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const row of normalized) {
      await client.query(
        `INSERT INTO reports (
          report_date, shift, toa_on_duty, mcr_on_duty, live_feed_name,
          status_report, car_device, mcr_device, qc_device, event_title,
          description, solution
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        row.values
      );
    }
    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: `${normalized.length} laporan berhasil diimpor.`,
      imported: normalized.length
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      logError('Rollback transaksi impor gagal', rollbackError);
    }
    logError('Transaksi impor laporan gagal', error);
    res.status(500).json({ success: false, message: 'Impor gagal. Tidak ada data yang disimpan.' });
  } finally {
    client.release();
  }
});

app.delete('/api/reports/:id', requireAllowedOrigin, requireAdmin, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID laporan tidak valid.' });
  }
  try {
    const result = await db.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Laporan berhasil dihapus.' });
  } catch (error) {
    logError('Gagal menghapus laporan', error);
    res.status(500).json({ success: false, message: 'Laporan gagal dihapus.' });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Ukuran file maksimal 5 MB.' });
  }
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: error.message });
  }
  logError('Kesalahan request backend', error);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
});

let notificationClient = null;
server.listen(PORT, () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
  connectNotificationListener()
    .then((client) => {
      notificationClient = client;
      console.log('Listener real-time PostgreSQL terhubung.');
    })
    .catch((error) => logError('Listener real-time PostgreSQL tidak dapat dimulai; jalankan schema.sql', error));
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    if (notificationClient) await notificationClient.end().catch((error) => logError('Gagal menutup listener PostgreSQL', error));
    await db.end();
    server.close(() => process.exit(0));
  });
}
