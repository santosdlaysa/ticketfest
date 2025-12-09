import { create } from 'zustand';
import { validationApi } from '../services/api';

// Tipos
export interface TicketValidationInfo {
  id: string;
  code: string;
  ticketName: string;
  eventId: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  holderName?: string;
  holderEmail?: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

export interface ValidationResult {
  status: 'valid' | 'already_used' | 'invalid';
  message: string;
  ticket?: TicketValidationInfo;
  validatedAt: string;
}

interface ValidationStats {
  totalScanned: number;
  validCount: number;
  alreadyUsedCount: number;
  invalidCount: number;
  lastScanTime?: string;
}

interface ValidationState {
  // Estado
  loading: boolean;
  error: string | null;
  lastValidation: ValidationResult | null;
  validationHistory: ValidationResult[];
  stats: ValidationStats;
  selectedEventId: string | null;

  // Acoes
  validateTicket: (qrCodeOrCode: string) => Promise<ValidationResult | null>;
  clearLastValidation: () => void;
  clearHistory: () => void;
  setSelectedEvent: (eventId: string | null) => void;
  resetStats: () => void;
  clearError: () => void;
}

const initialStats: ValidationStats = {
  totalScanned: 0,
  validCount: 0,
  alreadyUsedCount: 0,
  invalidCount: 0,
};

export const useValidationStore = create<ValidationState>((set, get) => ({
  // Estado inicial
  loading: false,
  error: null,
  lastValidation: null,
  validationHistory: [],
  stats: { ...initialStats },
  selectedEventId: null,

  // Validar ingresso
  validateTicket: async (qrCodeOrCode: string) => {
    set({ loading: true, error: null });

    try {
      const { selectedEventId } = get();
      const result = await validationApi.validateTicket(qrCodeOrCode, selectedEventId || undefined);

      // Atualizar estatisticas
      const currentStats = get().stats;
      const newStats: ValidationStats = {
        ...currentStats,
        totalScanned: currentStats.totalScanned + 1,
        lastScanTime: new Date().toISOString(),
      };

      switch (result.status) {
        case 'valid':
          newStats.validCount = currentStats.validCount + 1;
          break;
        case 'already_used':
          newStats.alreadyUsedCount = currentStats.alreadyUsedCount + 1;
          break;
        case 'invalid':
          newStats.invalidCount = currentStats.invalidCount + 1;
          break;
      }

      // Adicionar ao historico (manter ultimos 50)
      const history = get().validationHistory;
      const newHistory = [result, ...history].slice(0, 50);

      set({
        loading: false,
        lastValidation: result,
        validationHistory: newHistory,
        stats: newStats,
      });

      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao validar ingresso';
      set({
        loading: false,
        error: errorMessage,
      });
      return null;
    }
  },

  // Limpar ultima validacao
  clearLastValidation: () => {
    set({ lastValidation: null, error: null });
  },

  // Limpar historico
  clearHistory: () => {
    set({ validationHistory: [] });
  },

  // Selecionar evento
  setSelectedEvent: (eventId: string | null) => {
    set({ selectedEventId: eventId });
  },

  // Resetar estatisticas
  resetStats: () => {
    set({ stats: { ...initialStats } });
  },

  // Limpar erro
  clearError: () => {
    set({ error: null });
  },
}));
