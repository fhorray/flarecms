import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FlareAdminRouter } from 'flarecms/client';
import 'flarecms/style.css'; // The pre-compiled prefixed CSS
import '@flarecms/plugin-ui-kit-tester/client';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* User's Public Site */}
        <Route path="/" element={
          <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-2xl text-center space-y-12">
              <div className="space-y-4">
                <h1 className="text-6xl font-extrabold tracking-tighter text-zinc-950 sm:text-8xl">
                  Flare<span className="text-zinc-400">CMS</span>
                </h1>
                <p className="text-xl text-zinc-500 max-w-lg mx-auto leading-relaxed font-medium">
                  Your modular fullstack CMS is ready. Start building your site or manage content in the dashboard.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/admin" className="w-full sm:w-auto px-8 py-4 bg-zinc-950 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-300">
                  Enter Dashboard
                </a>
                <a
                  href="https://flarecms.francy.dev"
                  target="_blank"
                  className="w-full sm:w-auto px-8 py-4 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-50 transition-all"
                >
                  Documentation
                </a>
              </div>
              
              <div className="pt-8 grid grid-cols-2 gap-8 text-left border-t border-zinc-200/60">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Modular API</h3>
                  <p className="text-sm text-zinc-600">Import only what you need. Serve the API on any route.</p>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Prefixed UI</h3>
                  <p className="text-sm text-zinc-600">Zero CSS conflicts. Admin styles are safely scoped.</p>
                </div>
              </div>
            </div>
          </div>
        } />
        
        {/* FlareCMS Admin Area */}
        {/* Mounts the full dashboard UI under /admin */}
        <Route path="/admin/*" element={<FlareAdminRouter basePath="/admin" apiBaseUrl="/api" />} />
      </Routes>
    </BrowserRouter>
  );
}

const container = document.getElementById('root');
if (container) {
  // Use a global to persist the root during Hot Module Replacement (HMR)
  // this prevents the "createRoot() on a container that has already been passed to createRoot()" warning.
  const root = (window as any)._flareRoot || createRoot(container);
  (window as any)._flareRoot = root;
  
  root.render(<App />);
}
