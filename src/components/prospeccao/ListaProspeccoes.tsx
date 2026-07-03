import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useProspeccoes } from '@/hooks/useProspeccoes';
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
import { Loader2, TrendingUp, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ListaProspeccoes: React.FC = () => {
  const { isAdmin } = useAuth();
  const { prospeccoes, isLoading, updateStatus, updateObservacoes } = useProspeccoes();

  const [classificacaoFiltro, setClassificacaoFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');

  const metrics = useMemo(() => {
    const total = prospeccoes.length;
    const baixa = prospeccoes.filter((p) => p.classificacao === 'baixa').length;
    const media = prospeccoes.filter((p) => p.classificacao === 'media').length;
    const alta = prospeccoes.filter((p) => p.classificacao === 'alta').length;
    const convertidas = prospeccoes.filter((p) => p.status === 'convertido').length;
    const taxaConversao = total > 0 ? Math.round((convertidas / total) * 100) : 0;
    return { total, baixa, media, alta, taxaConversao };
  }, [prospeccoes]);

  const filteredProspeccoes = prospeccoes.filter((p) => {
    if (classificacaoFiltro && p.classificacao !== classificacaoFiltro) return false;
    if (statusFiltro && p.status !== statusFiltro) return false;
    return true;
  });

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            {isAdmin ? 'Todas as Prospecções' : 'Minhas Prospecções'} ({filteredProspeccoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
                  <TableRow key={prospeccao.id}>
                    <TableCell className="font-medium">{prospeccao.nome_contato}</TableCell>
                    <TableCell>{prospeccao.telefone_whatsapp}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(CLASSIFICACAO_BADGE_CLASSES[prospeccao.classificacao])}
                      >
                        {CLASSIFICACAO_LABELS[prospeccao.classificacao]} ({prospeccao.pontuacao_total})
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
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
          )}

          {!isLoading && filteredProspeccoes.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma prospecção encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ListaProspeccoes;
