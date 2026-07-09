import React, { useState } from 'react';
import { useConsumivelSaldoTecnico } from '@/hooks/useConsumivelSaldoTecnico';
import { Produto } from '@/types/estoque';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Undo2 } from 'lucide-react';

interface DevolverConsumivelSedeDialogProps {
  produto: Produto;
  saldoAtual: number;
  open: boolean;
  onClose: () => void;
}

const DevolverConsumivelSedeDialog: React.FC<DevolverConsumivelSedeDialogProps> = ({
  produto,
  saldoAtual,
  open,
  onClose,
}) => {
  const { devolverSede } = useConsumivelSaldoTecnico();
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  const handleClose = () => {
    setQuantidade('');
    setObservacao('');
    setErro('');
    onClose();
  };

  const handleConfirm = async () => {
    const valor = Number(quantidade);
    if (!quantidade.trim() || !Number.isFinite(valor) || valor <= 0) {
      setErro('Informe uma quantidade válida, maior que zero.');
      return;
    }

    try {
      await devolverSede.mutateAsync({
        produtoId: produto.id,
        quantidade: valor,
        observacao: observacao.trim() || undefined,
      });
      handleClose();
    } catch (error: any) {
      // Mensagem da própria RPC (ex: saldo insuficiente com você) — mantém o
      // dialog aberto com o erro visível.
      setErro(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Devolver à Sede
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{produto.nome}</p>
            <p>
              {produto.categoria} · Com você: {saldoAtual} {produto.unidade_medida || 'un'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="devolver-consumivel-quantidade">Quantidade *</Label>
            <Input
              id="devolver-consumivel-quantidade"
              type="number"
              min="1"
              step="1"
              placeholder={`Quantidade em ${produto.unidade_medida || 'un'}`}
              value={quantidade}
              onChange={(e) => {
                setQuantidade(e.target.value);
                if (erro) setErro('');
              }}
            />
            {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="devolver-consumivel-observacao">Observação (opcional)</Label>
            <Textarea
              id="devolver-consumivel-observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Detalhes sobre a devolução..."
              className="min-h-[70px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="h-11 sm:h-10" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="h-11 sm:h-10"
            onClick={handleConfirm}
            disabled={devolverSede.isPending}
          >
            {devolverSede.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Devolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DevolverConsumivelSedeDialog;
