import React, { useState } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserCog } from 'lucide-react';

interface RetirarConsumivelParaTecnicoDialogProps {
  produto: Produto;
  saldoAtual: number;
  open: boolean;
  onClose: () => void;
}

const RetirarConsumivelParaTecnicoDialog: React.FC<RetirarConsumivelParaTecnicoDialogProps> = ({
  produto,
  saldoAtual,
  open,
  onClose,
}) => {
  const { data: profiles = [] } = useProfiles();
  const { retirarParaTecnico } = useConsumivelSaldoTecnico();
  const [tecnicoId, setTecnicoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  const handleClose = () => {
    setTecnicoId('');
    setQuantidade('');
    setObservacao('');
    setErro('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!tecnicoId) return;

    const valor = Number(quantidade);
    if (!quantidade.trim() || !Number.isFinite(valor) || valor <= 0) {
      setErro('Informe uma quantidade válida, maior que zero.');
      return;
    }

    try {
      await retirarParaTecnico.mutateAsync({
        produtoId: produto.id,
        tecnicoId,
        quantidade: valor,
        observacao: observacao.trim() || undefined,
      });
      handleClose();
    } catch (error: any) {
      // Mensagem da própria RPC (ex: saldo insuficiente na sede) — mantém o
      // dialog aberto com o erro visível.
      setErro(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Retirar para Técnico
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{produto.nome}</p>
            <p>
              {produto.categoria} · Saldo na sede: {saldoAtual} {produto.unidade_medida || 'un'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retirar-consumivel-tecnico">Técnico</Label>
            <Select value={tecnicoId} onValueChange={setTecnicoId}>
              <SelectTrigger id="retirar-consumivel-tecnico">
                <SelectValue placeholder="Selecione o técnico..." />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retirar-consumivel-quantidade">Quantidade *</Label>
            <Input
              id="retirar-consumivel-quantidade"
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
            <Label htmlFor="retirar-consumivel-observacao">Observação (opcional)</Label>
            <Textarea
              id="retirar-consumivel-observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Detalhes sobre a retirada..."
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
            disabled={!tecnicoId || retirarParaTecnico.isPending}
          >
            {retirarParaTecnico.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Retirada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RetirarConsumivelParaTecnicoDialog;
