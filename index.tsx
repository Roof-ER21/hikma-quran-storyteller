import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './src/styles/generated.css';
import './src/styles/rtl.css';
import './src/i18n'; // Initialize i18n

const updateViewportVariables = () => {
  const visualViewport = window.visualViewport;
  const height = visualViewport?.height ?? window.innerHeight;
  const width = visualViewport?.width ?? window.innerWidth;

  document.documentElement.style.setProperty('--app-vh', `${height * 0.01}px`);
  document.documentElement.style.setProperty('--app-vw', `${width * 0.01}px`);
};

updateViewportVariables();
window.addEventListener('resize', updateViewportVariables, { passive: true });
window.visualViewport?.addEventListener('resize', updateViewportVariables);
window.visualViewport?.addEventListener('scroll', updateViewportVariables);

// Initialize Sentry for crash reporting (disabled in kids mode for COPPA compliance)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    beforeSend(event) {
      // COPPA: Never send error data from kids mode
      if (localStorage.getItem('alayasoad_kids_mode') === 'true') {
        return null;
      }
      return event;
    },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
