import React, { useState } from 'react';
import { useItensInstalados } from '@/hooks/useItensSerializados';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ItemSerializadoWithRelations } from '@/types/estoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ClipboardList, MapPin, User, FileText, Search } from 'lucide-react';
import LancarRecolhimentoDialog from './LancarRecolhimentoDialog';

const LancarRecolhimento: React.FC = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const {
    itens: itensInstalados,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useItensInstalados({ search: debouncedSearch });
  const [alvo, setAlvo] = useState<ItemSerializadoWithRelations | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Itens Instalados em Cliente ({itensInstalados.length}{hasNextPage ? '+' : ''})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione um item e um técnico para lançar a tarefa de recolhimento. Isso cria a tarefa
          no Kanban e já move o item para o estoque do técnico.
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, endereço, produto, número de série ou MAC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {itensInstalados.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium">{item.produto?.nome}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    {item.cliente_vinculado && (
                      <p className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {item.cliente_vinculado}
                      </p>
                    )}
                    {item.os_vinculada && (
                      <p className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> OS: {item.os_vinculada}
                      </p>
                    )}
                    {item.local_instalacao && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {item.local_instalacao}
                      </p>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={() => setAlvo(item)}>
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Lançar Recolhimento
                </Button>
              </div>
            ))}

            {itensInstalados.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum item instalado em cliente no momento
              </div>
            )}
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

      {alvo && (
        <LancarRecolhimentoDialog item={alvo} open={!!alvo} onClose={() => setAlvo(null)} />
      )}
    </Card>
  );
};

export default LancarRecolhimento;
