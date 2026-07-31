const API_URL = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export const api = {
  getDashboardStats: async () => {
    const res = await fetch(`${API_URL}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },
  getStudents: async () => {
    const res = await fetch(`${API_URL}/students`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },
  getChallenges: async (testId: string) => {
    const res = await fetch(`${API_URL}/challenges?test_id=${testId}`);
    if (!res.ok) throw new Error('Failed to fetch challenges');
    return res.json();
  },
  acceptChallenge: async (id: string, newAnswer: string) => {
    const res = await fetch(`${API_URL}/challenges/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newAnswer }),
    });
    if (!res.ok) throw new Error('Failed to accept challenge');
    return res.json();
  },
  rejectChallenge: async (id: string, reply: string, proofUrl: string) => {
    const res = await fetch(`${API_URL}/challenges/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply, proofUrl }),
    });
    if (!res.ok) throw new Error('Failed to reject challenge');
    return res.json();
  },
  releaseResponses: async (testId: string) => {
    const res = await fetch(`${API_URL}/tests/${testId}/release-responses`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to release responses');
    return res.json();
  },
  publishMeritList: async (testId: string) => {
    const res = await fetch(`${API_URL}/tests/${testId}/publish-merit-list`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to publish merit list');
    return res.json();
  },
};
