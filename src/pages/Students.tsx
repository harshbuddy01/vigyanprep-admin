import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('students').select('*');
      if (!error && data) {
        setStudents(data);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s =>
    (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (s.roll?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Students</h1>

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email or roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-neutral-400">Loading students...</div>
        ) : (
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                  <td className="px-6 py-4">{s.email}</td>
                  <td className="px-6 py-4">{s.roll}</td>
                  <td className="px-6 py-4">{s.course || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedStudent(s)} className="text-amber-400 hover:underline">View Detail</button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center">No students found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Student Details</h2>
              <button onClick={() => setSelectedStudent(null)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 text-neutral-300">
              <p><strong className="text-white">Name:</strong> {selectedStudent.name}</p>
              <p><strong className="text-white">Email:</strong> {selectedStudent.email}</p>
              <p><strong className="text-white">Roll No:</strong> {selectedStudent.roll}</p>
              <p><strong className="text-white">Course:</strong> {selectedStudent.course || 'None'}</p>
              <div className="mt-4">
                <h3 className="font-semibold text-white mb-2">Test History</h3>
                <div className="bg-neutral-800 p-4 rounded-lg border border-white/5 text-sm">
                  {/* Mock history for now, can be fetched if needed */}
                  <p>No test history available.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
