import React, { useMemo } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { CONDICAO_LABELS } from '@/types/estoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users } from 'lucide-react';

const EstoquePorTecnico: React.FC = () => {
  const { data: profiles = [], isLoading: isLoadingProfiles } = useProfiles();
  const { itens, isLoading: isLoadingItens } = useItensSerializados();

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

  const isLoading = isLoadingProfiles || isLoadingItens;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tecnicosComItens = profiles.filter((p) => (itensPorTecnico.get(p.id)?.length || 0) > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        {tecnicosComItens.length} técnico(s) com itens em posse
      </div>

      {tecnicosComItens.map((tecnico) => {
        const itensDoTecnico = itensPorTecnico.get(tecnico.id) || [];
        return (
          <Card key={tecnico.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {tecnico.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {tecnico.full_name}
                <Badge variant="secondary" className="ml-auto">
                  {itensDoTecnico.length} item(ns)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg divide-y">
                {itensDoTecnico.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-3 flex-wrap">
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
            </CardContent>
          </Card>
        );
      })}

      {tecnicosComItens.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum técnico com itens em posse no momento
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EstoquePorTecnico;
