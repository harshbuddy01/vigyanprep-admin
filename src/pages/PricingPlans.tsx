import { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle, XCircle, X, Pencil, Trash2, Layers } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

const EXAM_OPTIONS = ['IAT', 'NEST', 'CMI'];

interface SubscriptionPlan {
  id: string;
  exam_type: string;
  name: string;
  duration_days: number;
  price: number;
  discount_price: number | null;
  active: boolean;
  bundle_includes: string[] | null;
}

type ModalMode = 'create' | 'edit';

const defaultForm = {
  examType: 'IAT',
  name: 'IISER IAT 90-Day Series Pass',
  durationDays: '90',
  price: '999',
  discountPrice: '499',
  isBundle: false,
  bundleIncludes: [] as string[],
};

export function PricingPlans() {
  const token = useAuthStore((state) => state.token);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [examType, setExamType] = useState(defaultForm.examType);
  const [name, setName] = useState(defaultForm.name);
  const [durationDays, setDurationDays] = useState(defaultForm.durationDays);
  const [price, setPrice] = useState(defaultForm.price);
  const [discountPrice, setDiscountPrice] = useState(defaultForm.discountPrice);
  const [isBundle, setIsBundle] = useState(false);
  const [bundleIncludes, setBundleIncludes] = useState<string[]>([]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/tests/plans`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.plans) setPlans(data.plans);
    } catch (err) {
      console.error('Failed to fetch pricing plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingPlanId(null);
    setExamType(defaultForm.examType);
    setName(defaultForm.name);
    setDurationDays(defaultForm.durationDays);
    setPrice(defaultForm.price);
    setDiscountPrice(defaultForm.discountPrice);
    setIsBundle(false);
    setBundleIncludes([]);
    setShowModal(true);
  };

  const openEditModal = (p: SubscriptionPlan) => {
    setModalMode('edit');
    setEditingPlanId(p.id);
    const planIsBundle = p.exam_type === 'BUNDLE' || (Array.isArray(p.bundle_includes) && p.bundle_includes.length > 1);
    setIsBundle(planIsBundle);
    setExamType(planIsBundle ? 'BUNDLE' : p.exam_type);
    setBundleIncludes(p.bundle_includes || []);
    setName(p.name);
    setDurationDays(String(p.duration_days));
    setPrice(String(p.price));
    setDiscountPrice(p.discount_price ? String(p.discount_price) : '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlanId(null);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBundle && bundleIncludes.length < 2) {
      alert('A Bundle plan must include at least 2 exam types.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        exam_type: isBundle ? 'BUNDLE' : examType,
        name,
        duration_days: parseInt(durationDays) || 90,
        price: parseFloat(price),
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        active: true,
        bundle_includes: isBundle ? bundleIncludes : null,
      };

      const url = modalMode === 'edit' && editingPlanId
        ? `${API_BASE}/api/admin/tests/plans/${editingPlanId}`
        : `${API_BASE}/api/admin/tests/plans`;
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        closeModal();
        fetchPlans();
      } else {
        alert('Error saving plan: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error saving plan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: SubscriptionPlan) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tests/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ active: !plan.active })
      });
      if (res.ok) fetchPlans();
    } catch {
      alert('Failed to update plan status');
    }
  };

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.\n\nNote: Plans with active student subscriptions cannot be deleted — disable them instead.`)) return;
    setDeletingId(plan.id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/tests/plans/${plan.id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPlans();
      } else {
        alert('Cannot delete: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleBundleExam = (exam: string) => {
    setBundleIncludes(prev =>
      prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="text-amber-500 dark:text-amber-400" /> Pricing & Subscription Plans
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Assign subscription prices, discounts, and access durations for paid Test Series packages.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-500 transition-colors shadow"
        >
          <Plus size={20} />
          Create New Plan
        </button>
      </div>

      {loading ? (
        <div className="text-slate-600 dark:text-white">Loading pricing plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isBundle = p.exam_type === 'BUNDLE' || (Array.isArray(p.bundle_includes) && p.bundle_includes.length > 1);
            return (
              <div
                key={p.id}
                className={`p-6 rounded-xl border space-y-4 transition shadow-sm ${
                  p.active
                    ? 'bg-white dark:bg-neutral-800/60 border-amber-400/40 dark:border-amber-500/30'
                    : 'bg-slate-100 dark:bg-neutral-900/40 border-slate-200 dark:border-white/5 opacity-60'
                }`}
              >
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    {/* Exam type badge(s) */}
                    {isBundle && p.bundle_includes && p.bundle_includes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.bundle_includes.map(exam => (
                          <span key={exam} className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-400/20 text-purple-800 dark:text-purple-300 border border-purple-400/30">
                            {exam}
                          </span>
                        ))}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-900 dark:text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <Layers size={10} /> BUNDLE
                        </span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-900 dark:text-amber-300 border border-amber-400/30">
                        {p.exam_type}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  </div>
                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(p)}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold ${
                      p.active
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-300 dark:border-white/10'
                    }`}
                  >
                    {p.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {p.active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                {/* Price Row */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-baseline gap-3">
                  {p.discount_price ? (
                    <>
                      <span className="text-3xl font-black text-amber-600 dark:text-amber-400">₹{p.discount_price}</span>
                      <span className="text-sm line-through text-slate-400 dark:text-neutral-500">₹{p.price}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-black text-slate-900 dark:text-white">₹{p.price}</span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">/ {p.duration_days} Days</span>
                </div>

                {/* Footer: access info + action buttons */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 dark:text-neutral-400">
                    {isBundle && p.bundle_includes
                      ? `Access: All ${p.bundle_includes.join(' + ')} Papers`
                      : `Access: All ${p.exam_type} Papers`}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">Razorpay Ready</span>
                </div>

                {/* Edit / Delete Buttons */}
                <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-white/10">
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-neutral-700/60 text-slate-700 dark:text-neutral-200 hover:bg-amber-50 dark:hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-200 dark:border-white/10 transition"
                  >
                    <Pencil size={13} /> Edit Plan
                  </button>
                  <button
                    onClick={() => handleDeletePlan(p)}
                    disabled={deletingId === p.id}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 transition disabled:opacity-50"
                  >
                    <Trash2 size={13} /> {deletingId === p.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
          {plans.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white dark:bg-neutral-900/50 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-neutral-400">
              No pricing plans created yet. Click "Create New Plan" to add subscription pricing for IAT / NEST / CMI or a Bundle!
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {modalMode === 'edit' ? 'Edit Pricing Plan' : 'Create Subscription Pricing Plan'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">

              {/* Bundle Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                <div>
                  <p className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <Layers size={15} /> Bundle Plan (Multi-Series)
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">Covers multiple exam types in one plan</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsBundle(prev => !prev); setBundleIncludes([]); }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isBundle ? 'bg-purple-500' : 'bg-slate-300 dark:bg-neutral-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isBundle ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Exam type selector: single OR bundle checkboxes */}
              {isBundle ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-2">
                    Included Exam Types <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {EXAM_OPTIONS.map(exam => (
                      <button
                        key={exam}
                        type="button"
                        onClick={() => toggleBundleExam(exam)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition ${
                          bundleIncludes.includes(exam)
                            ? 'bg-purple-500 text-white border-purple-500'
                            : 'bg-slate-50 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10 hover:border-purple-400'
                        }`}
                      >
                        {bundleIncludes.includes(exam) ? '✓ ' : ''}{exam}
                      </button>
                    ))}
                  </div>
                  {bundleIncludes.length < 2 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Select at least 2 exam types for a bundle.</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Target Exam Category</label>
                  <select value={examType} onChange={e => setExamType(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white">
                    <option value="IAT">IISER IAT Pass</option>
                    <option value="NEST">NISER NEST Pass</option>
                    <option value="CMI">CMI Entrance Pass</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Package / Plan Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Duration (Days)</label>
                <select value={durationDays} onChange={e => setDurationDays(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white">
                  <option value="30">30 Days (1 Month)</option>
                  <option value="90">90 Days (3 Months)</option>
                  <option value="180">180 Days (6 Months)</option>
                  <option value="365">365 Days (1 Year)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Original Price (₹)</label>
                  <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Offer Price (₹)</label>
                  <input type="number" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white" placeholder="Optional" />
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 mt-4 shadow">
                {saving ? 'Saving...' : modalMode === 'edit' ? 'Update Plan' : 'Save Pricing Plan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
