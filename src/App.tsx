import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Questions } from './pages/Questions';
import { Tests } from './pages/Tests';
import { Students } from './pages/Students';
import { Transactions } from './pages/Transactions';
import { Results } from './pages/Results';
import { UploadPDF } from './pages/UploadPDF';
import { ProtectedRoute } from './components/ProtectedRoute';

// Placeholder pages for new routes
const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center space-y-4">
      <div className="text-6xl">🚧</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-neutral-400 text-sm">This section is under construction</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/upload-pdf" element={<UploadPDF />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/calendar" element={<ComingSoon title="Test Calendar" />} />
          <Route path="/live-preview" element={<ComingSoon title="Live Test Preview" />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/add" element={<ComingSoon title="Add Student" />} />
          <Route path="/performance" element={<ComingSoon title="Student Performance Analytics" />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/results" element={<Results />} />
          <Route path="/settings" element={<ComingSoon title="Settings" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
