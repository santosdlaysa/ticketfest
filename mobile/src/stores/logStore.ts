import { create } from 'zustand';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type LogStatus = 'pending' | 'success' | 'error';

export interface ApiLog {
  id: string;
  timestamp: Date;
  method: HttpMethod;
  url: string;
  baseUrl?: string;
  endpoint?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  duration?: number;
  error?: string;
  status: LogStatus;
}

interface LogState {
  logs: ApiLog[];
  isEnabled: boolean;
  maxLogs: number;

  // Actions
  addLog: (log: Omit<ApiLog, 'id' | 'timestamp' | 'status'> & { status?: LogStatus }) => string;
  updateLog: (id: string, updates: Partial<ApiLog>) => void;
  clearLogs: () => void;
  toggleEnabled: () => void;
  setEnabled: (enabled: boolean) => void;
  getLogById: (id: string) => ApiLog | undefined;
  getLogsByMethod: (method: HttpMethod) => ApiLog[];
  getLogsByStatus: (status: LogStatus) => ApiLog[];
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  isEnabled: __DEV__, // Enabled by default in development
  maxLogs: 200,

  addLog: (log) => {
    const id = generateId();
    const newLog: ApiLog = {
      ...log,
      id,
      timestamp: new Date(),
      status: log.status || 'pending',
    };

    set((state) => {
      const logs = [newLog, ...state.logs].slice(0, state.maxLogs);
      return { logs };
    });

    return id;
  },

  updateLog: (id, updates) => {
    set((state) => ({
      logs: state.logs.map((log) =>
        log.id === id ? { ...log, ...updates } : log
      ),
    }));
  },

  clearLogs: () => set({ logs: [] }),

  toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),

  setEnabled: (enabled) => set({ isEnabled: enabled }),

  getLogById: (id) => get().logs.find((log) => log.id === id),

  getLogsByMethod: (method) => get().logs.filter((log) => log.method === method),

  getLogsByStatus: (status) => get().logs.filter((log) => log.status === status),
}));
