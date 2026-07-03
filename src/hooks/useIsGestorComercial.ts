import { useAuth } from '@/contexts/AuthContext';

// Mirrors useIsGestorTecnico.ts for the 'gestor_comercial' role.
export const useIsGestorComercial = () => {
  const { role } = useAuth();
  return role === 'gestor_comercial';
};
