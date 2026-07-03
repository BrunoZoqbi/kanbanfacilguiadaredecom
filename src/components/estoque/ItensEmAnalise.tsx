import React, { useMemo } from 'react';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Wrench, CheckCircle2, XCircle } from 'lucide-react';

const ItensEmAnalise: React.FC = () => {
  const { itens, isLoading, voltarDisponivel, confirmarBaixado } = useItensSerializados();

  const itensEmAnalise = useMemo(
    () => itens.filter((item) => item.status === 'analise_defeito'),
    [itens]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Itens em Análise ({itensEmAnalise.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Itens marcados com defeito, aguardando conclusão do reparo ou confirmação de baixa.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {itensEmAnalise.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium">{item.produto?.nome}</p>
                    <Badge variant="destructive" className="text-xs">
                      Em análise
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.numero_serie && <>Série: {item.numero_serie} </>}
                    {item.patrimonio && <>· Patrimônio: {item.patrimonio}</>}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => voltarDisponivel.mutate({ itemId: item.id })}
                    disabled={voltarDisponivel.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Reparo Concluído
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmarBaixado.mutate({ itemId: item.id })}
                    disabled={confirmarBaixado.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Confirmar Baixa
                  </Button>
                </div>
              </div>
            ))}

            {itensEmAnalise.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum item em análise no momento
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ItensEmAnalise;
