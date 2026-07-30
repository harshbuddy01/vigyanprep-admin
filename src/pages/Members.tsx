import { useState, useEffect } from 'react';
import { Shield, UserPlus, CheckCircle } from 'lucide-react';

type Member = {
  id: string;
  email: string;
  role: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
};

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Content Manager');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/members`);
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');
      setMsg('Admin member added successfully!');
      setShowModal(false);
      setEmail('');
      setFullName('');
      fetchMembers();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-amber-400" /> Admin Team & Members
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Manage sub-admins, examiners, and content creators</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-neutral-950 px-4 py-2 rounded-lg font-bold hover:opacity-90 transition"
        >
          <UserPlus size={18} />
          Add Admin Member
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm flex items-center gap-2">
          <CheckCircle size={18} /> {msg}
        </div>
      )}

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-900/50 text-xs uppercase text-neutral-400 border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-6 py-4 font-semibold text-white">{m.full_name || 'Admin'}</td>
                <td className="px-6 py-4">{m.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    {m.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-neutral-400">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-white">Add New Admin Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                  placeholder="rahul@vigyanprep.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Examiner">Examiner (Test Creator)</option>
                  <option value="Content Manager">Content Manager</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-neutral-800 text-neutral-300 rounded-lg text-sm font-semibold hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-amber-400 text-neutral-950 rounded-lg text-sm font-bold hover:bg-amber-300 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
