import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function Login() {
  const [email, setEmail] = useState('harshbuddy01@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';
      const apiRes = await fetch(`${apiUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });

      const apiData = await apiRes.json();

      if (apiRes.ok && apiData.token) {
        login(apiData.token);
        navigate('/');
        return;
      } else {
        throw new Error(apiData.message || apiData.error || 'Invalid username or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 p-8 rounded-xl w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Admin Portal Login</h1>
        <p className="text-xs text-neutral-400 text-center mb-6">Vigyan.prep Management & Question Builder</p>

        {error && <div className="mb-4 text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Username / Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              placeholder="admin or harshbuddy01@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-neutral-950 font-bold py-3 rounded-lg hover:opacity-95 transition-opacity disabled:opacity-50 text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Portal →'}
          </button>
        </form>
      </div>
    </div>
  );
}
