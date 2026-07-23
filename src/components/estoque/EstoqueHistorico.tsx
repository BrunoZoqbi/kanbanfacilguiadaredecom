import React, { useState } from 'react';
import { useMovimentacoesEstoque } from '@/hooks/useMovimentacoesEstoque';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { TIPO_MOVIMENTO_LABELS, TipoMovimentoEstoque } from '@/types/estoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, History, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EstoqueHistorico: React.FC = () => {
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebouncedValue(busca, 400);
  const [tipoFiltro, setTipoFiltro] = useState('');

  const {
    movimentacoes,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMovimentacoesEstoque({
    search: buscaDebounced,
    tipo: tipoFiltro,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Movimentações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto, série, técnico, observação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tipoFiltro || 'all'} onValueChange={(v) => setTipoFiltro(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Tipo de movimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(Object.entries(TIPO_MOVIMENTO_LABELS) as [TipoMovimentoEstoque, string][]).map(
                ([valor, label]) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : movimentacoes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma movimentação encontrada{busca || tipoFiltro ? ' para esse filtro' : ''}.
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto/Item</TableHead>
                  <TableHead>Nº Série</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(mov.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {TIPO_MOVIMENTO_LABELS[mov.tipo_movimento]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-56 truncate">{mov.produto_nome}</TableCell>
                    <TableCell className="whitespace-nowrap">{mov.numero_serie || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{mov.tecnico_nome || '—'}</TableCell>
                    <TableCell className="text-right">{mov.quantidade}</TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground">
                      {mov.observacao || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Carregar mais
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EstoqueHistorico;
