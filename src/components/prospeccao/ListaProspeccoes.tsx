import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useProspeccoes } from '@/hooks/useProspeccoes';
import { useProspeccoesInfinite } from '@/hooks/useProspeccoesInfinite';
import { useProspeccaoStats } from '@/hooks/useProspeccaoStats';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  CLASSIFICACAO_BADGE_CLASSES,
  CLASSIFICACAO_LABELS,
  ClassificacaoProspeccao,
  STATUS_PROSPECCAO_LABELS,
  StatusProspeccao,
} from '@/types/prospeccao';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProspeccaoDetailModal from './ProspeccaoDetailModal';
import ProspeccaoClassificacaoPieChart, {
  buildClassificacaoChartData,
} from './ProspeccaoClassificacaoPieChart';
import ProspeccaoSemanalBarChart, { buildProspeccoesPorSemana } from './ProspeccaoSemanalBarChart';

const ListaProspeccoes: React.FC = () => {
  const { isAdmin } = useAuth();
  // Fetch completo mantido só para o gráfico semanal (precisa do conjunto
  // inteiro) e para as mutações — a lista renderizada abaixo usa
  // useProspeccoesInfinite, paginada e com busca server-side.
  const { prospeccoes: allProspeccoes, updateStatus, updateObservacoes } = useProspeccoes();

  const [classificacaoFiltro, setClassificacaoFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedProspeccaoId, setSelectedProspeccaoId] = useState<string | null>(null);

  const { stats: metrics } = useProspeccaoStats();

  const classificacaoChartData = useMemo(() => buildClassificacaoChartData(metrics), [metrics]);
  const prospeccoesPorSemana = useMemo(() => buildProspeccoesPorSemana(allProspeccoes), [allProspeccoes]);

  const {
    prospeccoes: filteredProspeccoes,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProspeccoesInfinite({
    search: debouncedSearch,
    classificacao: classificacaoFiltro as any,
    status: statusFiltro as any,
    pageSize: 20,
  });

  const selectedProspeccao = filteredProspeccoes.find((p) => p.id === selectedProspeccaoId) || null;

  return (
    <div className="space-y-6">
      {/* Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" />
              Total
            </div>
            <p className="text-2xl font-bold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Baixa
            </div>
            <p className="text-2xl font-bold">{metrics.baixa}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Média
            </div>
            <p className="text-2xl font-bold">{metrics.media}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Alta
            </div>
            <p className="text-2xl font-bold">{metrics.alta}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Taxa de Conversão
            </div>
            <p className="text-2xl font-bold">{metrics.taxaConversao}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProspeccaoClassificacaoPieChart data={classificacaoChartData} />
        <ProspeccaoSemanalBarChart data={prospeccoesPorSemana} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou endereço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={classificacaoFiltro || 'all'}
              onValueChange={(v) => setClassificacaoFiltro(v === 'all' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Classificação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as classificações</SelectItem>
                {(Object.keys(CLASSIFICACAO_LABELS) as ClassificacaoProspeccao[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CLASSIFICACAO_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFiltro || 'all'} onValueChange={(v) => setStatusFiltro(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {(Object.keys(STATUS_PROSPECCAO_LABELS) as StatusProspeccao[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_PROSPECCAO_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAdmin ? 'Todas as Prospecções' : 'Minhas Prospecções'} (
            {filteredProspeccoes.length}
            {hasNextPage ? '+' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Mobile: stacked cards */}
              <div className="space-y-3 sm:hidden">
                {filteredProspeccoes.map((prospeccao) => (
                  <div
                    key={prospeccao.id}
                    className="border rounded-lg p-3 space-y-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedProspeccaoId(prospeccao.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedProspeccaoId(prospeccao.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{prospeccao.nome_contato}</p>
                        <Badge
                          variant="outline"
                          className={cn('shrink-0', CLASSIFICACAO_BADGE_CLASSES[prospeccao.classificacao])}
                        >
                          {CLASSIFICACAO_LABELS[prospeccao.classificacao]} ({prospeccao.pontuacao_total})
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {prospeccao.telefone_whatsapp}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Contato: {format(new Date(prospeccao.data_contato), 'dd/MM/yyyy', { locale: ptBR })}
                        {prospeccao.data_retorno_prevista && (
                          <>
                            {' '}
                            · Retorno: {format(new Date(prospeccao.data_retorno_prevista), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={prospeccao.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({ id: prospeccao.id, status: v as StatusProspeccao })
                        }
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_PROSPECCAO_LABELS) as StatusProspeccao[]).map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_PROSPECCAO_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        defaultValue={prospeccao.observacoes || ''}
                        placeholder="Adicionar observação..."
                        className="h-9 w-full text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== (prospeccao.observacoes || '')) {
                            updateObservacoes.mutate({ id: prospeccao.id, observacoes: e.target.value });
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Classificação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Contato</TableHead>
                      <TableHead>Retorno Previsto</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProspeccoes.map((prospeccao) => (
                      <TableRow
                        key={prospeccao.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedProspeccaoId(prospeccao.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedProspeccaoId(prospeccao.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <TableCell className="font-medium max-w-[160px] truncate">
                          {prospeccao.nome_contato}
                        </TableCell>
                        <TableCell>{prospeccao.telefone_whatsapp}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(CLASSIFICACAO_BADGE_CLASSES[prospeccao.classificacao])}
                          >
                            {CLASSIFICACAO_LABELS[prospeccao.classificacao]} ({prospeccao.pontuacao_total})
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={prospeccao.status}
                            onValueChange={(v) =>
                              updateStatus.mutate({ id: prospeccao.id, status: v as StatusProspeccao })
                            }
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(STATUS_PROSPECCAO_LABELS) as StatusProspeccao[]).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_PROSPECCAO_LABELS[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(prospeccao.data_contato), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {prospeccao.data_retorno_prevista
                            ? format(new Date(prospeccao.data_retorno_prevista), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Input
                            defaultValue={prospeccao.observacoes || ''}
                            placeholder="Adicionar observação..."
                            className="h-8 min-w-48 text-sm"
                            onBlur={(e) => {
                              if (e.target.value !== (prospeccao.observacoes || '')) {
                                updateObservacoes.mutate({ id: prospeccao.id, observacoes: e.target.value });
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {!isLoading && filteredProspeccoes.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma prospecção encontrada
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Carregar mais
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProspeccaoDetailModal
        key={selectedProspeccaoId}
        prospeccao={selectedProspeccao}
        open={!!selectedProspeccao}
        onClose={() => setSelectedProspeccaoId(null)}
      />
    </div>
  );
};

export default ListaProspeccoes;
