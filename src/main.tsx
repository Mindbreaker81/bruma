import '@fontsource-variable/inter';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { Toaster } from './components/ui/sonner';
import './i18n';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
