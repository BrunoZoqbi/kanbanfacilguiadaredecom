import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useProfiles } from '@/hooks/useProfiles';
import { useTickets } from '@/hooks/useTickets';
import { useTicketDetail } from '@/hooks/useTicketDetail';
import {
  PrioridadeTicket,
  PRIORIDADE_TICKET_BADGE_CLASSES,
  PRIORIDADE_TICKET_LABELS,
  StatusTicket,
  STATUS_TICKET_BADGE_CLASSES,
  STATUS_TICKET_LABELS,
  Ticket,
} from '@/types/tickets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Lock, MessageSquare, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, open, onClose }) => {
  const { isAdmin } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const canManageAtendente = isAdmin || isGestorTecnico;
  const { data: profiles = [] } = useProfiles();
  const { updateStatus, updatePrioridade, updateAtendente } = useTickets();
  const { respostas, notasInternas, addResposta, addNotaInterna } = useTicketDetail(
    ticket?.id ?? null
  );

  const [novaResposta, setNovaResposta] = useState('');
  const [novaNota, setNovaNota] = useState('');

  if (!ticket) return null;

  const handleAddResposta = () => {
    if (!novaResposta.trim()) return;
    addResposta.mutate({ ticket_id: ticket.id, texto: novaResposta.trim(), created_by_id: ticket.created_by_id });
    setNovaResposta('');
  };

  const handleAddNota = () => {
    if (!novaNota.trim()) return;
    addNotaInterna.mutate({ ticket_id: ticket.id, texto: novaNota.trim() });
    setNovaNota('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn(STATUS_TICKET_BADGE_CLASSES[ticket.status])}>
                  {STATUS_TICKET_LABELS[ticket.status]}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(PRIORIDADE_TICKET_BADGE_CLASSES[ticket.prioridade])}
                >
                  {PRIORIDADE_TICKET_LABELS[ticket.prioridade]}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-display">
                Ticket #{ticket.numero_ticket} — {ticket.nome_cliente}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Client info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">CPF ou Contrato</p>
              <p className="font-medium">{ticket.cpf_ou_contrato}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p className="font-medium">{ticket.telefone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo de Problema</p>
              <p className="font-medium">{ticket.tipo_problema}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Criado em</p>
              <p className="font-medium">
                {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2 font-display">Descrição</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.descricao}</p>
          </div>

          <Separator />

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-status">Status</Label>
              <Select
                value={ticket.status}
                onValueChange={(v) => updateStatus.mutate({ id: ticket.id, status: v as StatusTicket })}
              >
                <SelectTrigger id="ticket-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_TICKET_LABELS) as StatusTicket[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_TICKET_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-prioridade-detalhe">Prioridade</Label>
              <Select
                value={ticket.prioridade}
                onValueChange={(v) =>
                  updatePrioridade.mutate({ id: ticket.id, prioridade: v as PrioridadeTicket })
                }
              >
                <SelectTrigger id="ticket-prioridade-detalhe">
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

            <div className="space-y-2">
              <Label htmlFor="ticket-atendente">Atendente</Label>
              {canManageAtendente ? (
                <Select
                  value={ticket.atendente_id ?? 'none'}
                  onValueChange={(v) =>
                    updateAtendente.mutate({ id: ticket.id, atendente_id: v === 'none' ? null : v })
                  }
                >
                  <SelectTrigger id="ticket-atendente">
                    <SelectValue placeholder="Não atribuído" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não atribuído</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground h-10">
                  <User className="h-4 w-4" />
                  {profiles.find((p) => p.id === ticket.atendente_id)?.full_name || 'Não atribuído'}
                </div>
              )}
            </div>
          </div>

          {ticket.status !== 'resolvido' && ticket.status !== 'fechado' && (
            <Button
              onClick={() => updateStatus.mutate({ id: ticket.id, status: 'resolvido' })}
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar como Resolvido
            </Button>
          )}

          <Separator />

          <Tabs defaultValue="respostas">
            <TabsList>
              <TabsTrigger value="respostas" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Respostas
              </TabsTrigger>
              <TabsTrigger value="notas" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Notas Internas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="respostas" className="space-y-4 mt-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {respostas.map((resposta) => (
                  <div key={resposta.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium">{resposta.autor_nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(resposta.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {resposta.texto}
                    </p>
                  </div>
                ))}
                {respostas.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma resposta ainda
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Responder ao cliente..."
                  aria-label="Responder ao cliente"
                  value={novaResposta}
                  onChange={(e) => setNovaResposta(e.target.value)}
                  className="flex-1 min-h-[80px]"
                />
                <Button onClick={handleAddResposta} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="notas" className="space-y-4 mt-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notasInternas.map((nota) => (
                  <div key={nota.id} className="rounded-lg border border-dashed p-3 bg-muted/40">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {profiles.find((p) => p.id === nota.autor_id)?.full_name || 'Equipe'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(nota.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{nota.texto}</p>
                  </div>
                ))}
                {notasInternas.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma nota interna ainda
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Nota interna (visível apenas para a equipe)..."
                  aria-label="Nota interna"
                  value={novaNota}
                  onChange={(e) => setNovaNota(e.target.value)}
                  className="flex-1 min-h-[80px]"
                />
                <Button onClick={handleAddNota} variant="secondary" className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailModal;
