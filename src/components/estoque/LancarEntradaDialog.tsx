import React, { useState } from 'react';
import { useEstoqueSaldo } from '@/hooks/useEstoqueSaldo';
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
import { Loader2, PackagePlus } from 'lucide-react';

interface LancarEntradaDialogProps {
  produto: Produto;
  estoqueId: string;
  open: boolean;
  onClose: () => void;
}

const LancarEntradaDialog: React.FC<LancarEntradaDialogProps> = ({
  produto,
  estoqueId,
  open,
  onClose,
}) => {
  const { lancarEntrada } = useEstoqueSaldo(estoqueId);
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

    await lancarEntrada.mutateAsync({
      produtoId: produto.id,
      estoqueId,
      quantidade: valor,
      observacao: observacao.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Lançar Entrada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{produto.nome}</p>
            <p>{produto.categoria}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entrada-quantidade">Quantidade *</Label>
            <Input
              id="entrada-quantidade"
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
            <Label htmlFor="entrada-observacao">Observação (opcional)</Label>
            <Textarea
              id="entrada-observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: nota fiscal nº 1234"
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
            disabled={lancarEntrada.isPending}
          >
            {lancarEntrada.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Entrada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LancarEntradaDialog;
