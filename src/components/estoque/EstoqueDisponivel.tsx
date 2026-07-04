import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { useEstoqueSaldo } from '@/hooks/useEstoqueSaldo';
import { useCategoriasProduto } from '@/hooks/useCategoriasProduto';
import { CONDICAO_LABELS, ItemSerializadoWithRelations } from '@/types/estoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Boxes, UserCog, Hash, AlertTriangle, PackageX } from 'lucide-react';
import RetirarParaTecnicoDialog from './RetirarParaTecnicoDialog';
import DarBaixaDialog from './DarBaixaDialog';

// Mesma definição usada pela RPC estoque_disponivel_por_produto: itens
// serializados 'disponivel' + saldo de consumíveis do estoque geral.
const LIMITE_ESTOQUE_BAIXO = 2;

const EstoqueDisponivel: React.FC = () => {
  const { isAdmin } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const canRetirar = isAdmin || isGestorTecnico;
  const canDarBaixa = isAdmin || isGestorTecnico;
  const { itens, isLoading, estoqueGeral } = useItensSerializados();
  const { data: saldos = [], isLoading: isLoadingSaldo } = useEstoqueSaldo(estoqueGeral?.id);
  const { categorias } = useCategoriasProduto();
  const categoriasAtivas = categorias.filter((c) => c.ativo);

  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [produtoFiltro, setProdutoFiltro] = useState('');
  const [retirarItem, setRetirarItem] = useState<ItemSerializadoWithRelations | null>(null);
  const [baixaItem, setBaixaItem] = useState<ItemSerializadoWithRelations | null>(null);

  const itensDisponiveis = useMemo(
    () => itens.filter((item) => item.status === 'disponivel'),
    [itens]
  );

  const quantidadeDisponivelPorProduto = useMemo(() => {
    const map = new Map<string, number>();
    itensDisponiveis.forEach((item) => {
      map.set(item.produto_id, (map.get(item.produto_id) || 0) + 1);
    });
    saldos.forEach((saldo) => {
      map.set(saldo.produto_id, (map.get(saldo.produto_id) || 0) + saldo.quantidade);
    });
    return map;
  }, [itensDisponiveis, saldos]);

  const produtosDisponiveis = useMemo(() => {
    const map = new Map<string, string>();
    itensDisponiveis.forEach((item) => {
      if (item.produto) map.set(item.produto.id, item.produto.nome);
    });
    saldos.forEach((saldo) => {
      if (saldo.produto) map.set(saldo.produto.id, saldo.produto.nome);
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [itensDisponiveis, saldos]);

  const filteredItens = itensDisponiveis.filter((item) => {
    if (categoriaFiltro && item.produto?.categoria !== categoriaFiltro) return false;
    if (produtoFiltro && item.produto_id !== produtoFiltro) return false;
    return true;
  });

  const filteredSaldos = saldos.filter((saldo) => {
    if (categoriaFiltro && saldo.produto?.categoria !== categoriaFiltro) return false;
    if (produtoFiltro && saldo.produto_id !== produtoFiltro) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
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
            Itens Serializados Disponíveis ({filteredItens.length})
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
                      {(quantidadeDisponivelPorProduto.get(item.produto_id) ?? 0) <= LIMITE_ESTOQUE_BAIXO && (
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-5 w-5" />
            Saldo de Consumíveis ({filteredSaldos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSaldo ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {filteredSaldos.map((saldo) => (
                <div key={saldo.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate max-w-full">{saldo.produto?.nome}</p>
                      <Badge variant="secondary" className="text-xs">
                        {saldo.produto?.categoria}
                      </Badge>
                      {(quantidadeDisponivelPorProduto.get(saldo.produto_id) ?? 0) <= LIMITE_ESTOQUE_BAIXO && (
                        <Badge variant="destructive" className="text-xs">
                          <PackageX className="h-3 w-3 mr-1" />
                          Estoque baixo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold">
                    {saldo.quantidade} {saldo.produto?.unidade_medida || 'un'}
                  </p>
                </div>
              ))}

              {filteredSaldos.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum saldo de consumível encontrado
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
    </div>
  );
};

export default EstoqueDisponivel;
