import React, { useMemo } from 'react';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium truncate max-w-full">{item.produto?.nome}</p>
                    <Badge variant="destructive" className="text-xs">
                      Em análise
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.numero_serie && <>Série: {item.numero_serie} </>}
                    {item.patrimonio && <>· Patrimônio: {item.patrimonio}</>}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => voltarDisponivel.mutate({ itemId: item.id })}
                    disabled={voltarDisponivel.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Reparo Concluído
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={confirmarBaixado.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Confirmar Baixa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar baixa definitiva</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja dar baixa definitiva neste equipamento? Ele será
                          removido permanentemente do estoque ativo e essa ação não pode ser
                          desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className={buttonVariants({ variant: 'destructive' })}
                          onClick={() => confirmarBaixado.mutate({ itemId: item.id })}
                        >
                          Confirmar Baixa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
