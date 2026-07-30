import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Questions } from './pages/Questions';
import { Tests } from './pages/Tests';
import { Students } from './pages/Students';
import { Transactions } from './pages/Transactions';
import { Results } from './pages/Results';
import { UploadPDF } from './pages/UploadPDF';
import { Members } from './pages/Members';
import { Settings } from './pages/Settings';
import { Performance } from './pages/Performance';
import { Calendar } from './pages/Calendar';
import { ProtectedRoute } from './components/ProtectedRoute';

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
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/live-preview" element={<Tests />} />
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
