import React, { useState } from 'react';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { ItemSerializadoWithRelations } from '@/types/estoque';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DarBaixaDialogProps {
  item: ItemSerializadoWithRelations;
  open: boolean;
  onClose: () => void;
}

type Motivo = 'analise_defeito' | 'baixado';

const DarBaixaDialog: React.FC<DarBaixaDialogProps> = ({ item, open, onClose }) => {
  const { darBaixa } = useItensSerializados();
  const [motivo, setMotivo] = useState<Motivo>('analise_defeito');
  const [observacao, setObservacao] = useState('');

  const handleClose = () => {
    setMotivo('analise_defeito');
    setObservacao('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!observacao.trim()) return;
    await darBaixa.mutateAsync({
      itemId: item.id,
      novoStatus: motivo,
      observacao: observacao.trim(),
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Dar Baixa / Registrar Defeito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{item.produto?.nome}</p>
            {item.numero_serie && <p>Série: {item.numero_serie}</p>}
            {item.patrimonio && <p>Patrimônio: {item.patrimonio}</p>}
          </div>

          <div className="space-y-2">
            <Label>Motivo *</Label>
            <RadioGroup value={motivo} onValueChange={(v) => setMotivo(v as Motivo)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="analise_defeito" id="motivo-defeito" />
                <Label htmlFor="motivo-defeito" className="cursor-pointer font-normal">
                  Defeito — vai para análise
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="baixado" id="motivo-baixado" />
                <Label htmlFor="motivo-baixado" className="cursor-pointer font-normal">
                  Baixa definitiva — descarte
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baixa-observacao">Observação *</Label>
            <Textarea
              id="baixa-observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva o problema ou motivo da baixa..."
              className="min-h-[80px]"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!observacao.trim() || darBaixa.isPending}
          >
            {darBaixa.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DarBaixaDialog;
