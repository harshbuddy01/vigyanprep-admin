import { useState, useEffect } from 'react';
import { Receipt, RefreshCw } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function Transactions() {
  const token = useAuthStore((state) => state.token);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/transactions`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const totalRevenue = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Transactions & Payment Records</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Receipt} label="Total Captured Revenue" value={`₹${totalRevenue}`} trend={{ value: 100, isPositive: true }} />
        <StatCard icon={Receipt} label="Total Transactions" value={`${transactions.length}`} />
        <StatCard icon={Receipt} label="Payment Gateway" value="Razorpay Live" />
      </div>

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden mt-6">
        {loading ? (
          <div className="p-8 text-center text-neutral-400 font-mono flex items-center justify-center gap-2">
            <RefreshCw className="animate-spin" size={18} /> Loading real transactions...
          </div>
        ) : (
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Payment ID</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Verified Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id || t.razorpay_payment_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-amber-300">{t.razorpay_payment_id || t.id}</td>
                  <td className="px-6 py-4 font-mono text-xs">{t.razorpay_order_id || 'N/A'}</td>
                  <td className="px-6 py-4 font-bold text-white">₹{t.amount || 0}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {t.status || 'captured'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-400">
                    {t.verified_at || t.created_at ? new Date(t.verified_at || t.created_at).toLocaleString() : 'Just Now'}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-400 font-mono">
                    No payment records captured yet. Transactions will automatically populate when students subscribe on the website via Razorpay.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
