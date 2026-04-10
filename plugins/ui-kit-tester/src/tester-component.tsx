import React, { useState } from 'react';
import {
  Plus,
  Minus,
  RefreshCw,
  Monitor,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { BlockInteraction } from 'flarecms/plugins';

interface TesterComponentProps {
  initialCount?: number;
  label?: string;
  onAction?: (action: BlockInteraction) => void;
}

/**
 * A complex React component to test custom block registration.
 * Includes local state, Lucide icons, and interactive elements.
 */
export function TesterComponent({
  initialCount = 0,
  label = 'React Counter',
  onAction,
}: TesterComponentProps) {
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState<
    'idle' | 'running' | 'success' | 'error'
  >('idle');

  const runSimulation = () => {
    setStatus('running');
    setTimeout(() => {
      const success = Math.random() > 0.2;
      setStatus(success ? 'success' : 'error');

      if (onAction) {
        onAction({
          type: 'block_action',
          blockId: 'tester-sim',
          value: { success, finalCount: count },
        });
      }
    }, 1500);
  };

  return (
    <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Monitor className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              {label}
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium opacity-60">
              Custom React Block Extension
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/50">
          <div
            className={`size-1.5 rounded-full animate-pulse ${status === 'running' ? 'bg-amber-500' : status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-primary'}`}
          />
          <span className="text-[9px] font-bold uppercase tracking-tighter pr-1">
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-50">
            Current Value
          </span>
          <span className="text-4xl font-black tabular-nums tracking-tighter leading-none">
            {count}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setCount((prev) => prev + 1)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="size-3.5" /> Increment
          </button>
          <button
            onClick={() => setCount((prev) => prev - 1)}
            className="flex-1 flex items-center justify-center gap-2 bg-background border border-border rounded-lg font-bold text-xs hover:bg-muted transition-all"
          >
            <Minus className="size-3.5" /> Decrement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 py-2">
        <div className="flex flex-col items-center gap-1 opacity-40">
          <Cpu className="size-4" />
          <span className="text-[8px] font-bold tracking-tighter">CPU: 2%</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-40">
          <Database className="size-4" />
          <span className="text-[8px] font-bold tracking-tighter">
            MEM: 14MB
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-40">
          <RefreshCw className="size-4 animate-spin-slow" />
          <span className="text-[8px] font-bold tracking-tighter">HMR: OK</span>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={runSimulation}
          disabled={status === 'running'}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-t border-border/10 bg-gradient-to-br from-muted/50 to-muted/80 hover:to-muted text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {status === 'running' ? (
            <RefreshCw className="size-3 animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle2 className="size-3 text-green-500" />
          ) : status === 'error' ? (
            <AlertCircle className="size-3 text-red-500" />
          ) : null}
          Run Background Simulation
        </button>
      </div>
    </div>
  );
}
