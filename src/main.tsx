import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { registerSW } from 'virtual:pwa-register';
import { ThemeProvider } from './context/ThemeContext';

// Register service worker with auto-update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // New version available - auto-reload for seamless update
    // In production, you could show a toast: "Update available, reloading..."
    console.log('New version available - updating...');
    updateSW(true); // Force update and reload
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered(registration) {
    console.log('Service Worker registered:', registration);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  },
});

// Handle install prompt for PWA
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  // Store the event for manual triggering via install button
  deferredPrompt = e;
  
  // Check if we've already shown the automatic prompt in this browser
  const hasShownAutoPrompt = localStorage.getItem('pwa-auto-prompt-shown');
  
  if (!hasShownAutoPrompt) {
    // First time - allow browser to show native install prompt
    localStorage.setItem('pwa-auto-prompt-shown', 'true');
    // Don't prevent default - let browser show its native prompt
  } else {
    // Subsequent times - prevent default to avoid prompt fatigue
    e.preventDefault();
  }
  
  // Expose globally so users can also trigger it manually from UI (e.g., Dashboard "Install App" button)
  (window as any).__installApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
      });
    }
  };
});

// Log when app is installed
window.addEventListener('appinstalled', () => {
  console.log('PWA installed successfully');
  deferredPrompt = null;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
