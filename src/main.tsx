import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// 🛑 VigyanPrep Administrative Console — Security Banner
if (typeof window !== 'undefined') {
  setTimeout(() => {
    console.log(
      '%c🛑 STOP!',
      'color: #ef4444; font-size: 56px; font-weight: 900; font-family: system-ui, -apple-system, sans-serif; text-shadow: 0 2px 10px rgba(239, 68, 68, 0.5);'
    );
    console.log(
      '%c⚠️ This is an authorized administrator console.\n' +
      'Do NOT copy-paste untrusted scripts, tokens, or credentials here.\n' +
      'All administrative actions, questions mutations, and result publications are logged for audit compliance.\n\n' +
      '🛡️ VigyanPrep Security Operations: https://admin.vigyanprep.com',
      'font-size: 15px; font-weight: 600; color: #f43f5e; line-height: 1.6; font-family: system-ui, -apple-system, sans-serif;'
    );
  }, 400);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
