import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FlareAdminRouter } from 'flarecms/client';
import 'flarecms/style.css'; // Standard admin styles

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page for the plugin development playground */}
        <Route path="/" element={
          <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 font-sans">
            <h1 className="text-4xl font-bold text-zinc-900 mb-4">{{PLUGIN_NAME_HUMAN}} Development</h1>
            <p className="text-zinc-600 mb-8">Your plugin environment is ready. Access the admin to see it in action.</p>
            <a href="/admin" className="px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all">
              Go to Admin Dashboard
            </a>
          </div>
        } />
        
        {/* FlareCMS Admin Area */}
        {/* Mounts the full dashboard UI under /admin and points to our local API */}
        <Route path="/admin/*" element={<FlareAdminRouter basePath="/admin" apiBaseUrl="/api" />} />
      </Routes>
    </BrowserRouter>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
