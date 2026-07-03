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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ClipboardList } from 'lucide-react';

interface LancarRecolhimentoDialogProps {
  item: ItemSerializadoWithRelations;
  open: boolean;
  onClose: () => void;
}

const LancarRecolhimentoDialog: React.FC<LancarRecolhimentoDialogProps> = ({
  item,
  open,
  onClose,
}) => {
  const { data: profiles = [] } = useProfiles();
  const { lancarRecolhimento } = useItensSerializados();

  const [tecnicoId, setTecnicoId] = useState('');
  const [titulo, setTitulo] = useState(
    `Recolher ${item.produto?.nome || 'item'} - ${item.cliente_vinculado || ''}`
  );
  const [descricao, setDescricao] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [location, setLocation] = useState(item.local_instalacao || '');

  const handleClose = () => {
    setTecnicoId('');
    setTitulo(`Recolher ${item.produto?.nome || 'item'} - ${item.cliente_vinculado || ''}`);
    setDescricao('');
    setDueDate('');
    setLocation(item.local_instalacao || '');
    onClose();
  };

  const handleConfirm = async () => {
    if (!tecnicoId || !titulo.trim() || !dueDate) return;
    await lancarRecolhimento.mutateAsync({
      itemId: item.id,
      tecnicoId,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      dueDate: new Date(dueDate).toISOString(),
      location: location.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Lançar Recolhimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{item.produto?.nome}</p>
            {item.numero_serie && <p>Série: {item.numero_serie}</p>}
            {item.patrimonio && <p>Patrimônio: {item.patrimonio}</p>}
            {item.cliente_vinculado && <p>Cliente: {item.cliente_vinculado}</p>}
          </div>

          <div className="space-y-2">
            <Label>Técnico responsável pelo recolhimento *</Label>
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
            <Label htmlFor="recolhimento-titulo">Título da tarefa *</Label>
            <Input
              id="recolhimento-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recolhimento-descricao">Descrição</Label>
            <Textarea
              id="recolhimento-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recolhimento-prazo">Prazo *</Label>
              <Input
                id="recolhimento-prazo"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recolhimento-local">Local</Label>
              <Input
                id="recolhimento-local"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!tecnicoId || !titulo.trim() || !dueDate || lancarRecolhimento.isPending}
          >
            {lancarRecolhimento.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lançar Recolhimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LancarRecolhimentoDialog;
