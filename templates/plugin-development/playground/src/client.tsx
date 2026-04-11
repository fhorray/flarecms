import React from 'react';
import ReactDOM from 'react-dom/client';
import { FlareAdmin } from 'flarecms/client';
import './index.css';

// The FlareAdmin component automatically handles plugin rendering 
// based on the configuration provided in the backend.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FlareAdmin />
  </React.StrictMode>
);
