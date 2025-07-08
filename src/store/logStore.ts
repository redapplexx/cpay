import { create } from 'zustand';

type LogEntry = {
  functionName: string;
  status: 'success' | 'error';
  latency: number;
  response: any;
};

type LogStore = {
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
};

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  addLog: (entry) => set((state) => ({ logs: [entry, ...state.logs] })),
})); 