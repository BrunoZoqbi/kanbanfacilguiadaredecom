import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEstoqueGeral } from './useEstoqueGeral';
import { useProdutos } from './useProdutos';
import { CondicaoItem, ItemSerializado, ItemSerializadoWithRelations } from '@/types/estoque';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

interface CreateItemInput {
  produto_id: string;
  numero_serie: string;
  mac_address?: string | null;
  patrimonio?: string | null;
  fabricante?: string | null;
  modelo?: string | null;
  condicao: CondicaoItem;
  fornecedor?: string | null;
  nota_fiscal?: string | null;
  valor_aquisicao?: number | null;
  garantia_ate?: string | null;
}

export const useItensSerializados = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Only createItem (a plain insert, not covered by an RPC) needs the
  // general stock id — the other actions resolve it server-side.
  const { data: estoqueGeral } = useEstoqueGeral();

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['itens-serializados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itens_serializados')
        .select('*, produto:produtos(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ItemSerializadoWithRelations[];
    },
    enabled: !!user,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['itens-serializados'] });
    // Prefixo — invalida todas as combinações de busca/categoria/produto em
    // cache da lista paginada (useItensSerializadosDisponiveis) também.
    queryClient.invalidateQueries({ queryKey: ['itens-serializados-disponiveis'] });
    queryClient.invalidateQueries({ queryKey: ['itens-instalados'] });
    queryClient.invalidateQueries({ queryKey: ['movimentacoes-estoque'] });
  };

  const createItem = useMutation({
    mutationFn: async (input: CreateItemInput) => {
      if (!estoqueGeral) throw new Error('Estoque geral da sede não encontrado');

      const { data, error } = await supabase
        .from('itens_serializados')
        .insert([
          {
            ...input,
            status: 'disponivel',
            estoque_atual_id: estoqueGeral.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Item cadastrado e disponível no estoque!');
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar item: ' + error.message);
    },
  });

  // Admin / gestor técnico only (enforced server-side by the function).
  const retirarParaTecnico = useMutation({
    mutationFn: async ({ itemId, tecnicoId, observacao }: { itemId: string; tecnicoId: string; observacao?: string }) => {
      const { error } = await supabase.rpc('retirar_para_tecnico', {
        p_item_id: itemId,
        p_tecnico_id: tecnicoId,
        p_observacao: observacao,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Item retirado para o técnico!');
    },
    onError: (error: any) => {
      toast.error('Erro ao retirar item: ' + error.message);
    },
  });

  // Técnico self-service on an item currently under their own custody.
  const instalarItem = useMutation({
    mutationFn: async ({
      itemId,
      clienteVinculado,
      osVinculada,
      localInstalacao,
    }: {
      itemId: string;
      clienteVinculado: string;
      osVinculada: string;
      localInstalacao: string;
    }) => {
      const { error } = await supabase.rpc('instalar_item', {
        p_item_id: itemId,
        p_cliente_vinculado: clienteVinculado,
        p_os_vinculada: osVinculada,
        p_local_instalacao: localInstalacao,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Item instalado no cliente!');
    },
    onError: (error: any) => {
      toast.error('Erro ao instalar item: ' + error.message);
    },
  });

  // Técnico self-service on an item currently under their own custody.
  const devolverSede = useMutation({
    mutationFn: async ({ itemId, observacao }: { itemId: string; observacao?: string }) => {
      const { error } = await supabase.rpc('devolver_sede', {
        p_item_id: itemId,
        p_observacao: observacao,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Item devolvido à sede!');
    },
    onError: (error: any) => {
      toast.error('Erro ao devolver item: ' + error.message);
    },
  });

  // Admin / gestor técnico only. Creates the Kanban task AND moves the item
  // (com_tecnico) in a single call — this is what makes the item show up in
  // the technician's "Meu Estoque" once they pick up the recolhimento task.
  const lancarRecolhimento = useMutation({
    mutationFn: async ({
      itemId,
      tecnicoId,
      titulo,
      descricao,
      dueDate,
      location,
    }: {
      itemId: string;
      tecnicoId: string;
      titulo: string;
      descricao: string;
      dueDate: string;
      location?: string;
    }) => {
      const { data, error } = await supabase.rpc('lancar_tarefa_recolhimento', {
        p_item_id: itemId,
        p_tecnico_id: tecnicoId,
        p_titulo: titulo,
        p_descricao: descricao,
        p_due_date: dueDate,
        p_location: location,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa de recolhimento lançada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao lançar recolhimento: ' + error.message);
    },
  });

  // Admin / gestor técnico only (enforced server-side by the function).
  // Only items 'disponivel' or 'com_tecnico' can be baixado — an installed
  // item must be recolhido first.
  const darBaixa = useMutation({
    mutationFn: async ({
      itemId,
      novoStatus,
      observacao,
    }: {
      itemId: string;
      novoStatus: 'analise_defeito' | 'baixado';
      observacao: string;
    }) => {
      const { error } = await supabase.rpc('dar_baixa_item', {
        p_item_id: itemId,
        p_novo_status: novoStatus,
        p_observacao: observacao,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(
        variables.novoStatus === 'analise_defeito'
          ? 'Item enviado para análise de defeito!'
          : 'Item baixado (descarte)!'
      );
    },
    onError: (error: any) => {
      toast.error('Erro ao dar baixa no item: ' + error.message);
    },
  });

  // Admin / gestor técnico only (enforced server-side by the function).
  // Reparo concluído: item volta para o estoque geral.
  const voltarDisponivel = useMutation({
    mutationFn: async ({ itemId, observacao }: { itemId: string; observacao?: string }) => {
      const { error } = await supabase.rpc('reparo_concluido', {
        p_item_id: itemId,
        p_observacao: observacao,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Item de volta ao estoque disponível!');
    },
    onError: (error: any) => {
      toast.error('Erro ao devolver item ao estoque: ' + error.message);
    },
  });

  // Admin / gestor técnico only (enforced server-side by the function).
  // Sem conserto: confirma o descarte definitivo.
  const confirmarBaixado = useMutation({
    mutationFn: async ({ itemId, observacao }: { itemId: string; observacao?: string }) => {
      const { error } = await supabase.rpc('confirmar_baixa_definitiva', {
        p_item_id: itemId,
        p_observacao: observacao,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Item baixado definitivamente!');
    },
    onError: (error: any) => {
      toast.error('Erro ao confirmar baixa: ' + error.message);
    },
  });

  return {
    itens,
    isLoading,
    estoqueGeral,
    createItem,
    retirarParaTecnico,
    instalarItem,
    devolverSede,
    lancarRecolhimento,
    darBaixa,
    voltarDisponivel,
    confirmarBaixado,
  };
};

interface UseItensSerializadosDisponiveisOptions {
  search?: string;
  categoria?: string;
  produtoId?: string;
}

// Lista "Itens Serializados Disponíveis" (EstoqueDisponivel.tsx) — a única
// tela que lista itens_serializados sem um filtro estreito de status
// (disponível pode ser um estoque grande). Busca + paginação rodam no banco
// via RPC (buscar_itens_serializados_disponiveis), em vez de carregar tudo e
// filtrar no cliente como o useItensSerializados() acima faz para as outras
// telas (Meu Estoque, Em Análise, Por Técnico — pequenas o suficiente).
export const useItensSerializadosDisponiveis = ({
  search = '',
  categoria = '',
  produtoId = '',
}: UseItensSerializadosDisponiveisOptions = {}) => {
  const { user } = useAuth();
  const { produtos } = useProdutos();

  const query = useInfiniteQuery({
    queryKey: ['itens-serializados-disponiveis', search, categoria, produtoId],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('buscar_itens_serializados_disponiveis', {
        p_search: search.trim() || undefined,
        p_categoria: categoria || undefined,
        p_produto_id: produtoId || undefined,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      });

      if (error) throw error;

      const itensPagina = (data || []) as ItemSerializado[];
      return {
        itens: itensPagina,
        nextOffset: itensPagina.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!user,
  });

  // Produtos já ficam todos em cache local (useProdutos) — mais simples
  // resolver o relacionamento aqui do que fazer o RPC devolver o join.
  const itens = useMemo<ItemSerializadoWithRelations[]>(() => {
    const paginas = query.data?.pages ?? [];
    return paginas.flatMap((pagina) =>
      pagina.itens.map((item) => ({
        ...item,
        produto: produtos.find((p) => p.id === item.produto_id),
      }))
    );
  }, [query.data, produtos]);

  return { ...query, itens };
};

interface UseItensInstaladosOptions {
  search?: string;
}

// Lista "Itens Instalados em Cliente" (LancarRecolhimento.tsx) — mesmo
// padrão de useItensSerializadosDisponiveis acima: busca + paginação rodam
// no banco via RPC (buscar_itens_instalados) em vez de carregar tudo e
// filtrar status === 'instalado_cliente' no cliente.
export const useItensInstalados = ({ search = '' }: UseItensInstaladosOptions = {}) => {
  const { user } = useAuth();
  const { produtos } = useProdutos();

  const query = useInfiniteQuery({
    queryKey: ['itens-instalados', search],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('buscar_itens_instalados', {
        p_search: search.trim() || undefined,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      });

      if (error) throw error;

      const itensPagina = (data || []) as ItemSerializado[];
      return {
        itens: itensPagina,
        nextOffset: itensPagina.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!user,
  });

  const itens = useMemo<ItemSerializadoWithRelations[]>(() => {
    const paginas = query.data?.pages ?? [];
    return paginas.flatMap((pagina) =>
      pagina.itens.map((item) => ({
        ...item,
        produto: produtos.find((p) => p.id === item.produto_id),
      }))
    );
  }, [query.data, produtos]);

  return { ...query, itens };
};
