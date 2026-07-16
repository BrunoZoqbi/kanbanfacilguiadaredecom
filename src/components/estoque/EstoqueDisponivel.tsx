import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useItensSerializadosDisponiveis } from '@/hooks/useItensSerializados';
import { useEstoqueGeral } from '@/hooks/useEstoqueGeral';
import { useEstoqueSaldo } from '@/hooks/useEstoqueSaldo';
import { useCategoriasProduto } from '@/hooks/useCategoriasProduto';
import { useProdutos } from '@/hooks/useProdutos';
import { useEstoqueDisponivelPorProduto } from '@/hooks/useEstoqueDisponivelPorProduto';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { CONDICAO_LABELS, ItemSerializadoWithRelations, Produto } from '@/types/estoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Boxes,
  UserCog,
  Hash,
  AlertTriangle,
  PackageX,
  PackagePlus,
  PackageMinus,
  Search,
} from 'lucide-react';
import RetirarParaTecnicoDialog from './RetirarParaTecnicoDialog';
import DarBaixaDialog from './DarBaixaDialog';
import LancarEntradaDialog from './LancarEntradaDialog';
import LancarSaidaDialog from './LancarSaidaDialog';
import RetirarConsumivelParaTecnicoDialog from './RetirarConsumivelParaTecnicoDialog';

// Fallback usado enquanto a configuração ainda não carregou do banco —
// mesmo valor do limite padrão inserido pela migration (system_configs).
const LIMITE_ESTOQUE_BAIXO_PADRAO = 2;

