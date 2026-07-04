import React, { useState } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserCog } from 'lucide-react';

interface RetirarParaTecnicoDialogProps {
  item: ItemSerializadoWithRelations;
  open: boolean;
  onClose: () => void;
}

const RetirarParaTecnicoDialog: React.FC<RetirarParaTecnicoDialogProps> = ({
  item,
  open,
  onClose,
}) => {
  const { data: profiles = [] } = useProfiles();
  const { retirarParaTecnico } = useItensSerializados();
  const [tecnicoId, setTecnicoId] = useState('');
  const [observacao, setObservacao] = useState('');

  const handleClose = () => {
    setTecnicoId('');
    setObservacao('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!tecnicoId) return;
    await retirarParaTecnico.mutateAsync({
      itemId: item.id,
      tecnicoId,
      observacao: observacao.trim() || undefined,
    });
    handleClose();
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
            <p className="font-medium text-foreground">{item.produto?.nome}</p>
            {item.numero_serie && <p>Série: {item.numero_serie}</p>}
            {item.patrimonio && <p>Patrimônio: {item.patrimonio}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Técnico</label>
            <Select value={tecnicoId} onValueChange={setTecnicoId}>
              <SelectTrigger>
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
            <label className="text-sm font-medium">Observação (opcional)</label>
            <Textarea
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

export default RetirarParaTecnicoDialog;
