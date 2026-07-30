import { useState } from 'react';
import { Search } from 'lucide-react';

const MOCK_STUDENTS = [
  { id: 'S1', name: 'Rahul Kumar', email: 'rahul@example.com', roll: 'VP24001', course: 'JEE 2024', tests: 5, lastLogin: '2023-10-25' },
  { id: 'S2', name: 'Priya Singh', email: 'priya@example.com', roll: 'VP24002', course: 'NEET 2024', tests: 3, lastLogin: '2023-10-26' },
];

export function Students() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Students</h1>

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

        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-900/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Roll Number</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Tests Purchased</th>
              <th className="px-6 py-4">Last Login</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_STUDENTS.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                <td className="px-6 py-4">{s.email}</td>
                <td className="px-6 py-4">{s.roll}</td>
                <td className="px-6 py-4">{s.course}</td>
                <td className="px-6 py-4">{s.tests}</td>
                <td className="px-6 py-4">{s.lastLogin}</td>
                <td className="px-6 py-4">
                  <button className="text-amber-400 hover:underline">View Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
