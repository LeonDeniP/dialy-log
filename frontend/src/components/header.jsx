import heroLogo from '../assets/LogoTrans7.png';

export default function HeaderInfo() {
  return (
    <div className="w-full font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
        <div className="h-3.5 w-full" style={{ backgroundColor: '#2b2f60' }}></div>
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest font-extrabold uppercase" style={{ color: '#2b2f60' }}>TRANS|7 Technical Operations Broadcast Support</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Daily Checklist & Log TOBS TRANS|7</h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">Laporan pemeriksaan harian dan pencatatan operasional siaran.</p>
          </div>

          {/* Logo TRANS|7 dari folder Assets */}
          <div className="shrink-0 flex items-center">
            <img src={heroLogo} alt="TRANS7 Logo" className="h-10 sm:h-12 w-auto object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}