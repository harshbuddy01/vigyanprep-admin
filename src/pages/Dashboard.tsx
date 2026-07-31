import { useState, useEffect } from 'react';
import { Users, Receipt, BookOpen, Activity } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-white p-6">Loading dashboard data...</div>;
  if (error) return <div className="text-red-400 p-6">Error: {error}</div>;

  const revenueData = stats?.revenueTrend || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Students" value={stats?.totalStudents || 0} trend={{ value: 12, isPositive: true }} />
        <StatCard icon={Receipt} label="Revenue" value={`₹${stats?.revenue || 0}`} trend={{ value: 8, isPositive: true }} />
        <StatCard icon={BookOpen} label="Active Tests" value={stats?.activeTests || 0} trend={{ value: 2, isPositive: false }} />
        <StatCard icon={Activity} label="Active Users" value={stats?.activeUsers || 0} trend={{ value: 5, isPositive: true }} />
      </div>

      <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl mt-6">
        <h2 className="text-lg font-semibold text-white mb-4">Revenue Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
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
