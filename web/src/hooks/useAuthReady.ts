import { useAuthStore } from '@/contexts/AuthContext';

/**
 * Hook que retorna true quando a autenticação está pronta para uso.
 * Use este hook em páginas que precisam fazer chamadas de API autenticadas.
 *
 * @example
 * const isReady = useAuthReady();
 *
 * useEffect(() => {
 *   if (isReady) {
 *     loadData();
 *   }
 * }, [isReady]);
 */
export function useAuthReady(): boolean {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  return _hasHydrated && isAuthenticated;
}

export default useAuthReady;
