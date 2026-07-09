import { useMemo } from 'react';
import { useProspeccoes } from './useProspeccoes';

export interface ProspeccaoStats {
  total: number;
  baixa: number;
  media: number;
  alta: number;
  convertidas: number;
  taxaConversao: number;
}

// Extraído de ListaProspeccoes.tsx para ser reaproveitado também no
// Dashboard consolidado (AdminDashboard.tsx) sem duplicar a mesma conta.
export const useProspeccaoStats = () => {
  const { prospeccoes, isLoading } = useProspeccoes();

  const stats = useMemo<ProspeccaoStats>(() => {
    const total = prospeccoes.length;
    const baixa = prospeccoes.filter((p) => p.classificacao === 'baixa').length;
    const media = prospeccoes.filter((p) => p.classificacao === 'media').length;
    const alta = prospeccoes.filter((p) => p.classificacao === 'alta').length;
    const convertidas = prospeccoes.filter((p) => p.status === 'convertido').length;
    const taxaConversao = total > 0 ? Math.round((convertidas / total) * 100) : 0;
    return { total, baixa, media, alta, convertidas, taxaConversao };
  }, [prospeccoes]);

  return { stats, isLoading };
};
