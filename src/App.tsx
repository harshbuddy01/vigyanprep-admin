import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Questions } from './pages/Questions';
import { TestSeries } from './pages/TestSeries';
import { PricingPlans } from './pages/PricingPlans';
import { PyqPapers } from './pages/PyqPapers';
import { PyqUpload } from './pages/PyqUpload';
import { Students } from './pages/Students';
import { Transactions } from './pages/Transactions';
import { Results } from './pages/Results';
import { Members } from './pages/Members';
import { Settings } from './pages/Settings';
import { Performance } from './pages/Performance';
import { Calendar } from './pages/Calendar';
import { QuestionChallenges } from './pages/QuestionChallenges';
import { LiveInvigilation } from './pages/LiveInvigilation';
import { ProtectedRoute } from './components/ProtectedRoute';

export function PreviewExamPlaceholder() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-2">Admin Preview Mode Quality Gate</h1>
      <p className="text-sm text-neutral-400">Attempting exam as student to validate answer keys before freeze.</p>
    </div>
  );
}

export function HallTicketsPlaceholder() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-2">Hall Ticket Management</h1>
      <p className="text-sm text-neutral-400">Auto-generated 16-hex exam IDs per student per test.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/test-series" element={<TestSeries />} />
          <Route path="/pricing" element={<PricingPlans />} />
          <Route path="/test-series/calendar" element={<Calendar />} />
          <Route path="/tests" element={<Navigate to="/test-series" replace />} />
          <Route path="/preview/:testId" element={<PreviewExamPlaceholder />} />

          <Route path="/pyq" element={<PyqPapers />} />
          <Route path="/pyq/upload" element={<PyqUpload />} />
          <Route path="/upload-pdf" element={<Navigate to="/pyq/upload" replace />} />

          <Route path="/questions" element={<Questions />} />
          <Route path="/question-reports" element={<QuestionChallenges />} />
          <Route path="/question-challenges" element={<QuestionChallenges />} />
          <Route path="/hall-tickets" element={<HallTicketsPlaceholder />} />
          <Route path="/live-invigilation" element={<LiveInvigilation />} />

          <Route path="/students" element={<Students />} />
          <Route path="/students/add" element={<Students />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/results" element={<Results />} />
          <Route path="/members" element={<Members />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
