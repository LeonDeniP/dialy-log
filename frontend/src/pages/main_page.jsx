import { memo, useState } from 'react';
import HeaderInfo from '../components/header.jsx';
import DeviceDropdown from '../components/device_dropdown.jsx';
import ReportFormFields from '../components/report_form_fields.jsx';
import NavigationButtons from '../components/navigation.jsx';

import imgTulus from '../assets/tulus.png';
import imgSyaiful from '../assets/syaiful.png';
import imgEdwart from '../assets/edwart.png';
import imgRoland from '../assets/roland.jpeg';
import imgFaizal from '../assets/faizal.jpeg';
import imgEgy from '../assets/egy.jpeg';
import imgLeonardus from '../assets/leonardus.png';
import imgSuharyadi from '../assets/suharyadi.png';
import imgAndro from '../assets/andro.png';

const TOA_LIST = [
  { id: 1, name: 'Tulus R.', nik: '0606071', photo: imgTulus },
  { id: 2, name: 'Syaiful A. S.', nik: '1401126', photo: imgSyaiful },
  { id: 3, name: 'Edwart J. P.', nik: '1709601', photo: imgEdwart },
  { id: 4, name: 'Roland S. H.', nik: '2309185', photo: imgRoland },
  { id: 5, name: 'Faizal A. A.', nik: '2502008', photo: imgFaizal },
  { id: 6, name: 'R. Egy P.', nik: '2502014', photo: imgEgy },
  { id: 7, name: 'Leonardus D. P.', nik: '2607043', photo: imgLeonardus },
  { id: 8, name: 'Suharyadi S.', nik: '1208044', photo: imgSuharyadi },
  { id: 9, name: 'Andro A.', nik: '0712455', photo: imgAndro },
];

function MainPage({ formData, setFormData, onNext }) {
  const [selectedToaIds, setSelectedToaIds] = useState(formData.toaOnDuty?.map((t) => t.id) || []);

  const toggleToaSelection = (id) => {
    setSelectedToaIds(selectedToaIds.includes(id) ? selectedToaIds.filter((item) => item !== id) : [...selectedToaIds, id]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedToaIds.length === 0) { alert('Silakan pilih minimal 1 personel TOA On Duty!'); return; }
    setFormData({ ...formData, toaOnDuty: TOA_LIST.filter((t) => selectedToaIds.includes(t.id)) });
    onNext();
  };

  const isTroubleOrMaintenance = formData.statusReport === 'Trouble' || formData.statusReport === 'Maintenance';
  const isTroubleExt = formData.statusReport === 'Trouble (Ext)';

  return (
    <div className="w-full space-y-6 font-sans">
      <HeaderInfo />
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Informasi Operasional */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-3" style={{ color: '#2b2f60' }}>1. Date & Shift</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Date <span className="text-red-500">*</span></label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Shift Duty <span className="text-red-500">*</span></label>
              <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium">
                <option value="Shift 1">Shift 1</option>
                <option value="Shift 2">Shift 2</option>
                <option value="Shift 3">Shift 3</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. TOA On Duty (Grid 3 Kolom dengan Foto Utuh Terbuka) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2b2f60' }}>2. TOA On Duty</h2>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full border font-semibold" style={{ backgroundColor: '#f4f5f9', color: '#2b2f60', borderColor: '#d1d5db' }}>On Duty: {selectedToaIds.length} Personel</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {TOA_LIST.map((toa) => {
              const isSelected = selectedToaIds.includes(toa.id);
              return (
                <div key={toa.id} onClick={() => toggleToaSelection(toa.id)} className={`cursor-pointer group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 select-none ${isSelected ? 'bg-slate-50 border-[#2b2f60] ring-1 ring-[#2b2f60] shadow-2xs' : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'}`}>
                  <div className="absolute top-3 right-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#2b2f60] bg-[#2b2f60]' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                    <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      <img src={toa.photo} alt={toa.name} className="w-full h-full object-contain p-1" />
                    </div>
                  <div className="space-y-1 pr-6">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#2b2f60] transition-colors">{toa.name}</h3>
                    <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">{toa.nik}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. MCR On Duty */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-3" style={{ color: '#2b2f60' }}>3. MCR On Duty</h2>
          <div>
            <input type="text" required value={formData.mcrOnDuty} onChange={(e) => setFormData({ ...formData, mcrOnDuty: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium" />
          </div>
        </div>

        {/* 4. Program Live / Feed (Hanya Nama Program) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-3" style={{ color: '#2b2f60' }}>4.Live Program / Feed</h2>
          <div>
            <input type="text" required value={formData.liveFeedName} onChange={(e) => setFormData({ ...formData, liveFeedName: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium" />
          </div>
        </div>

        {/* 5. Status Report Shift */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-3" style={{ color: '#2b2f60' }}>5. Report Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['OK', 'Trouble', 'Maintenance', 'Trouble (Ext)'].map((status) => (
              <label key={status} className={`cursor-pointer border rounded-xl p-4 text-center font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 select-none ${formData.statusReport === status ? 'bg-slate-50 border-[#2b2f60] text-[#2b2f60] ring-1 ring-[#2b2f60] shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                <input type="radio" name="statusReport" checked={formData.statusReport === status} onChange={() => setFormData({ ...formData, statusReport: status })} className="hidden" />
                {status}
              </label>
            ))}
          </div>
        </div>

        {/* 6. Detail Kendala */}
        {isTroubleOrMaintenance && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-3" style={{ color: '#2b2f60' }}>6. Detail Report Status ({formData.statusReport})</h2>
            <DeviceDropdown formData={formData} setFormData={setFormData} />
            <ReportFormFields eventTitle={formData.eventTitle} setEventTitle={(val) => setFormData({ ...formData, eventTitle: val })} description={formData.description} setDescription={(val) => setFormData({ ...formData, description: val })} solution={formData.solution} setSolution={(val) => setFormData({ ...formData, solution: val })} />
          </div>
        )}

        {isTroubleExt && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-3" style={{ color: '#2b2f60' }}>6. Detail Report Status (Trouble - External)</h2>
            <ReportFormFields description={formData.description} setDescription={(val) => setFormData({ ...formData, description: val })} solution={formData.solution} setSolution={(val) => setFormData({ ...formData, solution: val })} />
          </div>
        )}

        <NavigationButtons nextLabel="Next" isSubmit={true} />
      </form>
    </div>
  );
}

export default memo(MainPage);