const EstoqueDisponivel: React.FC = () => {
  const { isAdmin } = useAuth();
  const { value: limiteEstoqueBaixoConfig } = useSystemConfig('estoque_baixo_limite');
  const limiteEstoqueBaixo = limiteEstoqueBaixoConfig
    ? Number(limiteEstoqueBaixoConfig)
    : LIMITE_ESTOQUE_BAIXO_PADRAO;
  const isGestorTecnico = useIsGestorTecnico();
  const canRetirar = isAdmin || isGestorTecnico;
  const canDarBaixa = isAdmin || isGestorTecnico;
  const canLancarEntrada = isAdmin || isGestorTecnico;
  const { data: estoqueGeral } = useEstoqueGeral();
  const { data: saldos = [], isLoading: isLoadingSaldo } = useEstoqueSaldo(estoqueGeral?.id);
  const { produtos } = useProdutos();
  const { categorias } = useCategoriasProduto();
  const categoriasAtivas = categorias.filter((c) => c.ativo);

  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [produtoFiltro, setProdutoFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebouncedValue(busca, 400);
  const [retirarItem, setRetirarItem] = useState<ItemSerializadoWithRelations | null>(null);
  const [baixaItem, setBaixaItem] = useState<ItemSerializadoWithRelations | null>(null);
  const [entradaProduto, setEntradaProduto] = useState<Produto | null>(null);
  const [saidaProduto, setSaidaProduto] = useState<Produto | null>(null);
  const [retirarConsumivelProduto, setRetirarConsumivelProduto] = useState<Produto | null>(null);

  const {
    itens: filteredItens,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useItensSerializadosDisponiveis({
    search: buscaDebounced,
    categoria: categoriaFiltro,
    produtoId: produtoFiltro,
  });

  // Todo produto consumível ativo aparece aqui, mesmo sem nenhuma entrada
  // lançada ainda (saldo 0) — antes só apareciam produtos que já tinham
  // uma linha em estoque_saldo, então um consumível novo nunca aparecia.
  const produtosConsumiveis = useMemo(
    () => produtos.filter((p) => !p.controla_serial && p.is_active),
    [produtos]
  );

  // Vem de todos os produtos serializados ativos (não só dos itens já
  // carregados na página atual) — com busca+paginação no servidor, a lista
  // de itens carregada no cliente é só um recorte, não a base para os
  // filtros de Produto.
  const produtosSerializados = useMemo(
    () => produtos.filter((p) => p.controla_serial && p.is_active),
    [produtos]
  );

  const saldoConsumiveis = useMemo(
    () =>
      produtosConsumiveis.map((produto) => {
        const saldoExistente = saldos.find((s) => s.produto_id === produto.id);
        return { produto, quantidade: saldoExistente?.quantidade ?? 0 };
      }),
    [produtosConsumiveis, saldos]
  );

  const produtosDisponiveis = useMemo(() => {
    const map = new Map<string, string>();
    produtosSerializados.forEach((produto) => map.set(produto.id, produto.nome));
    produtosConsumiveis.forEach((produto) => map.set(produto.id, produto.nome));
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [produtosSerializados, produtosConsumiveis]);

  const quantidadeDisponivelPorProduto = useEstoqueDisponivelPorProduto(
    produtosDisponiveis.map((p) => p.id)
  );

  const filteredSaldoConsumiveis = saldoConsumiveis.filter(({ produto }) => {
    if (categoriaFiltro && produto.categoria !== categoriaFiltro) return false;
    if (produtoFiltro && produto.id !== produtoFiltro) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por série, patrimônio, MAC, cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={categoriaFiltro || 'all'} onValueChange={(v) => setCategoriaFiltro(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categoriasAtivas.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={produtoFiltro || 'all'} onValueChange={(v) => setProdutoFiltro(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {produtosDisponiveis.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Itens Serializados Disponíveis ({filteredItens.length}{hasNextPage ? '+' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {filteredItens.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium truncate max-w-full">{item.produto?.nome}</p>
                      <Badge variant="secondary" className="text-xs">
                        {item.produto?.categoria}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {CONDICAO_LABELS[item.condicao]}
                      </Badge>
                      {(quantidadeDisponivelPorProduto.get(item.produto_id) ?? 0) <= limiteEstoqueBaixo && (
                        <Badge variant="destructive" className="text-xs">
                          <PackageX className="h-3 w-3 mr-1" />
                          Estoque baixo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.numero_serie && <>Série: {item.numero_serie} </>}
                      {item.patrimonio && <>· Patrimônio: {item.patrimonio}</>}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                    {canRetirar && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setRetirarItem(item)}
                      >
                        <UserCog className="h-4 w-4 mr-1" />
                        Retirar para Técnico
                      </Button>
                    )}
                    {canDarBaixa && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setBaixaItem(item)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Dar Baixa / Registrar Defeito
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {filteredItens.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum item disponível encontrado
                </div>
              )}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Carregar mais
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-5 w-5" />
            Saldo de Consumíveis ({filteredSaldoConsumiveis.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSaldo ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {filteredSaldoConsumiveis.map(({ produto, quantidade }) => (
                <div
                  key={produto.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate max-w-full">{produto.nome}</p>
                      <Badge variant="secondary" className="text-xs">
                        {produto.categoria}
                      </Badge>
                      {(quantidadeDisponivelPorProduto.get(produto.id) ?? 0) <= limiteEstoqueBaixo && (
                        <Badge variant="destructive" className="text-xs">
                          <PackageX className="h-3 w-3 mr-1" />
                          Estoque baixo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold whitespace-nowrap">
                      {quantidade} {produto.unidade_medida || 'un'}
                    </p>
                    {canLancarEntrada && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEntradaProduto(produto)}
                      >
                        <PackagePlus className="h-4 w-4 mr-1" />
                        Lançar Entrada
                      </Button>
                    )}
                    {canRetirar && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRetirarConsumivelProduto(produto)}
                      >
                        <UserCog className="h-4 w-4 mr-1" />
                        Retirar para Técnico
                      </Button>
                    )}
                    {canLancarEntrada && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSaidaProduto(produto)}
                      >
                        <PackageMinus className="h-4 w-4 mr-1" />
                        Lançar Saída
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {filteredSaldoConsumiveis.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum produto consumível encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {retirarItem && (
        <RetirarParaTecnicoDialog
          item={retirarItem}
          open={!!retirarItem}
          onClose={() => setRetirarItem(null)}
        />
      )}

      {baixaItem && (
        <DarBaixaDialog
          item={baixaItem}
          open={!!baixaItem}
          onClose={() => setBaixaItem(null)}
        />
      )}

      {entradaProduto && estoqueGeral && (
        <LancarEntradaDialog
          produto={entradaProduto}
          estoqueId={estoqueGeral.id}
          open={!!entradaProduto}
          onClose={() => setEntradaProduto(null)}
        />
      )}

      {saidaProduto && estoqueGeral && (
        <LancarSaidaDialog
          produto={saidaProduto}
          estoqueId={estoqueGeral.id}
          saldoAtual={saldoConsumiveis.find((s) => s.produto.id === saidaProduto.id)?.quantidade ?? 0}
          open={!!saidaProduto}
          onClose={() => setSaidaProduto(null)}
        />
      )}

      {retirarConsumivelProduto && (
        <RetirarConsumivelParaTecnicoDialog
          produto={retirarConsumivelProduto}
          saldoAtual={
            saldoConsumiveis.find((s) => s.produto.id === retirarConsumivelProduto.id)?.quantidade ?? 0
          }
          open={!!retirarConsumivelProduto}
          onClose={() => setRetirarConsumivelProduto(null)}
        />
      )}
    </div>
  );
};

export default EstoqueDisponivel;
