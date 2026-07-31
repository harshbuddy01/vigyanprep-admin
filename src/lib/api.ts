import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

function getAuthHeaders() { 
  const token = useAuthStore.getState().token; 
  return { 
    'Content-Type': 'application/json', 
    'Authorization': token ? `Bearer ${token}` : '' 
  }; 
}

export const api = {
  getDashboardStats: async () => {
    const res = await fetch(`${API_URL}/api/admin/dashboard/stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },
  getStudents: async () => {
    const res = await fetch(`${API_URL}/api/admin/students`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },
  getChallenges: async (testId: string) => {
    const res = await fetch(`${API_URL}/api/challenges?test_id=${testId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch challenges');
    return res.json();
  },
  acceptChallenge: async (id: string, newAnswer: string) => {
    const res = await fetch(`${API_URL}/api/challenges/${id}/accept`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newAnswer }),
    });
    if (!res.ok) throw new Error('Failed to accept challenge');
    return res.json();
  },
  rejectChallenge: async (id: string, reply: string, proofUrl: string) => {
    const res = await fetch(`${API_URL}/api/challenges/${id}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reply, proofUrl }),
    });
    if (!res.ok) throw new Error('Failed to reject challenge');
    return res.json();
  },
  releaseResponses: async (testId: string) => {
    const res = await fetch(`${API_URL}/api/admin/results-control/${testId}/release-responses`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to release responses');
    return res.json();
  },
  publishMeritList: async (testId: string) => {
    const res = await fetch(`${API_URL}/api/admin/results-control/${testId}/publish-merit-list`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to publish merit list');
    return res.json();
  },
};
