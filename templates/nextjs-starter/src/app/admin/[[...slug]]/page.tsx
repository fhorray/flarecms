'use client';

import React from 'react';
import { FlareAdminRouter } from 'flarecms/client';
import 'flarecms/style.css';

/**
 * FlareCMS Admin Dashboard
 * 
 * This page mounts the full FlareCMS admin interface as a client-side SPA.
 * It is mounted under /admin and communicates with /api.
 */
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-white">
      <FlareAdminRouter 
        basePath="/admin" 
        apiBaseUrl="/api" 
      />
    </div>
  );
}
