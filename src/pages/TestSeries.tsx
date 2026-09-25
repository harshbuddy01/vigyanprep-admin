import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Eye, Lock, CheckCircle2, AlertCircle, Trash2,
  BarChart3, Send, Hammer, Edit3, BookOpen, Rocket, Trophy, Activity, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

function toLocalInputString(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export function TestSeries() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'expired' | 'draft'>('all');

  // Create Form state
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('IAT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('180');
  const [description, setDescription] = useState('');

  // Edit Form state
  const [editTitle, setEditTitle] = useState('');
  const [editExamType, setEditExamType] = useState('IAT');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editDuration, setEditDuration] = useState('180');
  const [editDescription, setEditDescription] = useState('');

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTests(data.tests || []);
      } else {
        setTests([]);
      }
    } catch (err) {
      console.error('Failed to load test series:', err);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleExamTypeChange = (type: string) => {
    setExamType(type);
    if (type === 'CMI') setDuration('210');
    else setDuration('180');
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title,
          name: title,
          exam_type: examType,
          window_start: new Date(startDate + ':00+05:30').toISOString(),
          window_end: new Date(endDate + ':00+05:30').toISOString(),
          duration_minutes: parseInt(duration, 10) || 180,
          description
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowCreateModal(false);
        fetchTests();
        setTitle(''); setExamType('IAT'); setStartDate(''); setEndDate(''); setDuration('180'); setDescription('');
      } else {
        alert('Error creating test series paper: ' + (data.error || data.message || 'Server error'));
      }
    } catch (err: any) {
      alert('Error creating test series paper: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (t: any) => {
    setSelectedTest(t);
    setEditTitle(t.title || t.name || '');
    setEditExamType(t.exam_type || 'IAT');
    setEditStartDate(toLocalInputString(t.window_start));
    setEditEndDate(toLocalInputString(t.window_end));
    setEditDuration(String(t.duration_minutes || 180));
    setEditDescription(t.description || '');
    setShowEditModal(true);
  };

  const handleUpdateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series/${selectedTest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title: editTitle,
          name: editTitle,
          exam_type: editExamType,
          window_start: editStartDate ? new Date(editStartDate + ':00+05:30').toISOString() : undefined,
          window_end: editEndDate ? new Date(editEndDate + ':00+05:30').toISOString() : undefined,
          duration_minutes: parseInt(editDuration, 10) || 180,
          description: editDescription
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowEditModal(false);
        fetchTests();
      } else {
        alert('Error updating test details: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error updating test details: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFreezeTest = async (test: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series/${test.id}/freeze`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert('✅ Test paper frozen successfully. No further edits allowed.');
        fetchTests();
      } else {
        alert('🔒 PREVIEW QUALITY GATE BLOCKED: ' + (data.error || 'Complete an admin preview run before freezing.'));
      }
    } catch (err: any) {
      alert('Error freezing test: ' + err.message);
    }
  };

  const handleDeleteTest = async (test: any) => {
    if (!window.confirm(`Are you sure you want to delete "${test.title || test.name}"? This will delete all questions and cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series/${test.id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        fetchTests();
      } else {
        alert('Failed: ' + (data.error || 'Server error'));
      }
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  const handleCalculateRankings = async (test: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/results/calculate/${test.id}`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Rankings calculated for ${data.count || 0} students!`);
        fetchTests();
      } else {
        alert('Failed to calculate rankings: ' + (data.error || 'Server error'));
      }
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  const handleReleaseResults = async (test: any) => {
    const status = getTestStatus(test);
    if (status === 'upcoming' || status === 'live') {
      alert(`❌ Action Blocked: You cannot release results while the exam is UPCOMING or LIVE.\n\nResults can only be released after the test window ends on ${formatDate(test.window_end)}.`);
      return;
    }

    if (!window.confirm(`Release results for "${test.title || test.name}"?\n\nThis will allow students to see their scorecards, solutions, and All-India Rankings.`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/results/release/${test.id}`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Results released! ${data.notified || 0} students notified.`);
        fetchTests();
      } else {
        alert('Failed to release results: ' + (data.error || 'Server error'));
      }
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  const getTestStatus = (test: any) => {
    if (test.status === 'draft') return 'draft';
    const now = new Date();
    const start = new Date(test.window_start);
    const end = new Date(test.window_end);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'live';
    return 'expired';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
      case 'upcoming': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'live': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse';
      case 'expired': return 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60';
      default: return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not Scheduled';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
    });
  };

  const liveCount = tests.filter(t => getTestStatus(t) === 'live').length;
  const upcomingCount = tests.filter(t => getTestStatus(t) === 'upcoming').length;
  const expiredCount = tests.filter(t => getTestStatus(t) === 'expired').length;
  const draftCount = tests.filter(t => getTestStatus(t) === 'draft').length;

  const filteredTests = tests.filter(t => {
    if (statusFilter === 'all') return true;
    return getTestStatus(t) === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-zinc-100 font-sans">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Paid Test Series Management</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60 uppercase tracking-wider">
              Allen 24h Model
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Schedule live test windows, assemble papers from Question Bank, and release All-India rankings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/paper-builder?type=test_series')}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Rocket size={14} /> Paper Builder / Upload PDF
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-lg border border-zinc-700/80 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={14} /> Schedule Window
          </button>
        </div>
      </div>

      {/* State Filter Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
            statusFilter === 'all'
              ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm'
              : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
          }`}
        >
          <span>All Papers</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'all' ? 'bg-zinc-700 text-zinc-200 font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {tests.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('live')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
            statusFilter === 'live'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
          <span>Live Now</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'live' ? 'bg-rose-500/25 text-rose-200 font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {liveCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('upcoming')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
            statusFilter === 'upcoming'
              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm'
              : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
          }`}
        >
          <span>Upcoming</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'upcoming' ? 'bg-blue-500/25 text-blue-200 font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {upcomingCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('expired')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
            statusFilter === 'expired'
              ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm'
              : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
          }`}
        >
          <span>Concluded / Past</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'expired' ? 'bg-zinc-700 text-zinc-200 font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {expiredCount}
          </span>
        </button>

        {draftCount > 0 && (
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              statusFilter === 'draft'
                ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm'
                : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
            }`}
          >
            <span>Drafts</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'draft' ? 'bg-zinc-700 text-zinc-200 font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
              {draftCount}
            </span>
          </button>
        )}
      </div>

      {/* Main Tests Table */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 space-y-3 bg-[#13151b] border border-white/[0.07] rounded-xl">
          <div className="w-7 h-7 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium text-zinc-400">Loading test series...</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="p-16 text-center text-zinc-500 space-y-3 bg-[#13151b] border border-white/[0.07] rounded-xl">
          <BookOpen size={36} className="mx-auto text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-200">No Test Series Created Yet</p>
          <p className="text-xs text-zinc-500">Click &quot;Schedule Window&quot; above to schedule your first test.</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="p-16 text-center text-zinc-500 space-y-3 bg-[#13151b] border border-white/[0.07] rounded-xl">
          <p className="text-sm font-semibold text-zinc-200">No tests match the selected filter &apos;{statusFilter}&apos;</p>
          <button
            onClick={() => setStatusFilter('all')}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition"
          >
            Show All Tests
          </button>
        </div>
      ) : (
        <div className="bg-[#13151b] border border-white/[0.07] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#181a22] text-[10px] uppercase tracking-wider text-zinc-400 border-b border-white/[0.07]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Paper Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Window Start (IST)</th>
                  <th className="px-5 py-3 font-semibold">Window End (IST)</th>
                  <th className="px-4 py-3 font-semibold">Duration</th>
                  <th className="px-4 py-3 font-semibold text-center">Quality Gate</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                  <th className="px-5 py-3 font-semibold text-center">Results</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredTests.map((t) => {
                  const status = getTestStatus(t);
                  const isReleased = !!(t.response_released_at || t.result_released_at);
                  return (
                    <tr key={t.id} className="hover:bg-zinc-800/25 transition">
                      <td className="px-5 py-3.5 font-medium text-zinc-100 max-w-xs truncate">
                        {t.title || t.name}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-zinc-300">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-[11px] font-mono">
                          {t.exam_type || 'IAT'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">
                        {formatDate(t.window_start)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">
                        {formatDate(t.window_end)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-zinc-300">
                        {t.duration_minutes || 180}m
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {t.preview_status === 'valid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Validated
                          </span>
                        ) : (
                          <a
                            href={`/preview/${t.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300/90 border border-amber-500/20 transition cursor-pointer"
                            title="Click to perform quick preview verification"
                          >
                            <AlertCircle size={11} /> Needs Preview
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${getStatusColor(status)}`}>
                          {status === 'live' ? 'LIVE NOW' : status === 'expired' ? 'ENDED' : status}
                        </span>
                      </td>

                      {/* Results Column */}
                      <td className="px-5 py-3.5 text-center">
                        {isReleased ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Released
                          </span>
                        ) : status === 'expired' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleCalculateRankings(t)}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md text-[10px] font-medium transition flex items-center gap-1 cursor-pointer"
                              title="Calculate Rankings & Percentiles"
                            >
                              <BarChart3 size={11} /> Calc
                            </button>
                            <button
                              onClick={() => handleReleaseResults(t)}
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-md text-[10px] font-medium transition flex items-center gap-1 cursor-pointer"
                              title="Release Results to Students"
                            >
                              <Send size={11} /> Release
                            </button>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium text-zinc-500 bg-zinc-800/40 border border-zinc-800" title="Results can only be released after test window concludes">
                            Locked
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isReleased ? (
                            <>
                              <a
                                href="/results"
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition text-xs font-medium flex items-center gap-1 cursor-pointer"
                                title="View Complete All-India Merit List & Scorecards"
                              >
                                <Trophy size={12} /> Merit List
                              </a>
                              <a
                                href={`/preview/${t.id}`}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer"
                                title="View Question Paper & Master Solutions"
                              >
                                <Eye size={13} />
                              </a>
                              <div
                                className="p-1.5 rounded-lg bg-zinc-800/40 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                                title="Scores Declared — Raw Question Modifications are Locked"
                              >
                                <ShieldCheck size={13} className="text-zinc-500" />
                              </div>
                            </>
                          ) : status === 'live' ? (
                            <>
                              <a
                                href="/live-invigilation"
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                title="Open Live Proctoring & Invigilation Monitor"
                              >
                                <Activity size={12} /> Invigilation
                              </a>
                              <a
                                href={`/preview/${t.id}`}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer"
                                title="Student CBT Preview Mode"
                              >
                                <Eye size={13} />
                              </a>
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                                title="Extend Live Window End Time"
                              >
                                <Edit3 size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <a
                                href={`/paper-builder/${t.id}`}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer"
                                title="Assemble & Edit Questions in Paper Builder"
                              >
                                <Hammer size={13} />
                              </a>

                              <a
                                href={`/preview/${t.id}`}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer"
                                title="Student CBT Preview Mode"
                              >
                                <Eye size={13} />
                              </a>

                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                                title="Edit Test Details (Name, Timings, Dates)"
                              >
                                <Edit3 size={13} />
                              </button>

                              {t.status !== 'frozen' && (
                                <button
                                  onClick={() => handleFreezeTest(t)}
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                                  title="Freeze Test Paper (Lock Edits Before Exam)"
                                >
                                  <Lock size={13} />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteTest(t)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700 transition cursor-pointer"
                                title="Delete Test Paper"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#14171d] text-zinc-100 border border-white/[0.08] rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100">Create Test Series Paper</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Paper Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. IISER IAT 2026 Full Length Mock 01"
                  className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Exam Type</label>
                  <select
                    value={examType}
                    onChange={(e) => handleExamTypeChange(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  >
                    <option value="IAT">IISER IAT</option>
                    <option value="NEST">NISER NEST</option>
                    <option value="CMI">CMI Entrance</option>
                    <option value="IISc">IISc Entrance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Window Start (IST) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Window End (IST) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Description / Instructions</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Official 24-hour test window instructions..."
                  className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Test Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL (Name, Timings, Dates) */}
      {showEditModal && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#14171d] text-zinc-100 border border-white/[0.08] rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={15} className="text-zinc-400" />
                <h3 className="text-base font-semibold text-zinc-100">Edit Test Details & Timings</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateTest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Paper Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Exam Type</label>
                  <select
                    value={editExamType}
                    onChange={(e) => setEditExamType(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  >
                    <option value="IAT">IISER IAT</option>
                    <option value="NEST">NISER NEST</option>
                    <option value="CMI">CMI Entrance</option>
                    <option value="IISc">IISc Entrance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Window Start (IST) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Window End (IST) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Description / Instructions</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0d0f12] border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
