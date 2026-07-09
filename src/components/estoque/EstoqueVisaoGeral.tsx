import React, { useMemo } from 'react';
import { useResumoEstoque } from '@/hooks/useResumoEstoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, PackageCheck, PackageX, Boxes } from 'lucide-react';
import EstoqueStatusPieChart, { buildEstoqueStatusChartData } from './EstoqueStatusPieChart';

const EstoqueVisaoGeral: React.FC = () => {
  const { data, isLoading } = useResumoEstoque();

  const serializados = data?.serializados ?? [];
  const consumiveis = data?.consumiveis ?? [];

  const { totalAtivos, totalBaixados } = useMemo(() => {
    return serializados.reduce(
      (acc, item) => {
        acc.totalAtivos += item.disponivel + item.com_tecnico + item.instalado_cliente + item.analise_defeito;
        acc.totalBaixados += item.baixado;
        return acc;
      },
      { totalAtivos: 0, totalBaixados: 0 }
    );
  }, [serializados]);

  // Soma de todas as categorias/produtos — o detalhamento por categoria já
  // existe no accordion abaixo, este gráfico é só a visão geral por status.
  const statusChartData = useMemo(() => buildEstoqueStatusChartData(serializados), [serializados]);

  const categorias = useMemo(() => {
    const nomes = new Set<string>();
    serializados.forEach((item) => nomes.add(item.categoria));
    consumiveis.forEach((item) => nomes.add(item.categoria));
    return Array.from(nomes).sort((a, b) => a.localeCompare(b));
  }, [serializados, consumiveis]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <PackageCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAtivos}</p>
              <p className="text-sm text-muted-foreground">
                Itens ativos (disponível, com técnico, instalado ou em análise)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <PackageX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalBaixados}</p>
              <p className="text-sm text-muted-foreground">Itens baixados / perdidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <EstoqueStatusPieChart data={statusChartData} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-5 w-5" />
            Estoque por categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum produto cadastrado</p>
          ) : (
            <Accordion type="multiple" className="w-full border rounded-lg px-3">
              {categorias.map((categoria) => {
                const serializadosDaCategoria = serializados.filter((i) => i.categoria === categoria);
                const consumiveisDaCategoria = consumiveis.filter((i) => i.categoria === categoria);

                return (
                  <AccordionItem key={categoria} value={categoria}>
                    <AccordionTrigger className="hover:no-underline">{categoria}</AccordionTrigger>
                    <AccordionContent className="space-y-6">
                      {serializadosDaCategoria.length > 0 && (
                        <div className="overflow-x-auto">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Itens serializados
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">Disponível</TableHead>
                                <TableHead className="text-right">Com Técnico</TableHead>
                                <TableHead className="text-right">Instalado</TableHead>
                                <TableHead className="text-right">Em Análise</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {serializadosDaCategoria.map((item) => (
                                <TableRow key={item.produto_id}>
                                  <TableCell className="font-medium">{item.produto_nome}</TableCell>
                                  <TableCell className="text-right">{item.disponivel}</TableCell>
                                  <TableCell className="text-right">{item.com_tecnico}</TableCell>
                                  <TableCell className="text-right">{item.instalado_cliente}</TableCell>
                                  <TableCell className="text-right">{item.analise_defeito}</TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {item.disponivel + item.com_tecnico + item.instalado_cliente + item.analise_defeito}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {consumiveisDaCategoria.length > 0 && (
                        <div className="overflow-x-auto">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Consumíveis</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">Saldo na Sede</TableHead>
                                <TableHead className="text-right">Saldo com Técnicos</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {consumiveisDaCategoria.map((item) => (
                                <TableRow key={item.produto_id}>
                                  <TableCell className="font-medium">
                                    {item.produto_nome}
                                    {item.unidade_medida && (
                                      <span className="text-muted-foreground"> ({item.unidade_medida})</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">{item.saldo_sede}</TableCell>
                                  <TableCell className="text-right">{item.saldo_tecnicos}</TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {item.saldo_sede + item.saldo_tecnicos}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EstoqueVisaoGeral;
