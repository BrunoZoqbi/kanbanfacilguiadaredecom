import React, { useState } from 'react';
import { useTickets } from '@/hooks/useTickets';
import { PrioridadeTicket, PRIORIDADE_TICKET_LABELS } from '@/types/tickets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Loader2, Plus } from 'lucide-react';

const CreateTicketDialog: React.FC = () => {
  const { createTicket } = useTickets();
  const [open, setOpen] = useState(false);

  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfOuContrato, setCpfOuContrato] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoProblema, setTipoProblema] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<PrioridadeTicket>('media');

  const resetForm = () => {
    setNomeCliente('');
    setCpfOuContrato('');
    setTelefone('');
    setTipoProblema('');
    setDescricao('');
    setPrioridade('media');
  };

  const podeSubmeter =
    nomeCliente.trim() &&
    cpfOuContrato.trim() &&
    telefone.trim() &&
    tipoProblema.trim() &&
    descricao.trim() &&
    !createTicket.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSubmeter) return;

    await createTicket.mutateAsync({
      nome_cliente: nomeCliente.trim(),
      cpf_ou_contrato: cpfOuContrato.trim(),
      telefone: telefone.trim(),
      tipo_problema: tipoProblema.trim(),
      descricao: descricao.trim(),
      prioridade,
    });
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-nome-cliente">Nome do Cliente *</Label>
            <Input
              id="ticket-nome-cliente"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ticket-cpf">CPF ou Contrato *</Label>
              <Input
                id="ticket-cpf"
                value={cpfOuContrato}
                onChange={(e) => setCpfOuContrato(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-telefone">Telefone *</Label>
              <Input
                id="ticket-telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-tipo-problema">Tipo de Problema *</Label>
            <Input
              id="ticket-tipo-problema"
              placeholder="Ex: Sem conexão, lentidão, cobrança indevida..."
              value={tipoProblema}
              onChange={(e) => setTipoProblema(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-descricao">Descrição *</Label>
            <Textarea
              id="ticket-descricao"
              className="min-h-[100px]"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Prioridade *</Label>
            <Select value={prioridade} onValueChange={(v) => setPrioridade(v as PrioridadeTicket)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORIDADE_TICKET_LABELS) as PrioridadeTicket[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORIDADE_TICKET_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!podeSubmeter}>
              {createTicket.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketDialog;
