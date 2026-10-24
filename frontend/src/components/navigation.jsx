export default function NavigationButtons({ onBack, nextLabel = "Selanjutnya", onSubmit, isSubmit = false }) {
  return (
    <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-6 font-sans">
      {onBack ? (
        <button type="button" onClick={onBack} className="bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold text-sm px-6 py-3 rounded-xl border border-slate-300 transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95">
          <span>Back</span>
        </button>
      ) : <div></div>}

      <button type={isSubmit ? "submit" : "button"} onClick={!isSubmit ? onSubmit : undefined} className="text-white font-bold text-sm px-7 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95" style={{ backgroundColor: '#2b2f60' }}>
        <span>{nextLabel}</span>
      </button>
    </div>
  );
}