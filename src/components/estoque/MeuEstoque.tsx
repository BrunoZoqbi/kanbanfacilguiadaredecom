import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { CONDICAO_LABELS, ItemSerializadoWithRelations } from '@/types/estoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Wrench, Undo2, PackageCheck, AlertTriangle } from 'lucide-react';
import InstalarItemDialog from './InstalarItemDialog';
import DarBaixaDialog from './DarBaixaDialog';

const MeuEstoque: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const canDarBaixa = isAdmin || isGestorTecnico;
  const { itens, isLoading, devolverSede } = useItensSerializados();

  const [instalarItemAlvo, setInstalarItemAlvo] = useState<ItemSerializadoWithRelations | null>(null);
  const [baixaItem, setBaixaItem] = useState<ItemSerializadoWithRelations | null>(null);

  const meusItens = useMemo(
    () => itens.filter((item) => item.tecnico_atual_id === user?.id),
    [itens, user]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Meus Itens ({meusItens.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Itens retirados para você pela sede, ou recolhidos automaticamente quando o Gestor
            Técnico lança uma tarefa de recolhimento.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {meusItens.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 p-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium">{item.produto?.nome}</p>
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
                    <Button variant="outline" size="sm" onClick={() => setInstalarItemAlvo(item)}>
                      <Wrench className="h-4 w-4 mr-1" />
                      Instalar / Usar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => devolverSede.mutate({ itemId: item.id })}
                      disabled={devolverSede.isPending}
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Devolver na Sede
                    </Button>
                    {canDarBaixa && (
                      <Button variant="outline" size="sm" onClick={() => setBaixaItem(item)}>
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Dar Baixa / Registrar Defeito
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {meusItens.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum item com você no momento
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {instalarItemAlvo && (
        <InstalarItemDialog
          item={instalarItemAlvo}
          open={!!instalarItemAlvo}
          onClose={() => setInstalarItemAlvo(null)}
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

export default MeuEstoque;
