import { useEffect, useState } from 'react';

function displayPersonnel(value) {
  if (!Array.isArray(value)) return '-';
  return value.map((person) => (typeof person === 'string' ? person : person?.name || '-')).join(', ') || '-';
}

export default function ReportsPage({ apiUrl, onLogout, onSessionExpired, busy }) {
  const [reports, setReports] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [mapping, setMapping] = useState('');

  useEffect(() => {
    let active = true;
    const loadReports = async () => {
      const response = await fetch(`${apiUrl}/reports`, { credentials: 'include' });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Riwayat gagal dimuat.');
      if (active) setReports(result.data);
    };

    loadReports().catch((loadError) => {
      if (active) setError(loadError.message);
    });

    const events = new EventSource(`${apiUrl}/events`, { withCredentials: true });
    events.onopen = () => {
      if (active) setConnected(true);
    };
    events.onerror = () => {
      if (active) setConnected(false);
    };
    events.addEventListener('report-change', () => {
      loadReports().catch((loadError) => {
        if (active) setError(loadError.message);
      });
    });
    events.addEventListener('session-expired', onSessionExpired);

    return () => {
      active = false;
      events.close();
    };
  }, [apiUrl, onSessionExpired]);

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('file', file);
      if (mapping.trim()) payload.append('mapping', mapping);
      const response = await fetch(`${apiUrl}/import/reports`, {
        method: 'POST',
        credentials: 'include',
        body: payload
      });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const result = await response.json();
      if (!response.ok) {
        const rowDetails = result.errors?.map(({ row, message }) => `Baris ${row}: ${message}`).join('\n');
        throw new Error([result.message, rowDetails].filter(Boolean).join('\n'));
      }
      alert(result.message);
      const refreshed = await fetch(`${apiUrl}/reports`, { credentials: 'include' });
      if (refreshed.status === 401) {
        onSessionExpired();
        return;
      }
      const reportsResult = await refreshed.json();
      if (!refreshed.ok) throw new Error(reportsResult.message || 'Riwayat gagal dimuat.');
      setReports(reportsResult.data);
    } catch (importError) {
      setError(importError.message || 'File gagal diimpor.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm('Hapus laporan ini?')) return;
    setError('');
    try {
      const response = await fetch(`${apiUrl}/reports/${id}`, { method: 'DELETE', credentials: 'include' });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Laporan gagal dihapus.');
    } catch (deleteError) {
      setError(deleteError.message || 'Laporan gagal dihapus.');
    }
  };

  return (
    <section className="space-y-5 font-sans">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Riwayat Laporan</h1>
          <p className="mt-1 text-sm text-slate-600">Perubahan laporan diperbarui langsung dari PostgreSQL. Anda masuk sebagai admin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {connected ? 'Real-time terhubung' : 'Real-time terputus'}
          </span>
          <label className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-white ${importing ? 'cursor-wait opacity-60' : ''}`} style={{ backgroundColor: '#2b2f60' }}>
            {importing ? 'Mengimpor...' : 'Impor Excel / CSV / JSON'}
            <input
              type="file"
              accept=".xlsx,.csv,.json"
              className="hidden"
              disabled={importing || busy}
              onChange={handleImport}
            />
          </label>
          <button type="button" onClick={onLogout} disabled={busy} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60">
            {busy ? 'Keluar...' : 'Logout'}
          </button>
        </div>
      </div>

      <p className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
        Format impor: .xlsx, .csv, atau .json (maksimal 5 MB; file .xls perlu disimpan ulang sebagai .xlsx atau .csv).
        Header umum dikenali otomatis. Untuk nama kolom khusus, isi pemetaan JSON dengan nama field backend sebagai key
        dan header file sebagai value, misalnya {'{"report_date":"Tanggal Operasi","live_feed_name":"Nama Acara"}'}.
        Baris wajib memiliki tanggal, shift, MCR, dan nama program; impor dibatalkan seluruhnya bila ada baris tidak valid.
      </p>
      <label className="block rounded-xl border border-slate-200 bg-white p-4 text-xs font-semibold text-slate-700">
        Pemetaan kolom khusus (opsional, JSON)
        <textarea
          value={mapping}
          onChange={(event) => setMapping(event.target.value)}
          rows="2"
          placeholder='{"report_date":"Tanggal Operasi","mcr_on_duty":"Petugas MCR"}'
          className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs font-normal"
        />
      </label>

      {error && <pre role="alert" className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</pre>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Tanggal / Shift</th>
              <th className="px-4 py-3">TOA / MCR</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => (
              <tr key={report.id} className="align-top text-slate-700">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="font-semibold">{String(report.report_date).slice(0, 10)}</div>
                  <div className="text-xs text-slate-500">{report.shift}</div>
                </td>
                <td className="min-w-52 px-4 py-3">
                  <div>{displayPersonnel(report.toa_on_duty)}</div>
                  <div className="mt-1 text-xs text-slate-500">MCR: {report.mcr_on_duty}</div>
                </td>
                <td className="min-w-40 px-4 py-3">{report.live_feed_name}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{report.status_report}</td>
                <td className="min-w-48 px-4 py-3 text-xs">
                  {report.event_title || report.description || report.solution || '-'}
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => deleteReport(report.id)} className="font-semibold text-red-700 hover:text-red-900">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500">Belum ada laporan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
