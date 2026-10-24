// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- ROUTES / API ENDPOINTS ---

// 1. GET ALL LOGS (Ambil Semua Log)
app.get('/api/logs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM logs ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST NEW LOG (Tambah Log Baru)
app.post('/api/logs', async (req, res) => {
  const { title, category, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Judul dan isi catatan wajib diisi!' });
  }

  try {
    const query = 'INSERT INTO logs (title, category, content) VALUES (?, ?, ?)';
    const [result] = await db.query(query, [title, category || 'Work', content]);

    res.status(201).json({
      success: true,
      message: 'Log berhasil ditambahkan!',
      data: { id: result.insertId, title, category, content, created_at: new Date() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. DELETE LOG (Hapus Log berdasarkan ID)
app.delete('/api/logs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM logs WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Log tidak ditemukan!' });
    }

    res.json({ success: true, message: 'Log berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
});