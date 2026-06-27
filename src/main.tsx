import '@fontsource-variable/inter';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { bootstrapLinuxWebviewCompat } from './lib/tauri';
import './i18n';
import './styles/main.css';

bootstrapLinuxWebviewCompat();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Toaster />
  </React.StrictMode>
);
