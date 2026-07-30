import { Receipt } from 'lucide-react';
import { StatCard } from '../components/StatCard';

const MOCK_TRANSACTIONS = [
  { id: 'TXN001', email: 'rahul@example.com', test: 'JEE Main Full Series', amount: 999, status: 'Success', date: '2023-10-25' },
  { id: 'TXN002', email: 'priya@example.com', test: 'NEET Physics Pack', amount: 499, status: 'Failed', date: '2023-10-26' },
];

export function Transactions() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Transactions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Receipt} label="Total Revenue" value="₹1,24,500" trend={{ value: 15, isPositive: true }} />
        <StatCard icon={Receipt} label="Today's Revenue" value="₹4,500" />
        <StatCard icon={Receipt} label="Success Rate" value="95%" />
      </div>

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-white/10 flex gap-4">
          <select className="bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400">
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="date"
            className="bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-900/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Payment ID</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Test/Pack</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TRANSACTIONS.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{t.id}</td>
                <td className="px-6 py-4">{t.email}</td>
                <td className="px-6 py-4">{t.test}</td>
                <td className="px-6 py-4">₹{t.amount}</td>
                <td className="px-6 py-4">{t.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${t.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
