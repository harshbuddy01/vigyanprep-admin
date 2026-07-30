const API_URL = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export const api = {
  async get(endpoint: string) {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  async post(endpoint: string, data: any) {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  // endpoints
  login: (data: any) => api.post('/api/admin/auth/login', data),
  getDashboardStats: () => api.get('/api/admin/dashboard'),
  getStudents: () => api.get('/api/admin/students'),
  getTests: () => api.get('/api/admin/tests'),
  createTest: (data: any) => api.post('/api/admin/tests', data),
  getQuestions: () => api.get('/api/admin/questions'),
  createQuestion: (data: any) => api.post('/api/admin/questions', data),
  getTransactions: () => api.get('/api/admin/transactions'),
  getResults: () => api.get('/api/admin/results'),
};
