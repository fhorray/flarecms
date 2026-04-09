import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';

// Note: index.css is served separately by the flarecms factory wrapper
// to ensure zero-config styles in development and production.

ReactDOM.hydrateRoot(
  document.getElementById('root')!,
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
