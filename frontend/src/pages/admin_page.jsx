import { useCallback, useEffect, useState } from 'react';
import ReportsPage from './reports_page.jsx';

export default function AdminPage({ apiUrl, onExit }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${apiUrl}/admin/session`, { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401) return false;
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Status login admin gagal diperiksa.');
        return true;
      })
      .then((isAuthenticated) => {
        if (active) setAuthenticated(isAuthenticated);
      })
      .catch((sessionError) => {
        if (active) setError(sessionError.message || 'Status login admin gagal diperiksa.');
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [apiUrl]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/admin/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login admin gagal.');
      setPassword('');
      setAuthenticated(true);
    } catch (loginError) {
      setError(loginError.message || 'Login admin gagal.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Logout gagal.');
      setAuthenticated(false);
      setPassword('');
      setError('');
    } catch (logoutError) {
      setError(logoutError.message || 'Logout gagal.');
    } finally {
      setBusy(false);
    }
  };

  const handleSessionExpired = useCallback(() => {
    setAuthenticated(false);
    setError('Sesi admin berakhir. Silakan login kembali.');
  }, []);

  if (checkingSession) {
    return <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Memeriksa sesi admin...</p>;
  }

  if (authenticated) {
    return (
      <ReportsPage
        apiUrl={apiUrl}
        onLogout={handleLogout}
        onSessionExpired={handleSessionExpired}
        busy={busy}
      />
    );
  }

  return (
    <section className="mx-auto max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Login Admin</h1>
        <p className="mt-1 text-sm text-slate-600">Login diperlukan untuk membuka riwayat dan mengimpor laporan.</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Username
          <input
            required
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal"
          />
        </label>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onExit} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
            Kembali
          </button>
          <button type="submit" disabled={busy} className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: '#2b2f60' }}>
            {busy ? 'Memeriksa...' : 'Login Admin'}
          </button>
        </div>
      </form>
    </section>
  );
}
