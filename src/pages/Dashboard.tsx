import { Users, Receipt, BookOpen, Activity } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 2000 },
  { name: 'Apr', revenue: 2780 },
  { name: 'May', revenue: 1890 },
  { name: 'Jun', revenue: 2390 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Students" value="1,234" trend={{ value: 12, isPositive: true }} />
        <StatCard icon={Receipt} label="Revenue" value="$45,678" trend={{ value: 8, isPositive: true }} />
        <StatCard icon={BookOpen} label="Active Tests" value="45" trend={{ value: 2, isPositive: false }} />
        <StatCard icon={Activity} label="Active Users" value="892" trend={{ value: 5, isPositive: true }} />
      </div>

      <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl mt-6">
        <h2 className="text-lg font-semibold text-white mb-4">Revenue Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #333' }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#fbbf24" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
