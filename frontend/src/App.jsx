import { useState } from 'react';
import MainPage from './pages/main_page.jsx';
import SummaryPage from './pages/summary_page.jsx';

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
  const [currentPage, setCurrentPage] = useState('main'); // 'main' | 'summary'
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // 2. Fungsi penanganan submit final
  const handleSubmitFinal = async () => {
    try {
      // API call ke database kamu (contoh)
      // await axios.post('/api/reports', formData);

      alert('Laporan berhasil disimpan ke database!');

      // Reset form data kembali ke kondisi awal
      setFormData(INITIAL_FORM_DATA);

      // Kembalikan tampilan ke halaman utama (MainPage)
      setCurrentPage('main');
    } catch (error) {
      alert('Gagal menyimpan laporan.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {currentPage === 'main' && (
          <MainPage formData={formData} setFormData={setFormData} onNext={() => setCurrentPage('summary')} />
        )}
        {currentPage === 'summary' && (
          <SummaryPage formData={formData} onBack={() => setCurrentPage('main')} onSubmitFinal={handleSubmitFinal} />
        )}
      </div>
    </div>
  );
}