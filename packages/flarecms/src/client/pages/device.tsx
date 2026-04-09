import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function DevicePage() {
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await apiFetch('/device/verify', {
        method: 'POST',
        body: JSON.stringify({ user_code: userCode }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setMessage('Device successfully authorized! You may return to your CLI.');
      setUserCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 space-y-6 mt-12">
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Device Authorization</h1>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mt-2">
          Approve CLI / Agent Requests
        </p>
      </div>

      <form onSubmit={handleApprove} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">User Code</label>
          <Input 
            value={userCode}
            onChange={e => setUserCode(e.target.value.toUpperCase())}
            placeholder="ABCD-1234"
            className="text-center text-lg tracking-widest uppercase font-mono"
            required
          />
        </div>

        {error && <div className="text-destructive text-xs font-semibold text-center">{error}</div>}
        {message && <div className="text-primary text-xs font-semibold text-center">{message}</div>}

        <Button type="submit" className="w-full h-10 font-bold uppercase tracking-widest" disabled={loading}>
          {loading ? 'Verifying...' : 'Authorize Device'}
        </Button>
      </form>
    </div>
  );
}
