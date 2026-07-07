import React, { useState } from 'react';
import { useProspeccoes } from '@/hooks/useProspeccoes';
import { useProspeccaoRespostas } from '@/hooks/useProspeccaoRespostas';
import {
  CHECKLIST_PERGUNTAS,
  CLASSIFICACAO_BADGE_CLASSES,
  CLASSIFICACAO_LABELS,
  Prospeccao,
  STATUS_PROSPECCAO_LABELS,
  StatusProspeccao,
  TipoContatoProspeccao,
} from '@/types/prospeccao';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProspeccaoDetailModalProps {
  prospeccao: Prospeccao | null;
  open: boolean;
  onClose: () => void;
}

const ProspeccaoDetailModal: React.FC<ProspeccaoDetailModalProps> = ({
  prospeccao,
  open,
  onClose,
}) => {
  const { updateContato, updateStatus, updateObservacoes } = useProspeccoes();
  const { respostas } = useProspeccaoRespostas(prospeccao?.id ?? null);

  // O componente é remontado (key={prospeccao.id} no pai) sempre que uma
  // prospecção diferente é aberta, então inicializar o estado a partir das
  // props aqui é seguro — não precisa de useEffect para resincronizar.
  const [nomeContato, setNomeContato] = useState(prospeccao?.nome_contato || '');
  const [telefone, setTelefone] = useState(prospeccao?.telefone_whatsapp || '');
  const [provedorAtual, setProvedorAtual] = useState(prospeccao?.provedor_atual || '');
  const [tipoContato, setTipoContato] = useState<TipoContatoProspeccao>(
    prospeccao?.tipo_contato || 'visita'
  );
  const [endereco, setEndereco] = useState(prospeccao?.endereco || '');
  const [dataContato, setDataContato] = useState(prospeccao?.data_contato || '');

  if (!prospeccao) return null;

  const handleSaveContato = () => {
    if (!nomeContato.trim() || !telefone.trim() || !dataContato) return;
    updateContato.mutate({
      id: prospeccao.id,
      nome_contato: nomeContato.trim(),
      telefone_whatsapp: telefone.trim(),
      provedor_atual: provedorAtual.trim() || null,
      tipo_contato: tipoContato,
      endereco: endereco.trim() || null,
      data_contato: dataContato,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(CLASSIFICACAO_BADGE_CLASSES[prospeccao.classificacao])}
                >
                  {CLASSIFICACAO_LABELS[prospeccao.classificacao]} ({prospeccao.pontuacao_total}/35)
                </Badge>
              </div>
              <DialogTitle className="text-xl font-display">{prospeccao.nome_contato}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Dados do contato (editável) */}
          <div>
            <h3 className="text-sm font-medium mb-3 font-display">Dados do Contato</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="detalhe-nome">Nome do Contato *</Label>
                <Input
                  id="detalhe-nome"
                  value={nomeContato}
                  onChange={(e) => setNomeContato(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detalhe-telefone">Telefone / WhatsApp *</Label>
                <Input
                  id="detalhe-telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detalhe-provedor">Provedor Atual</Label>
                <Input
                  id="detalhe-provedor"
                  value={provedorAtual}
                  onChange={(e) => setProvedorAtual(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detalhe-data">Data do Contato *</Label>
                <Input
                  id="detalhe-data"
                  type="date"
                  value={dataContato}
                  onChange={(e) => setDataContato(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tipo de Contato</Label>
                <RadioGroup
                  value={tipoContato}
                  onValueChange={(v) => setTipoContato(v as TipoContatoProspeccao)}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="visita" id="detalhe-tipo-visita" />
                    <Label htmlFor="detalhe-tipo-visita" className="cursor-pointer font-normal">
                      Visita
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ligacao" id="detalhe-tipo-ligacao" />
                    <Label htmlFor="detalhe-tipo-ligacao" className="cursor-pointer font-normal">
                      Ligação
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {tipoContato === 'visita' && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="detalhe-endereco">Endereço</Label>
                  <Input
                    id="detalhe-endereco"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
              )}
            </div>
            <Button
              size="sm"
              className="mt-3"
              onClick={handleSaveContato}
              disabled={
                updateContato.isPending || !nomeContato.trim() || !telefone.trim() || !dataContato
              }
            >
              {updateContato.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Dados do Contato
            </Button>
          </div>

          <Separator />

          {/* Checklist de pontuação (somente leitura) */}
          <div>
            <h3 className="text-sm font-medium mb-3 font-display flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Checklist de Qualificação
            </h3>
            <div className="space-y-3">
              {CHECKLIST_PERGUNTAS.map((pergunta, index) => {
                const resposta = respostas.find((r) => r.pergunta === pergunta.pergunta);
                return (
                  <div key={pergunta.id} className="text-sm">
                    <p className="text-muted-foreground">
                      {index + 1}. {pergunta.pergunta}
                    </p>
                    <p className="font-medium">
                      {resposta ? (
                        <>
                          {resposta.resposta_selecionada}{' '}
                          <span className="text-muted-foreground font-normal">
                            ({resposta.pontos} pts)
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Sem resposta registrada</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Se algum dado do checklist estiver incorreto, cadastre uma nova prospecção — o
              checklist não pode ser refeito aqui, pois isso recalcularia a pontuação.
            </p>
          </div>

          <Separator />

          {/* Status e observações (editável) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="detalhe-status">Status</Label>
              <Select
                value={prospeccao.status}
                onValueChange={(v) =>
                  updateStatus.mutate({ id: prospeccao.id, status: v as StatusProspeccao })
                }
              >
                <SelectTrigger id="detalhe-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_PROSPECCAO_LABELS) as StatusProspeccao[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_PROSPECCAO_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detalhe-observacoes">Observações</Label>
            <Textarea
              id="detalhe-observacoes"
              placeholder="Adicionar observação..."
              className="min-h-[80px]"
              defaultValue={prospeccao.observacoes || ''}
              onBlur={(e) => {
                if (e.target.value !== (prospeccao.observacoes || '')) {
                  updateObservacoes.mutate({ id: prospeccao.id, observacoes: e.target.value });
                }
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProspeccaoDetailModal;
