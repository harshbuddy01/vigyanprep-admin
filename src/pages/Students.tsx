import { useState, useEffect } from 'react';
import { Search, X, Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function Students() {
  const token = useAuthStore((state) => state.token);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Email / Notification Modal State
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyStudent, setNotifyStudent] = useState<any>(null);
  const [notifyChannel, setNotifyChannel] = useState<'email' | 'whatsapp'>('email');
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [sendingNotify, setSendingNotify] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/students`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (data.students) {
          setStudents(data.students);
        }
      } catch (err) {
        console.error('Failed to fetch students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const openNotifyModal = (student: any, channel: 'email' | 'whatsapp') => {
    setNotifyStudent(student);
    setNotifyChannel(channel);
    setNotifySubject(`📢 Important Update for ${student.full_name || student.name || 'Student'}`);
    setNotifyMessage(`Dear ${student.full_name || student.name || 'Student'},\n\nYour upcoming test series paper for IISER/NEST is scheduled soon. Please log in to your student dashboard to view your Exam Pass.\n\nBest regards,\nVIGYAN.prep Team`);
    setNotifySuccess(null);
    setShowNotifyModal(true);
  };

  const handleSendNotification = async () => {
    if (!notifyStudent) return;
    setSendingNotify(true);
    setNotifySuccess(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/students/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          studentEmail: notifyStudent.email,
          studentName: notifyStudent.full_name || notifyStudent.name,
          channel: notifyChannel,
          subject: notifySubject,
          message: notifyMessage
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (notifyChannel === 'whatsapp' && data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
          setNotifySuccess('WhatsApp chat link opened in new tab!');
        } else {
          setNotifySuccess('📧 Email sent successfully via AWS SES!');
        }
        setTimeout(() => setShowNotifyModal(false), 2000);
      } else {
        alert(`Failed: ${data.error || 'Could not send notification'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSendingNotify(false);
    }
  };

  const filteredStudents = students.filter(s =>
    (s.full_name || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Students Management</h1>

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-neutral-400 font-mono">Loading real students...</div>
        ) : (
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id || s.email} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{s.full_name || s.name || 'Student'}</td>
                  <td className="px-6 py-4 font-mono text-xs">{s.email}</td>
                  <td className="px-6 py-4">{s.role || 'student'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {s.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {/* Send Email Button */}
                    <button
                      onClick={() => openNotifyModal(s, 'email')}
                      title="Send AWS SES Email"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium transition-colors"
                    >
                      <Mail size={14} /> Email
                    </button>

                    {/* Send WhatsApp Button */}
                    <button
                      onClick={() => openNotifyModal(s, 'whatsapp')}
                      title="Send WhatsApp Message"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium transition-colors"
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </button>

                    {/* View Details Button */}
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="text-neutral-400 hover:text-white text-xs underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-neutral-400">No students found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Student Profile</h2>
              <button onClick={() => setSelectedStudent(null)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 text-neutral-300">
              <p><strong className="text-white">Name:</strong> {selectedStudent.full_name || selectedStudent.name}</p>
              <p><strong className="text-white">Email:</strong> {selectedStudent.email}</p>
              <p><strong className="text-white">Role:</strong> {selectedStudent.role || 'Student'}</p>
              <p><strong className="text-white">Status:</strong> {selectedStudent.status || 'Active'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal (Email & WhatsApp) */}
      {showNotifyModal && notifyStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                {notifyChannel === 'email' ? <Mail className="text-amber-400" size={20} /> : <MessageSquare className="text-emerald-400" size={20} />}
                <h2 className="text-lg font-bold text-white">
                  {notifyChannel === 'email' ? 'Send AWS Email' : 'Send WhatsApp Message'}
                </h2>
              </div>
              <button onClick={() => setShowNotifyModal(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="text-xs text-neutral-400 font-mono bg-neutral-950 p-3 rounded border border-white/5">
              Recipient: <span className="text-amber-300 font-bold">{notifyStudent.full_name || notifyStudent.name}</span> ({notifyStudent.email})
            </div>

            {notifyChannel === 'email' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">Subject</label>
                <input
                  type="text"
                  value={notifySubject}
                  onChange={(e) => setNotifySubject(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">Message</label>
              <textarea
                rows={5}
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-sm font-mono"
              />
            </div>

            {notifySuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-sm flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} /> {notifySuccess}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNotifyModal(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sendingNotify}
                className={`px-5 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2 transition-all ${
                  notifyChannel === 'email'
                    ? 'bg-amber-400 hover:bg-amber-300'
                    : 'bg-emerald-400 hover:bg-emerald-300'
                }`}
              >
                {sendingNotify ? (
                  'Sending...'
                ) : (
                  <>
                    <Send size={16} /> {notifyChannel === 'email' ? 'Send Email (AWS)' : 'Open WhatsApp'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
