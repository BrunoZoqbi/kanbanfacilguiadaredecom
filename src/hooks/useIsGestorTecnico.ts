import { useAuth } from '@/contexts/AuthContext';

// Mirrors the isAdmin flag on useAuth(), exposed as its own hook so
// permission checks for the "gestor técnico" role read the same way
// across the estoque module.
export const useIsGestorTecnico = () => {
  const { role } = useAuth();
  return role === 'gestor_tecnico';
};
