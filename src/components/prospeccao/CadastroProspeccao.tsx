import React, { useMemo, useState } from 'react';
import { useProspeccoes } from '@/hooks/useProspeccoes';
import {
  CHECKLIST_PERGUNTAS,
  CLASSIFICACAO_BADGE_CLASSES,
  CLASSIFICACAO_LABELS,
  TipoContatoProspeccao,
  calcularClassificacao,
} from '@/types/prospeccao';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, UserPlus, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const todayIso = () => new Date().toISOString().slice(0, 10);

const CadastroProspeccao: React.FC = () => {
  const { createProspeccao } = useProspeccoes();

  const [nomeContato, setNomeContato] = useState('');
  const [telefoneWhatsapp, setTelefoneWhatsapp] = useState('');
  const [provedorAtual, setProvedorAtual] = useState('');
  const [tipoContato, setTipoContato] = useState<TipoContatoProspeccao>('visita');
  const [endereco, setEndereco] = useState('');
  const [dataContato, setDataContato] = useState(todayIso());
  const [observacoes, setObservacoes] = useState('');

  // perguntaId -> índice da opção selecionada
  const [respostas, setRespostas] = useState<Record<string, number>>({});

  const pontuacaoTotal = useMemo(() => {
    return CHECKLIST_PERGUNTAS.reduce((sum, pergunta) => {
      const opcaoIndex = respostas[pergunta.id];
      if (opcaoIndex === undefined) return sum;
      return sum + pergunta.opcoes[opcaoIndex].pontos;
    }, 0);
  }, [respostas]);

  const classificacao = calcularClassificacao(pontuacaoTotal);
  const todasRespondidas = CHECKLIST_PERGUNTAS.every((p) => respostas[p.id] !== undefined);
  const enderecoValido = tipoContato !== 'visita' || endereco.trim().length > 0;
  const podeSubmeter =
    nomeContato.trim() &&
    telefoneWhatsapp.trim() &&
    dataContato &&
    enderecoValido &&
    todasRespondidas &&
    !createProspeccao.isPending;

  const resetForm = () => {
    setNomeContato('');
    setTelefoneWhatsapp('');
    setProvedorAtual('');
    setTipoContato('visita');
    setEndereco('');
    setDataContato(todayIso());
    setObservacoes('');
    setRespostas({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSubmeter) return;

    await createProspeccao.mutateAsync({
      nome_contato: nomeContato.trim(),
      telefone_whatsapp: telefoneWhatsapp.trim(),
      provedor_atual: provedorAtual.trim() || null,
      tipo_contato: tipoContato,
      endereco: tipoContato === 'visita' ? endereco.trim() : null,
      data_contato: dataContato,
      observacoes: observacoes.trim() || null,
      respostas: CHECKLIST_PERGUNTAS.map((pergunta) => {
        const opcao = pergunta.opcoes[respostas[pergunta.id]];
        return {
          pergunta: pergunta.pergunta,
          resposta_selecionada: opcao.label,
          pontos: opcao.pontos,
        };
      }),
    });
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Cadastrar Prospecção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prospeccao-nome">Nome do Contato *</Label>
                <Input
                  id="prospeccao-nome"
                  placeholder="Nome do cliente em potencial"
                  value={nomeContato}
                  onChange={(e) => setNomeContato(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prospeccao-telefone">Telefone / WhatsApp *</Label>
                <Input
                  id="prospeccao-telefone"
                  placeholder="5511999999999"
                  value={telefoneWhatsapp}
                  onChange={(e) => setTelefoneWhatsapp(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prospeccao-provedor">Provedor Atual</Label>
                <Input
                  id="prospeccao-provedor"
                  placeholder="Ex: Claro, provedor local..."
                  value={provedorAtual}
                  onChange={(e) => setProvedorAtual(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prospeccao-data">Data do Contato *</Label>
                <Input
                  id="prospeccao-data"
                  type="date"
                  value={dataContato}
                  onChange={(e) => setDataContato(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Tipo de Contato *</Label>
                <RadioGroup
                  value={tipoContato}
                  onValueChange={(v) => setTipoContato(v as TipoContatoProspeccao)}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="visita" id="tipo-visita" />
                    <Label htmlFor="tipo-visita" className="cursor-pointer font-normal">
                      Visita
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ligacao" id="tipo-ligacao" />
                    <Label htmlFor="tipo-ligacao" className="cursor-pointer font-normal">
                      Ligação
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="prospeccao-endereco">
                  Endereço {tipoContato === 'visita' && '*'}
                </Label>
                <Input
                  id="prospeccao-endereco"
                  placeholder="Endereço da visita"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  required={tipoContato === 'visita'}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="prospeccao-observacoes">Observações</Label>
                <Textarea
                  id="prospeccao-observacoes"
                  placeholder="Detalhes adicionais sobre o contato..."
                  className="min-h-[80px]"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </div>

            {/* Checklist de pontuação */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between flex-wrap gap-2 pt-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Checklist de Qualificação
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Pontuação: <strong className="text-foreground">{pontuacaoTotal}</strong>/35
                  </span>
                  <Badge variant="outline" className={cn(CLASSIFICACAO_BADGE_CLASSES[classificacao])}>
                    {CLASSIFICACAO_LABELS[classificacao]}
                  </Badge>
                </div>
              </div>

              {CHECKLIST_PERGUNTAS.map((pergunta, perguntaIndex) => (
                <div key={pergunta.id} className="space-y-2">
                  <Label>
                    {perguntaIndex + 1}. {pergunta.pergunta}
                  </Label>
                  <RadioGroup
                    value={respostas[pergunta.id]?.toString() ?? ''}
                    onValueChange={(v) =>
                      setRespostas((prev) => ({ ...prev, [pergunta.id]: Number(v) }))
                    }
                  >
                    {pergunta.opcoes.map((opcao, opcaoIndex) => (
                      <div key={opcao.label} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={opcaoIndex.toString()}
                          id={`${pergunta.id}-${opcaoIndex}`}
                        />
                        <Label
                          htmlFor={`${pergunta.id}-${opcaoIndex}`}
                          className="cursor-pointer font-normal text-sm"
                        >
                          {opcao.label} <span className="text-muted-foreground">({opcao.pontos} pts)</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

              {!todasRespondidas && (
                <p className="text-xs text-muted-foreground">
                  Responda todas as perguntas do checklist para salvar a prospecção.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={!podeSubmeter}>
                {createProspeccao.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Cadastrar Prospecção
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroProspeccao;
