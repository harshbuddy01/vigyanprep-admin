import { useState, useEffect } from 'react';
import {
  Search, X, Mail, MessageSquare, Send, CheckCircle2,
  Sparkles, Clock, Copy, Plus, RefreshCw, AlertCircle, ExternalLink,
  UserCheck, Phone
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function Students() {
  const token = useAuthStore((state) => state.token);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Tabs: 'enrolled' | 'demos'
  const [activeTab, setActiveTab] = useState<'enrolled' | 'demos'>('enrolled');

  // VIP Demo Passes State
  const [demoPasses, setDemoPasses] = useState<any[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showCreateDemoModal, setShowCreateDemoModal] = useState(false);

  // Pending Trial Approval State
  const [approvingTrialId, setApprovingTrialId] = useState<string | null>(null);
  const [rejectingTrialId, setRejectingTrialId] = useState<string | null>(null);

  // Create Demo Form State
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoExams, setDemoExams] = useState<string[]>(['IAT']);
  const [demoPassword, setDemoPassword] = useState('');
  const [demoNotes, setDemoNotes] = useState('');
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [createDemoError, setCreateDemoError] = useState<string | null>(null);
  const [createdDemoResult, setCreatedDemoResult] = useState<any | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Email / Notification Modal State
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyStudent, setNotifyStudent] = useState<any>(null);
  const [notifyChannel, setNotifyChannel] = useState<'email' | 'whatsapp'>('email');
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [sendingNotify, setSendingNotify] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

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

  const fetchDemoPasses = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/trial/list`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success && data.trials) {
        setDemoPasses(data.trials);
      }
    } catch (err) {
      console.error('Failed to fetch demo passes:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchDemoPasses();
  }, [token]);

  const openCreateDemoModal = () => {
    setDemoName('');
    setDemoEmail('');
    setDemoExams(['IAT']);
    setDemoPassword(`VP-${Math.floor(100000 + Math.random() * 900000)}`);
    setDemoNotes('');
    setCreateDemoError(null);
    setCreatedDemoResult(null);
    setCopiedInvite(false);
    setShowCreateDemoModal(true);
  };

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail.trim()) {
      setCreateDemoError('Student email is required');
      return;
    }
    if (demoExams.length === 0) {
      setCreateDemoError('Please select at least one target exam');
      return;
    }
    setCreatingDemo(true);
    setCreateDemoError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/trial/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          name: demoName.trim(),
          email: demoEmail.trim(),
          targetExam: demoExams.join(', '),
          bundleIncludes: demoExams,
          customPassword: demoPassword.trim(),
          notes: demoNotes.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCreatedDemoResult(data.trial);
        fetchDemoPasses();
      } else {
        setCreateDemoError(data.error || 'Failed to create trial pass');
      }
    } catch (err: any) {
      setCreateDemoError(err.message || 'Network error');
    } finally {
      setCreatingDemo(false);
    }
  };

  const handleExtendDemo = async (id: string, name: string) => {
    if (!confirm(`Extend 24-Hour Trial Pass for ${name} by +24 hours?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/trial/extend/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ hours: 24 })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✓ Trial pass extended by 24 hours!`);
        fetchDemoPasses();
      } else {
        alert(`Failed: ${data.error || 'Could not extend pass'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRevokeDemo = async (id: string, name: string) => {
    if (!confirm(`Revoke VIP Demo Pass for ${name} immediately? The student will no longer be able to access the test series.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/trial/revoke/${id}`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✓ Trial pass revoked.`);
        fetchDemoPasses();
      } else {
        alert(`Failed: ${data.error || 'Could not revoke pass'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleApproveTrial = async (trial: any) => {
    if (!confirm(`Approve 24-Hour VIP Demo Pass for ${trial.name} (${trial.email})? A confirmation email with their temporary password will be sent automatically.`)) return;
    setApprovingTrialId(trial.id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/trial/approve/${trial.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✓ Pass Approved Successfully!\n\nEmail confirmation sent to: ${trial.email}\nTemporary Password: ${data.password}\n\nWhatsApp invite copied to clipboard!`);
        if (data.whatsappInvite) {
          navigator.clipboard.writeText(data.whatsappInvite);
          setCopiedInvite(true);
          setTimeout(() => setCopiedInvite(false), 3000);
        }
        fetchDemoPasses();
      } else {
        alert(`Failed: ${data.error || 'Could not approve request'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setApprovingTrialId(null);
    }
  };

  const handleRejectTrial = async (trial: any) => {
    if (!confirm(`Dismiss trial request from ${trial.name} (${trial.email})?`)) return;
    setRejectingTrialId(trial.id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/trial/reject/${trial.id}`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDemoPasses();
      } else {
        alert(`Failed: ${data.error || 'Could not dismiss request'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRejectingTrialId(null);
    }
  };

  const copyWhatsAppTemplate = (trial: any) => {
    const invite = trial.whatsappInvite ||
`*🏆 VigyanPrep VIP 24-Hour CBT Pass*

Hello ${trial.name || 'Student'}! Here are your credentials for 24-hour full access to the official VigyanPrep exam simulation:

🌐 *Test Portal:* https://test.vigyanprep.com
📧 *Email:* ${trial.email}
🔑 *Temporary Password:* ${trial.password || 'Use your registered password'}
🎯 *Target Exam:* ${trial.targetExam || 'IAT'}
⏳ *Validity:* Exactly 24 Hours

_Note: Includes full practice tests (IAT 01-03, JEE 01), authentic NTA CBT layout, scientific calculator & AIR rank analysis. Best of luck!_`;

    navigator.clipboard.writeText(invite);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 3000);
  };

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

  const filteredStudents = students.filter((s: any) =>
    (s.full_name || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingTrials = demoPasses.filter((t: any) => t.status === 'pending');
  const nonPendingDemoPasses = demoPasses.filter((t: any) => t.status !== 'pending');

  const filteredDemoPasses = nonPendingDemoPasses.filter((t: any) =>
    (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDemoCount = demoPasses.filter((t: any) => t.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Students Management</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Enrolled aspirants, access passes &amp; 24-hour VIP demo accounts
          </p>
        </div>

        {/* Action Button: Generate 24h VIP Demo Pass */}
        <button
          onClick={openCreateDemoModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Sparkles size={16} />
          <span>+ Generate 24h VIP Demo Pass</span>
        </button>
      </div>

      {/* 🔔 Real-Time VIP Trial Requests Notification Bar */}
      {pendingTrials.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-amber-500/10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black text-lg shadow-md shrink-0">
              🔔
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                <span>{pendingTrials.length} Student Trial Request{pendingTrials.length > 1 ? 's' : ''} Awaiting Approval</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-mono font-black uppercase">
                  Action Required
                </span>
              </h4>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                Students requested a 24-hour VIP demo pass from the website. Click below to review their details and automatically send their login password via email.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('demos')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-extrabold text-xs uppercase tracking-wider shrink-0 transition shadow-md cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Review &amp; Approve ({pendingTrials.length}) →</span>
          </button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'enrolled'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <span>Enrolled Students</span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono">
            {students.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('demos')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'demos'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles size={13} className="text-amber-400" />
          <span>VIP 24h Demo Passes</span>
          {pendingTrials.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-mono font-black animate-pulse">
              {pendingTrials.length} Pending
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeDemoCount > 0 ? 'bg-amber-400 text-black' : 'bg-white/10 text-neutral-400'
          }`}>
            {activeDemoCount} Active
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: ENROLLED STUDENTS
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'enrolled' && (
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder="Search enrolled students by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
              />
            </div>
            <button
              onClick={fetchStudents}
              className="p-2 rounded-lg bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white transition"
              title="Refresh Students"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-neutral-400 font-mono text-sm">Loading enrolled students...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900/60 text-xs uppercase text-neutral-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map((s: any) => (
                    <tr key={s.id || s.email} className="hover:bg-white/[0.03] transition">
                      <td className="px-6 py-3.5 font-medium text-white">{s.full_name || s.name || 'Student'}</td>
                      <td className="px-6 py-3.5 font-mono text-xs">{s.email}</td>
                      <td className="px-6 py-3.5 capitalize">{s.role || 'student'}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {s.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openNotifyModal(s, 'email')}
                          title="Send AWS SES Email"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
                        >
                          <Mail size={13} /> Email
                        </button>

                        <button
                          onClick={() => openNotifyModal(s, 'whatsapp')}
                          title="Send WhatsApp Message"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                        >
                          <MessageSquare size={13} /> WhatsApp
                        </button>

                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="text-neutral-400 hover:text-white text-xs underline cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-neutral-400 text-sm">No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: VIP 24-HOUR DEMO PASSES
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'demos' && (
        <div className="space-y-6">
          {/* ⚡ PENDING TRIAL REQUESTS (NEEDS ADMIN APPROVAL) */}
          {pendingTrials.length > 0 && (
            <div className="bg-gradient-to-br from-amber-500/10 via-neutral-900 to-amber-500/5 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center font-bold text-sm shadow-md">
                    🔔
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                      <span>Pending Website Demo Requests</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-mono font-black animate-pulse">
                        {pendingTrials.length} Awaiting Activation
                      </span>
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Students entered their email &amp; name on vigyanprep.com/tests. Click <strong>"Approve &amp; Email Pass"</strong> to start their 24h timer and automatically dispatch their login password via Brevo email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-300">
                  <thead className="bg-neutral-950/60 text-xs uppercase text-amber-300/80 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-2.5">Student</th>
                      <th className="px-4 py-2.5">Target Exam</th>
                      <th className="px-4 py-2.5">Phone / Contact</th>
                      <th className="px-4 py-2.5">Requested At</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingTrials.map((trial: any) => {
                      const isApproving = approvingTrialId === trial.id;
                      const isRejecting = rejectingTrialId === trial.id;
                      return (
                        <tr key={trial.id} className="hover:bg-white/[0.04] transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-white text-sm">{trial.name}</div>
                            <div className="font-mono text-xs text-amber-300">{trial.email}</div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                              {(trial.bundleIncludes && trial.bundleIncludes.join(', ')) || 'IAT'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-xs text-neutral-400">
                            {trial.phone ? (
                              <a
                                href={`https://wa.me/${trial.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <Phone size={12} />
                                <span>{trial.phone}</span>
                              </a>
                            ) : (
                              <span className="text-neutral-600 italic">None provided</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-xs text-neutral-400">
                            {trial.createdAt ? new Date(trial.createdAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </td>

                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleApproveTrial(trial)}
                              disabled={isApproving || isRejecting}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-700 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                            >
                              {isApproving ? (
                                <>
                                  <RefreshCw size={13} className="animate-spin" />
                                  <span>Activating...</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck size={13} />
                                  <span>Approve &amp; Email Pass</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleRejectTrial(trial)}
                              disabled={isApproving || isRejecting}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-white/10 text-xs transition cursor-pointer"
                            >
                              <span>Dismiss</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACTIVE & HISTORICAL VIP DEMO PASSES */}
          <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden shadow-lg space-y-0">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder="Search trial passes by name, email, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
              />
            </div>
            <button
              onClick={fetchDemoPasses}
              className="p-2 rounded-lg bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white transition"
              title="Refresh Demo Passes"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {demoLoading ? (
            <div className="p-8 text-center text-neutral-400 font-mono text-sm">Loading 24-hour VIP demo passes...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900/60 text-xs uppercase text-neutral-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Target Exam</th>
                    <th className="px-6 py-3.5">Created</th>
                    <th className="px-6 py-3.5">Expiry &amp; Countdown</th>
                    <th className="px-6 py-3.5">Notes</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDemoPasses.map((trial: any) => {
                    const isActive = trial.status === 'active';
                    return (
                      <tr key={trial.id} className="hover:bg-white/[0.03] transition">
                        <td className="px-6 py-3.5">
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              {trial.name}
                              {isActive && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                              )}
                            </div>
                            <div className="font-mono text-xs text-neutral-400">{trial.email}</div>
                          </div>
                        </td>

                        <td className="px-6 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                            {(trial.bundleIncludes && trial.bundleIncludes[0]) || 'IAT'}
                          </span>
                        </td>

                        <td className="px-6 py-3.5 text-xs text-neutral-400">
                          {new Date(trial.startsAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}{' '}
                          <span className="text-neutral-500">
                            {new Date(trial.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="px-6 py-3.5">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Clock size={12} />
                              {trial.remainingFormatted}
                            </span>
                          ) : trial.status === 'revoked' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                              Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-700/50 text-neutral-400 border border-neutral-600">
                              Expired
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-3.5 text-xs text-neutral-400 max-w-[200px] truncate" title={trial.notes}>
                          {trial.notes || <span className="text-neutral-600 italic">No notes</span>}
                        </td>

                        <td className="px-6 py-3.5 text-right space-x-2">
                          {/* Copy WhatsApp Invite */}
                          <button
                            onClick={() => copyWhatsAppTemplate(trial)}
                            title="Copy WhatsApp Invite Text"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                          >
                            <Copy size={13} />
                            <span>Copy Invite</span>
                          </button>

                          {/* Extend +24h */}
                          <button
                            onClick={() => handleExtendDemo(trial.id, trial.name)}
                            title="Extend Validity by +24 Hours"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>+24h</span>
                          </button>

                          {/* Revoke */}
                          {isActive && (
                            <button
                              onClick={() => handleRevokeDemo(trial.id, trial.name)}
                              title="Revoke Trial Access Immediately"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs font-medium transition cursor-pointer"
                            >
                              <X size={13} />
                              <span>Revoke</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDemoPasses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400 text-sm">
                        No 24-hour VIP demo passes found. Click <strong>+ Generate 24h VIP Demo Pass</strong> to create one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: GENERATE 24-HOUR VIP DEMO PASS
         ══════════════════════════════════════════════════════════════════ */}
      {showCreateDemoModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-400" size={20} />
                <h2 className="text-lg font-bold text-white">Generate 24-Hour VIP Demo Pass</h2>
              </div>
              <button
                onClick={() => setShowCreateDemoModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {createdDemoResult ? (
              /* Success State: Show Credentials & WhatsApp Copy */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 font-bold text-base">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    <span>24-Hour VIP Demo Pass Activated!</span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    The student has full CBT access for exactly 24 hours.
                  </p>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-white/10 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-500">Student Name:</span>
                    <span className="font-bold text-white">{createdDemoResult.name}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-500">Login Email:</span>
                    <span className="font-bold text-amber-300">{createdDemoResult.email}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-500">Password:</span>
                    <span className="font-bold text-emerald-400">{createdDemoResult.password}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-500">Target Exam:</span>
                    <span className="font-bold text-white">{createdDemoResult.targetExam}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-500">Validity:</span>
                    <span className="font-bold text-amber-400">24 Hours (until tomorrow)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => copyWhatsAppTemplate(createdDemoResult)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <Copy size={15} />
                    <span>{copiedInvite ? '✓ Copied to Clipboard!' : 'Copy WhatsApp Invite'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(createdDemoResult.whatsappInvite)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition"
                  >
                    <ExternalLink size={14} />
                    <span>Open WhatsApp</span>
                  </a>
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => setShowCreateDemoModal(false)}
                    className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    Done &amp; Close
                  </button>
                </div>
              </div>
            ) : (
              /* Input Form */
              <form onSubmit={handleCreateDemo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Student Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Target Exams (Select One or More)
                    </label>
                    <button
                      type="button"
                      onClick={() => setDemoExams(['IAT', 'NEST', 'JEE', 'ISI_CMI'])}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Select All 4 Exams
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-2.5 rounded-lg border border-white/10">
                    {[
                      { id: 'IAT', label: 'IISER IAT' },
                      { id: 'NEST', label: 'NISER NEST' },
                      { id: 'JEE', label: 'JEE Main' },
                      { id: 'ISI_CMI', label: 'ISI / CMI' },
                    ].map(exam => {
                      const isChecked = demoExams.includes(exam.id);
                      return (
                        <label
                          key={exam.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                              : 'bg-neutral-900 border-white/5 text-neutral-400 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                if (demoExams.length > 1) {
                                  setDemoExams(demoExams.filter((e: string) => e !== exam.id));
                                }
                              } else {
                                setDemoExams([...demoExams, exam.id]);
                              }
                            }}
                            className="accent-amber-400 rounded cursor-pointer"
                          />
                          <span className="text-xs">{exam.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    value={demoPassword}
                    onChange={(e) => setDemoPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Lead Source / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WhatsApp enquiry from Patna / Telegram group"
                    value={demoNotes}
                    onChange={(e) => setDemoNotes(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                {createDemoError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{createDemoError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateDemoModal(false)}
                    className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingDemo}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-md"
                  >
                    {creatingDemo ? 'Generating...' : (
                      <>
                        <Sparkles size={14} />
                        <span>Activate 24h Pass</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Student Profile</h2>
              <button onClick={() => setSelectedStudent(null)} className="text-neutral-400 hover:text-white cursor-pointer">
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
              <button onClick={() => setShowNotifyModal(false)} className="text-neutral-400 hover:text-white cursor-pointer">
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
                className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sendingNotify}
                className={`px-5 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2 transition-all cursor-pointer ${
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
export default Students;
