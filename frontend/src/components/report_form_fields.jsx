export default function ReportFormFields({ description, setDescription, solution, setSolution, eventTitle, setEventTitle }) {
  return (
    <div className="space-y-4 font-sans">
      {eventTitle !== undefined && (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Trouble On Event <span className="text-red-500">*</span></label>
          <input type="text" required value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium" />
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Description <span className="text-red-500">*</span></label>
        <textarea required rows="3" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium resize-none"></textarea>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Solution <span className="text-red-500">*</span></label>
        <textarea required rows="3" value={solution} onChange={(e) => setSolution(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium resize-none"></textarea>
      </div>
    </div>
  );
}