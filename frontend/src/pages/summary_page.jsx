import HeaderInfo from '../components/header.jsx';
import NavigationButtons from '../components/navigation.jsx';

export default function SummaryPage({ formData, onBack, onSubmitFinal }) {
  const hasDevices = formData.carDevice || formData.mcrDevice || formData.qcDevice;

  return (
    <div className="w-full space-y-6 font-sans">
      <HeaderInfo />

      {/* Main Content Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Banner Title */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight uppercase mt-0.5">Shift Log Summary</h1>
          </div>
          <div className="shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 border" style={{ backgroundColor: '#f4f5f9', color: '#2b2f60', borderColor: '#d1d5db' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2b2f60' }}></span>
              Status: {formData.statusReport || 'OK'}
            </span>
          </div>
        </div>

        {/* 1. Operational Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-2" style={{ color: '#2b2f60' }}>1. Date & Shift</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Date</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{formData.date || '-'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Shift Duty</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{formData.shift || '-'}</p>
            </div>
          </div>
        </div>

        {/* 2. TOA On Duty */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2b2f60' }}>2. TOA On Duty</h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border font-semibold" style={{ backgroundColor: '#f4f5f9', color: '#2b2f60', borderColor: '#d1d5db' }}>Selected: {formData.toaOnDuty?.length || 0} Personnel</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {formData.toaOnDuty?.length > 0 ? (
              formData.toaOnDuty.map((toa) => (
                <div key={toa.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="w-14 h-14 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={toa.photo} alt={toa.name} className="w-full h-full object-contain p-0.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{toa.name}</h3>
                    <span className="text-[11px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">{toa.nik}</span>
                  </div>
                </div>
              ))
            ) : <p className="text-xs text-slate-400 italic">No personnel selected.</p>}
          </div>
        </div>

        {/* 3. MCR On Duty */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-2" style={{ color: '#2b2f60' }}>3. MCR On Duty</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800">{formData.mcrOnDuty || '-'}</div>
        </div>

        {/* 4. Live Program / Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-2" style={{ color: '#2b2f60' }}>4. Live Program / Feed</h2>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Live Program / Feed Name</label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800">{formData.liveFeedName || '-'}</div>
          </div>
        </div>

        {/* 5. Report Details / Issues (Only shows if Status is not OK) */}
        {formData.statusReport !== 'OK' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-2" style={{ color: '#2b2f60' }}>5. Report Details & Issues ({formData.statusReport})</h2>
            {hasDevices && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">Affected Equipment</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {formData.carDevice && <div className="bg-slate-50 p-3 rounded-xl border border-slate-200"><span className="text-[10px] text-slate-500 font-bold block uppercase">CAR Device</span><span className="text-xs font-bold text-slate-800">{formData.carDevice}</span></div>}
                  {formData.mcrDevice && <div className="bg-slate-50 p-3 rounded-xl border border-slate-200"><span className="text-[10px] text-slate-500 font-bold block uppercase">MCR Device</span><span className="text-xs font-bold text-slate-800">{formData.mcrDevice}</span></div>}
                  {formData.qcDevice && <div className="bg-slate-50 p-3 rounded-xl border border-slate-200"><span className="text-[10px] text-slate-500 font-bold block uppercase">QC Device</span><span className="text-xs font-bold text-slate-800">{formData.qcDevice}</span></div>}
                </div>
              </div>
            )}
            {formData.eventTitle && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Trouble On Event</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800">{formData.eventTitle}</div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Description</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-line">{formData.description || '-'}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Solution</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-line">{formData.solution || '-'}</div>
            </div>
          </div>
        )}
      </div>

      <NavigationButtons onBack={onBack} nextLabel="Submit Final Report" onSubmit={onSubmitFinal} isSubmit={false} />
    </div>
  );
}