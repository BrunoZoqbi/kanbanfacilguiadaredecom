import React, { useMemo } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { useConsumivelSaldoTodos } from '@/hooks/useConsumivelSaldoTodos';
import { CONDICAO_LABELS } from '@/types/estoque';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Users } from 'lucide-react';

const EstoquePorTecnico: React.FC = () => {
  const { data: profiles = [], isLoading: isLoadingProfiles } = useProfiles();
  const { itens, isLoading: isLoadingItens } = useItensSerializados();
  const { data: consumiveisTodos = [], isLoading: isLoadingConsumiveis } = useConsumivelSaldoTodos();

  const itensPorTecnico = useMemo(() => {
    const map = new Map<string, typeof itens>();
    itens
      .filter((item) => item.tecnico_atual_id)
      .forEach((item) => {
        const key = item.tecnico_atual_id!;
        map.set(key, [...(map.get(key) || []), item]);
      });
    return map;
  }, [itens]);

  const consumiveisPorTecnico = useMemo(() => {
    const map = new Map<string, typeof consumiveisTodos>();
    consumiveisTodos.forEach((saldo) => {
      map.set(saldo.tecnico_id, [...(map.get(saldo.tecnico_id) || []), saldo]);
    });
    return map;
  }, [consumiveisTodos]);

  const tecnicosAtivos = useMemo(() => {
    const idsComItens = new Set([
      ...Array.from(itensPorTecnico.keys()),
      ...Array.from(consumiveisPorTecnico.keys()),
    ]);
    return profiles.filter((p) => idsComItens.has(p.id));
  }, [profiles, itensPorTecnico, consumiveisPorTecnico]);

  const isLoading = isLoadingProfiles || isLoadingItens || isLoadingConsumiveis;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tecnicosAtivos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum técnico com itens em posse no momento
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        {tecnicosAtivos.length} técnico(s) com itens em posse
      </div>

      <Accordion type="multiple" className="border rounded-lg px-3">
        {tecnicosAtivos.map((tecnico) => {
          const itensDoTecnico = itensPorTecnico.get(tecnico.id) || [];
          const consumiveisDoTecnico = consumiveisPorTecnico.get(tecnico.id) || [];

          const badgeParts: string[] = [];
          if (itensDoTecnico.length > 0)
            badgeParts.push(`${itensDoTecnico.length} serializado(s)`);
          if (consumiveisDoTecnico.length > 0)
            badgeParts.push(`${consumiveisDoTecnico.length} consumível(is)`);

          return (
            <AccordionItem key={tecnico.id} value={tecnico.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {tecnico.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{tecnico.full_name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {badgeParts.join(' · ')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pb-2">
                  {itensDoTecnico.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Serializados ({itensDoTecnico.length} itens)
                      </p>
                      <div className="border rounded-lg divide-y">
                        {itensDoTecnico.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 p-3 flex-wrap"
                          >
                            <div className="min-w-0">
                              <p className="font-medium">{item.produto?.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.numero_serie && <>Série: {item.numero_serie} </>}
                                {item.patrimonio && <>· Patrimônio: {item.patrimonio}</>}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {CONDICAO_LABELS[item.condicao]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {consumiveisDoTecnico.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Consumíveis</p>
                      <div className="border rounded-lg divide-y">
                        {consumiveisDoTecnico.map((saldo) => (
                          <div
                            key={saldo.id}
                            className="flex items-center justify-between gap-2 p-3"
                          >
                            <p className="font-medium">{saldo.produto?.nome}</p>
                            <p className="text-sm font-semibold whitespace-nowrap">
                              {saldo.quantidade} {saldo.produto?.unidade_medida || 'un'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default EstoquePorTecnico;
