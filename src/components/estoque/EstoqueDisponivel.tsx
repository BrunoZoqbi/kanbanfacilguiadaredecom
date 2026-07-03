import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { useEstoqueSaldo } from '@/hooks/useEstoqueSaldo';
import { CATEGORIAS_PRODUTO, CONDICAO_LABELS, ItemSerializadoWithRelations } from '@/types/estoque';
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
import { Loader2, Boxes, UserCog, Hash, AlertTriangle } from 'lucide-react';
import RetirarParaTecnicoDialog from './RetirarParaTecnicoDialog';
import DarBaixaDialog from './DarBaixaDialog';

const EstoqueDisponivel: React.FC = () => {
  const { isAdmin } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const canRetirar = isAdmin || isGestorTecnico;
  const canDarBaixa = isAdmin || isGestorTecnico;
  const { itens, isLoading, estoqueGeral } = useItensSerializados();
  const { data: saldos = [], isLoading: isLoadingSaldo } = useEstoqueSaldo(estoqueGeral?.id);

  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [produtoFiltro, setProdutoFiltro] = useState('');
  const [retirarItem, setRetirarItem] = useState<ItemSerializadoWithRelations | null>(null);
  const [baixaItem, setBaixaItem] = useState<ItemSerializadoWithRelations | null>(null);

  const itensDisponiveis = useMemo(
    () => itens.filter((item) => item.status === 'disponivel'),
    [itens]
  );

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

  const categoriaLabel = (value?: string) =>
    CATEGORIAS_PRODUTO.find((c) => c.value === value)?.label || value || '-';

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
                {CATEGORIAS_PRODUTO.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
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
                <div key={item.id} className="flex items-center justify-between gap-4 p-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium">{item.produto?.nome}</p>
                      <Badge variant="secondary" className="text-xs">
                        {categoriaLabel(item.produto?.categoria)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {CONDICAO_LABELS[item.condicao]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.numero_serie && <>Série: {item.numero_serie} </>}
                      {item.patrimonio && <>· Patrimônio: {item.patrimonio}</>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canRetirar && (
                      <Button variant="outline" size="sm" onClick={() => setRetirarItem(item)}>
                        <UserCog className="h-4 w-4 mr-1" />
                        Retirar para Técnico
                      </Button>
                    )}
                    {canDarBaixa && (
                      <Button variant="outline" size="sm" onClick={() => setBaixaItem(item)}>
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
                <div key={saldo.id} className="flex items-center justify-between gap-4 p-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{saldo.produto?.nome}</p>
                      <Badge variant="secondary" className="text-xs">
                        {categoriaLabel(saldo.produto?.categoria)}
                      </Badge>
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
