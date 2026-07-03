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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wrench } from 'lucide-react';

interface InstalarItemDialogProps {
  item: ItemSerializadoWithRelations;
  open: boolean;
  onClose: () => void;
}

const InstalarItemDialog: React.FC<InstalarItemDialogProps> = ({ item, open, onClose }) => {
  const { instalarItem } = useItensSerializados();
  const [clienteVinculado, setClienteVinculado] = useState('');
  const [osVinculada, setOsVinculada] = useState('');
  const [localInstalacao, setLocalInstalacao] = useState('');

  const handleClose = () => {
    setClienteVinculado('');
    setOsVinculada('');
    setLocalInstalacao('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!clienteVinculado.trim()) return;
    await instalarItem.mutateAsync({
      itemId: item.id,
      clienteVinculado: clienteVinculado.trim(),
      osVinculada: osVinculada.trim(),
      localInstalacao: localInstalacao.trim(),
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Instalar / Usar Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{item.produto?.nome}</p>
            {item.numero_serie && <p>Série: {item.numero_serie}</p>}
            {item.patrimonio && <p>Patrimônio: {item.patrimonio}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instalar-cliente">Cliente *</Label>
            <Input
              id="instalar-cliente"
              placeholder="Nome do cliente"
              value={clienteVinculado}
              onChange={(e) => setClienteVinculado(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instalar-os">OS Vinculada</Label>
            <Input
              id="instalar-os"
              placeholder="Número da ordem de serviço"
              value={osVinculada}
              onChange={(e) => setOsVinculada(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instalar-local">Local de Instalação</Label>
            <Input
              id="instalar-local"
              placeholder="Endereço ou identificação do local"
              value={localInstalacao}
              onChange={(e) => setLocalInstalacao(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!clienteVinculado.trim() || instalarItem.isPending}
          >
            {instalarItem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Instalação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstalarItemDialog;
