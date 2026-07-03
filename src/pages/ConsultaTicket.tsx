import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import {
  STATUS_TICKET_BADGE_CLASSES,
  STATUS_TICKET_LABELS,
  StatusTicket,
} from '@/types/tickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowLeft, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import fibrontecLogo from '@/assets/fibrontec-logo-horizontal.png';

interface ConsultaResposta {
  autor_nome: string;
  texto: string;
  created_at: string;
}

interface ConsultaTicketResult {
  numero_ticket: number;
  nome_cliente: string;
  status: StatusTicket;
  tipo_problema: string;
  descricao: string;
  created_at: string;
}

const ConsultaTicket: React.FC = () => {
  const [numeroTicket, setNumeroTicket] = useState('');
  const [documento, setDocumento] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<ConsultaTicketResult | null>(null);
  const [respostas, setRespostas] = useState<ConsultaResposta[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTicket(null);
    setRespostas([]);

    const numero = Number(numeroTicket);
    if (!numero || !documento.trim()) {
      setError('Informe o número do ticket e o CPF ou telefone.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('consultar-ticket', {
        body: { numero_ticket: numero, documento: documento.trim() },
      });

      if (invokeError) {
        setError('Não foi possível consultar o ticket. Tente novamente em instantes.');
        return;
      }

      if (!data?.success) {
        setError(data?.error || 'Ticket não encontrado. Confira o número e o documento informados.');
        return;
      }

      setTicket(data.ticket);
      setRespostas(data.respostas || []);
    } catch (err) {
      setError('Não foi possível consultar o ticket. Tente novamente em instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={fibrontecLogo} alt="Fibrontec" className="h-10 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold font-display">Consultar Chamado</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Informe o número do ticket e o CPF ou telefone cadastrado
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numero-ticket">Número do Ticket</Label>
              <Input
                id="numero-ticket"
                type="number"
                placeholder="Ex: 1234"
                value={numeroTicket}
                onChange={(e) => setNumeroTicket(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">CPF ou Telefone</Label>
              <Input
                id="documento"
                placeholder="Digite seu CPF ou telefone"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Consultar
                </>
              )}
            </Button>
          </form>

          {ticket && (
            <div className="space-y-4 pt-2">
              <Separator />
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-medium font-display">
                  Ticket #{ticket.numero_ticket} — {ticket.nome_cliente}
                </h3>
                <Badge variant="outline" className={cn(STATUS_TICKET_BADGE_CLASSES[ticket.status])}>
                  {STATUS_TICKET_LABELS[ticket.status]}
                </Badge>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">Tipo de Problema</p>
                <p className="font-medium">{ticket.tipo_problema}</p>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">Descrição</p>
                <p className="whitespace-pre-wrap">{ticket.descricao}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 font-display">Histórico de Respostas</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {respostas.map((resposta, index) => (
                    <div key={index} className="rounded-lg border p-3">
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
                      Nenhuma resposta registrada ainda
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button variant="link" className="w-full" asChild>
            <Link to="/auth">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultaTicket;
