import { useState } from 'react';
import MainPage from './pages/main_page.jsx';
import SummaryPage from './pages/summary_page.jsx';
import AdminPage from './pages/admin_page.jsx';

// 1. Definisikan state awal form
const INITIAL_FORM_DATA = {
  date: new Date().toISOString().split('T')[0],
  shift: 'Shift 1',
  toaOnDuty: [],
  mcrOnDuty: '',
  liveFeedName: '',
  statusReport: 'OK',
  carDevice: '',
  mcrDevice: '',
  qcDevice: '',
  eventTitle: '',
  description: '',
  solution: '',
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('main');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // 2. Fungsi penanganan submit final
  const handleSubmitFinal = async () => {
    try {
      const response = await fetch(`${apiUrl}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Laporan gagal disimpan.');
      }

      alert(result.message);
      setFormData(INITIAL_FORM_DATA);
      setCurrentPage('main');
    } catch (error) {
      alert(error.message || 'Gagal menyimpan laporan. Pastikan backend dan PostgreSQL berjalan.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-5 flex justify-end gap-2">
          <button type="button" onClick={() => setCurrentPage('main')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Form Laporan
          </button>
          <button type="button" onClick={() => setCurrentPage('admin')} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: '#2b2f60' }}>
            Admin: Riwayat & Impor
          </button>
        </nav>
        {currentPage === 'main' && (
          <MainPage formData={formData} setFormData={setFormData} onNext={() => setCurrentPage('summary')} />
        )}
        {currentPage === 'summary' && (
          <SummaryPage formData={formData} onBack={() => setCurrentPage('main')} onSubmitFinal={handleSubmitFinal} />
        )}
        {currentPage === 'admin' && <AdminPage apiUrl={apiUrl} onExit={() => setCurrentPage('main')} />}
      </div>
    </div>
  );
}