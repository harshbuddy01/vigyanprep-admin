import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : 'Bearer admin_session_active'
  };
}

async function handleResponse(res: Response, errorMsg: string) {
  if (res.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error(errorMsg);
  return res.json();
}

export const api = {
  getDashboardStats: async () => {
    const res = await fetch(`${API_URL}/api/admin/dashboard/stats`, { headers: getAuthHeaders() });
    const data = await handleResponse(res, 'Failed to fetch dashboard stats');
    return data.stats || data;
  },
  getStudents: async () => {
    const res = await fetch(`${API_URL}/api/admin/students`, { headers: getAuthHeaders() });
    return handleResponse(res, 'Failed to fetch students');
  },
  getChallenges: async (testId: string) => {
    const res = await fetch(`${API_URL}/api/challenges?test_id=${testId}`, { headers: getAuthHeaders() });
    return handleResponse(res, 'Failed to fetch challenges');
  },
  acceptChallenge: async (id: string, newAnswer: string) => {
    const res = await fetch(`${API_URL}/api/challenges/${id}/accept`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newAnswer }),
    });
    return handleResponse(res, 'Failed to accept challenge');
  },
  rejectChallenge: async (id: string, reply: string, proofUrl: string) => {
    const res = await fetch(`${API_URL}/api/challenges/${id}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reply, proofUrl }),
    });
    return handleResponse(res, 'Failed to reject challenge');
  },
  releaseResponses: async (testId: string) => {
    const res = await fetch(`${API_URL}/api/admin/results-control/${testId}/release-responses`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to release responses');
  },
  publishMeritList: async (testId: string) => {
    const res = await fetch(`${API_URL}/api/admin/results-control/${testId}/publish-merit-list`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to publish merit list');
  },
};
