import { useState } from 'react';
import { Settings as SettingsIcon, Save, AlertTriangle, Globe } from 'lucide-react';

export function Settings() {
  const [siteName, setSiteName] = useState('VIGYAN.PREP');
  const [supportEmail, setSupportEmail] = useState('support@vigyanprep.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="text-amber-400" /> Platform Settings
        </h1>
        <p className="text-sm text-neutral-400 mt-1">Configure global application parameters, branding, and status</p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          ✅ Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-neutral-800/50 border border-white/10 rounded-xl p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <Globe size={18} className="text-amber-400" /> General Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <AlertTriangle size={18} className="text-amber-400" /> Maintenance & Control
          </h2>
          <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-white/5">
            <div>
              <div className="font-semibold text-white text-sm">Maintenance Mode</div>
              <div className="text-xs text-neutral-400 mt-0.5">
                Enable to display maintenance alert banner across the student portal
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                maintenanceMode ? 'bg-amber-400' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-neutral-950 absolute top-0.5 transition-transform ${
                  maintenanceMode ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-sm flex items-center gap-2 transition"
        >
          <Save size={16} /> Save Platform Settings
        </button>
      </form>
    </div>
  );
}
