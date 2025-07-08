"use client";

import { useLogStore } from '@/store/logStore'; // Zustand store for logs
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function LogOutput() {
  const logs = useLogStore((state) => state.logs);

  return (
    <div className="bg-slate-900 text-white rounded-lg p-4 h-full overflow-y-auto">
      <h3 className="text-lg font-bold mb-2">Live Output Log</h3>
      <div className="space-y-2">
        {logs.length === 0 && <div className="text-slate-400">No logs yet.</div>}
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-md flex items-start gap-3 ${log.status === 'error' ? 'bg-red-900/40 border border-red-500' : 'bg-slate-800/60 border border-green-500'}`}
          >
            <div className="pt-1">
              {log.status === 'error' ? (
                <AlertTriangle className="text-red-400 w-5 h-5" />
              ) : (
                <CheckCircle className="text-green-400 w-5 h-5" />
              )}
            </div>
            <div>
              <div className="font-mono text-xs mb-1">
                <span className="font-bold">{log.functionName}</span> • {log.status.toUpperCase()} • {log.latency}ms
              </div>
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(log.response, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 