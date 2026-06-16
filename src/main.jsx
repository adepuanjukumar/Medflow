import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Programmatically unregister any old service worker and clear caches to solve browser caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('[App] Programmatically unregistered old service worker:', registration);
    }
  });
}

if ('caches' in window) {
  caches.keys().then((names) => {
    for (let name of names) {
      caches.delete(name);
      console.log('[App] Programmatically deleted cache storage:', name);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
