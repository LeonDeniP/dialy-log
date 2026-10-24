export default function DeviceDropdown({ formData, setFormData }) {
  const carDevices = [
    "[Clock] Digital Leitch",
    "[FS] FS1 Selenio X100",
    "[FS] FS2 Harris X50",
    "[FS] FS3 Harris X50",
    "[FS] FS4 Harris X50",
    "[FS] FS5 Harris X50",
    "[KVM] ATEN",
    "[KVM] ATEN Switch Control",
    "[Monitor] ASUS",
    "[Monitor] Dell Library",
    "[Monitor] JVC 14\"",
    "[Monitor] LG 32\" Monitor FTA Digital",
    "[Monitor] LG Ingest",
    "[Monitor] Sony Trimaster",
    "[Monitor] TV Logic",
    "[Multiviewer] Kaleido X16",
    "[Panel] Audio Patch Panel",
    "[Panel] Video Patch #A",
    "[Panel] Video Patch #B",
    "[Panel] Video Patch #C",
    "[Panel] Video Patch #D",
    "[Panel] Video Patch #E",
    "[Panel] Video Patch #F",
    "[Panel] Video Patch #G",
    "[Panel] Video Patch #H",
    "[PC] Log Tape-Library 1",
    "[PC] Log Tape-Library 2",
    "[PC] MAC-Library",
    "[PC] Remote Control-TOA",
    "Digital VITC Generator",
    "Frame Densite 3 #1",
    "Frame Densite 3 #2",
    "Frame Densite 3 #3",
    "Hyperdeck Black Magic",
    "Orban Optimod 8382 Audio Processor",
    "Orban Optimod 8685 Audio Processor",
    "OTB Fiber Optic Canare",
    "PSU Fiber Optic Canare 161UPSC",
    "RTS KP 3216",
    "RTS ODIN",
    "RTS Telex",
    "RTS TIF2000A",
    "Decoder ADV6000",
    "Sony XDS 1000",
    "Tektronix ECO 8000",
    "Tektronix SPG 8000-Main",
    "Tektronix SPG 8000-Backup",
    "Tektronix WFM 5250",
    "Timecode Master",
    "Wohler Amp1-D8",
    "Wohler Amp1-E8",
    "[Peb] Dolphin Server-1",
    "[Peb] Dolphin Server-2",
    "[Peb] Promax Storage",
    "[Peb] DC Controller-1",
    "[Peb] DC Controller-2",
    "[Peb] Witness",
    "[Peb] Avitech Multiviewer",
    "[Peb] VX Router 48x48",
    "[Peb] Ross MC-1 MK",
    "[Peb] Aruba Switch",
    "[Card] Imagine DA HR6802+",
    "[Card] Imagine VEA 6800+",
    "[Card] Imagine ARG 6800+",
    "[Card] Imagine ACO 6800+",
    "[Card] GV VDA 1002",
    "[Card] GV HCO 3901",
    "[Card] GV FRS 1801",
    "[Card] GV HDA 3911",
    "[Card] GV HDA 3941",
    "[Card] GV HDA 1911",
    "[Card] GV HDA 1851",
    "[Card] GV HDA 1941",
    "[Card] GV HDA 3931",
    "[Card] GV ADX 1842",
    "[Card] GV AMX 1842",
    "[Card] GV ACO 1822",
    "[Card] GV ADA 1023",
    "Other"
  ];
  const mcrDevices = [
    "[Clock] Leitch Analog",
    "[Clock] Leitch Digital",
    "[Monitor] Samsung 50\" #1",
    "[Monitor] Samsung 50\" #2",
    "[Monitor] Sony Trimaster PGM",
    "[Monitor] Sony Trimaster PVW",
    "[PC] Bridging-MCR",
    "[PC] CG Xpression",
    "[PC] Countdown",
    "[PC] Elite Playout",
    "[PC] MAC Playout",
    "MatrixPlus-TTV",
    "Miranda CP 1604-Emergency Switch",
    "Miranda IMC Panel",
    "RTS KP 32/16-CNN",
    "RTS KP 4016-Trans7",
    "Tektronix WFM 5250",
    "Wohler Amp1-D8",
    "[Peb] PC Client-1",
    "[Peb] PC Client-2",
    "[Peb] PC Bridging",
    "[Peb] MC-1 Touch Screen Panel",
    "[Peb] Monitor Sony 65-1",
    "[Peb] Monitor Sony 65-2",
    "Other"
  ];
  const qcDevices = ["[PC] Booth #1", "[PC] Booth #2", "[PC] Booth #3", "NAS Storage", "Tektronix WFM 5250", "Other"];

  return (
    <div className="space-y-4 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 font-sans">
      <h3 className="text-xs font-bold uppercase tracking-wider border-b border-slate-200 pb-3" style={{ color: '#2b2f60' }}>Choose Devices (CAR, MCR, QC)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CAR Devices */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">CAR Devices</label>
          <select value={formData.carDevice || ""} onChange={(e) => setFormData({ ...formData, carDevice: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium">
            <option value="">-- CAR Devices --</option>
            {carDevices.map((dev, idx) => <option key={idx} value={dev}>{dev}</option>)}
          </select>
        </div>

        {/* MCR Devices */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">MCR Devices</label>
          <select value={formData.mcrDevice || ""} onChange={(e) => setFormData({ ...formData, mcrDevice: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium">
            <option value="">-- MCR Devices --</option>
            {mcrDevices.map((dev, idx) => <option key={idx} value={dev}>{dev}</option>)}
          </select>
        </div>

        {/* QC Devices */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">QC Devices</label>
          <select value={formData.qcDevice || ""} onChange={(e) => setFormData({ ...formData, qcDevice: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#2b2f60] font-medium">
            <option value="">-- QC Devices --</option>
            {qcDevices.map((dev, idx) => <option key={idx} value={dev}>{dev}</option>)}
          </select>
        </div>

      </div>
    </div>
  );
}