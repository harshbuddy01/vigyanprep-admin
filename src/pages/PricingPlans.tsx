import { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle, XCircle, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

interface SubscriptionPlan {
  id: string;
  exam_type: string;
  name: string;
  duration_days: number;
  price: number;
  discount_price: number | null;
  active: boolean;
}

export function PricingPlans() {
  const token = useAuthStore((state) => state.token);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [examType, setExamType] = useState('IAT');
  const [name, setName] = useState('Full Test Series Pass');
  const [durationDays, setDurationDays] = useState('90');
  const [price, setPrice] = useState('999');
  const [discountPrice, setDiscountPrice] = useState('499');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/tests/plans`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.plans) {
        setPlans(data.plans);
      }
    } catch (err) {
      console.error('Failed to fetch pricing plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/tests/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          exam_type: examType,
          name,
          duration_days: parseInt(durationDays) || 90,
          price: parseFloat(price),
          discount_price: discountPrice ? parseFloat(discountPrice) : null,
          active: true
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowModal(false);
        fetchPlans();
      } else {
        alert('Error creating plan: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error creating plan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: SubscriptionPlan) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tests/plans/${plan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ active: !plan.active })
      });
      if (res.ok) fetchPlans();
    } catch (err) {
      alert('Failed to update plan status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="text-amber-400" /> Pricing & Subscription Plans
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Assign subscription prices, discounts, and access durations for paid Test Series packages.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold hover:bg-amber-500 transition-colors"
        >
          <Plus size={20} />
          Create New Plan
        </button>
      </div>

      {loading ? (
        <div className="text-white">Loading pricing plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-6 rounded-xl border space-y-4 transition ${
                p.active
                  ? 'bg-neutral-800/60 border-amber-500/30'
                  : 'bg-neutral-900/40 border-white/5 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {p.exam_type}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{p.name}</h3>
                </div>
                <button
                  onClick={() => toggleActive(p)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                    p.active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-400 border-white/10'
                  }`}
                >
                  {p.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {p.active ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-baseline gap-3">
                {p.discount_price ? (
                  <>
                    <span className="text-3xl font-black text-amber-400">₹{p.discount_price}</span>
                    <span className="text-sm line-through text-neutral-500">₹{p.price}</span>
                  </>
                ) : (
                  <span className="text-3xl font-black text-white">₹{p.price}</span>
                )}
                <span className="text-xs text-neutral-400 font-mono">/ {p.duration_days} Days</span>
              </div>

              <div className="text-xs text-neutral-400 flex items-center justify-between pt-2">
                <span>Access: All {p.exam_type} Papers</span>
                <span className="text-amber-400 font-semibold">Razorpay Ready</span>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-full p-8 text-center bg-neutral-900/50 rounded-xl border border-white/10 text-neutral-400">
              No pricing plans created yet. Click "Create New Plan" to add subscription pricing for IAT / NEST / CMI!
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create Subscription Pricing Plan</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Target Exam Category</label>
                <select value={examType} onChange={e => setExamType(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white">
                  <option value="IAT">IISER IAT Pass</option>
                  <option value="NEST">NISER NEST Pass</option>
                  <option value="CMI">CMI Entrance Pass</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Package / Plan Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Duration (Days)</label>
                <select value={durationDays} onChange={e => setDurationDays(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white">
                  <option value="30">30 Days (1 Month)</option>
                  <option value="90">90 Days (3 Months)</option>
                  <option value="180">180 Days (6 Months)</option>
                  <option value="365">365 Days (1 Year)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Original Price (₹)</label>
                  <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Offer Price (₹)</label>
                  <input type="number" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Optional" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-amber-400 text-neutral-950 font-semibold py-2.5 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 mt-4">
                {saving ? 'Saving Plan...' : 'Save Pricing Plan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
