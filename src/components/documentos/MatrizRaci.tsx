import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, Table2 } from 'lucide-react';

// Cargos, não pessoas — responsáveis por cada função podem mudar (ver
// regra de nomenclatura em CLAUDE.md).
type CargoKey =
  | 'diretor_geral'
  | 'gestao_tecnica'
  | 'gestao_comercial'
  | 'atendimento_financeiro'
  | 'tecnico_campo';

type RaciLetra = 'R' | 'A' | 'C' | 'I' | '';

interface RaciLinha {
  processo: string;
  valores: Record<CargoKey, RaciLetra>;
}

interface RaciArea {
  nome: string;
  linhas: RaciLinha[];
}

const CARGOS: { key: CargoKey; label: string }[] = [
  { key: 'diretor_geral', label: 'Diretor Geral' },
  { key: 'gestao_tecnica', label: 'Gestão Técnica' },
  { key: 'gestao_comercial', label: 'Gestão Comercial' },
  { key: 'atendimento_financeiro', label: 'Atendimento/Financeiro' },
  { key: 'tecnico_campo', label: 'Técnico de Campo' },
];

// Rótulos curtos para os cards do layout mobile (espaço limitado).
const CARGO_LABEL_CURTO: Record<CargoKey, string> = {
  diretor_geral: 'Diretor',
  gestao_tecnica: 'Gest. Técnico',
  gestao_comercial: 'Gest. Comercial',
  atendimento_financeiro: 'Atend./Financeiro',
  tecnico_campo: 'Técnico de Campo',
};

// Rótulo curto da área para o badge do card mobile (ex: "Área Técnica" → "Técnica").
const AREA_BADGE_LABEL: Record<string, string> = {
  'Área Técnica': 'Técnica',
  'Área de Atendimento': 'Atendimento',
  'Área Financeira': 'Financeira',
  'Área Comercial': 'Comercial',
  'Área de Gestão': 'Gestão',
};

const RACI_STYLE: Record<Exclude<RaciLetra, ''>, { bg: string; text: string; label: string }> = {
  R: { bg: '#68DA22', text: '#FFFFFF', label: 'Responsável — executa' },
  A: { bg: '#2563EB', text: '#FFFFFF', label: 'Aprovador — aprova/autoriza' },
  C: { bg: '#FBBF24', text: '#1F2937', label: 'Consultado — deve ser consultado antes' },
  I: { bg: '#9CA3AF', text: '#1F2937', label: 'Informado — deve ser informado após' },
};

const linha = (
  processo: string,
  valores: Partial<Record<CargoKey, RaciLetra>>
): RaciLinha => ({
  processo,
  valores: {
    diretor_geral: '',
    gestao_tecnica: '',
    gestao_comercial: '',
    atendimento_financeiro: '',
    tecnico_campo: '',
    ...valores,
  },
});

// Distribuição baseada na estrutura atual da Fibron: Diretor Geral aprova
// o estratégico e é informado do operacional; Gestão Técnica executa os
// processos técnicos e de estoque e aprova os de campo (quem executa em
// campo é o Técnico); Gestão Comercial executa comercial/redes sociais;
// Atendimento/Financeiro executa atendimento e financeiro.
const AREAS: RaciArea[] = [
  {
    nome: 'Área Técnica',
    linhas: [
      linha('Abertura de OS no IXC', {
        gestao_tecnica: 'R',
        atendimento_financeiro: 'C',
        diretor_geral: 'I',
        gestao_comercial: 'I',
        tecnico_campo: 'I',
      }),
      linha('Distribuição de OS para técnicos', {
        gestao_tecnica: 'R',
        tecnico_campo: 'I',
        diretor_geral: 'I',
        atendimento_financeiro: 'I',
        gestao_comercial: 'I',
      }),
      linha('Instalação em cliente', {
        tecnico_campo: 'R',
        gestao_tecnica: 'A',
        atendimento_financeiro: 'I',
        diretor_geral: 'I',
        gestao_comercial: 'I',
      }),
      linha('Recolhimento de equipamento', {
        tecnico_campo: 'R',
        gestao_tecnica: 'A',
        diretor_geral: 'I',
        atendimento_financeiro: 'I',
        gestao_comercial: 'I',
      }),
      linha('Reagendamento de visita técnica (por falha técnica)', {
        tecnico_campo: 'R',
        gestao_tecnica: 'A',
        atendimento_financeiro: 'C',
        diretor_geral: 'I',
        gestao_comercial: 'I',
      }),
      linha('Reagendamento a pedido do cliente', {
        atendimento_financeiro: 'R',
        gestao_tecnica: 'A',
        tecnico_campo: 'I',
        diretor_geral: 'I',
        gestao_comercial: 'I',
      }),
      linha('Retirada de equipamento do estoque', {
        tecnico_campo: 'R',
        gestao_tecnica: 'A',
        diretor_geral: 'I',
        atendimento_financeiro: 'I',
        gestao_comercial: 'I',
      }),
      linha('Entrada de equipamento no estoque (nova remessa)', {
        gestao_tecnica: 'R',
        diretor_geral: 'I',
        tecnico_campo: 'I',
        atendimento_financeiro: 'I',
        gestao_comercial: 'I',
      }),
      linha('Cadastro de produto/categoria no estoque', {
        gestao_tecnica: 'R',
        diretor_geral: 'I',
        tecnico_campo: 'I',
        atendimento_financeiro: 'I',
        gestao_comercial: 'I',
      }),
      linha('Encerramento de OS no IXC', {
        gestao_tecnica: 'R',
        tecnico_campo: 'C',
        atendimento_financeiro: 'I',
        diretor_geral: 'I',
        gestao_comercial: 'I',
      }),
      linha('Escalonamento de problema técnico complexo', {
        tecnico_campo: 'R',
        gestao_tecnica: 'A',
        diretor_geral: 'C',
        atendimento_financeiro: 'I',
        gestao_comercial: 'I',
      }),
    ],
  },
  {
    nome: 'Área de Atendimento',
    linhas: [
      linha('Abertura de ticket de suporte', {
        atendimento_financeiro: 'R',
        gestao_tecnica: 'I',
        diretor_geral: 'I',
        gestao_comercial: 'I',
        tecnico_campo: 'I',
      }),
      linha('Resposta a cliente no WhatsApp', {
        atendimento_financeiro: 'R',
        gestao_comercial: 'C',
        diretor_geral: 'I',
        gestao_tecnica: 'I',
        tecnico_campo: 'I',
      }),
      linha('Resposta a reclamação formal', {
        atendimento_financeiro: 'R',
        diretor_geral: 'A',
        gestao_tecnica: 'C',
        gestao_comercial: 'I',
        tecnico_campo: 'I',
      }),
      linha('Desbloqueio de cliente (após pagamento)', {
        atendimento_financeiro: 'R',
        gestao_tecnica: 'C',
        diretor_geral: 'I',
        gestao_comercial: 'I',
        tecnico_campo: 'I',
      }),
      linha('Comunicação de manutenção programada', {
        atendimento_financeiro: 'R',
        gestao_tecnica: 'A',
        diretor_geral: 'I',
        gestao_comercial: 'I',
        tecnico_campo: 'I',
      }),
    ],
  },
  {
    nome: 'Área Financeira',
    linhas: [
      linha('Emissão de segunda via de boleto', {
        atendimento_financeiro: 'R',
        diretor_geral: 'I',
        gestao_tecnica: 'I',
        gestao_comercial: 'I',
        tecnico_campo: 'I',
      }),
      linha('Negociação de desconto com cliente', {
        atendimento_financeiro: 'R',
        diretor_geral: 'A',
        gestao_comercial: 'C',
        gestao_tecnica: 'I',
        tecnico_campo: 'I',
      }),
      linha('Negociação de cancelamento', {
        atendimento_financeiro: 'R',
        diretor_geral: 'A',
        gestao_comercial: 'C',
        gestao_tecnica: 'I',
        tecnico_campo: 'I',
      }),
      linha('Registro de inadimplência', {
        atendimento_financeiro: 'R',
        diretor_geral: 'I',
        gestao_tecnica: 'I',
        gestao_comercial: 'I',
        tecnico_campo: 'I',
      }),
      linha('Aprovação de desconto acima do padrão', {
        diretor_geral: 'A',
        atendimento_financeiro: 'R',
        gestao_comercial: 'C',
        gestao_tecnica: 'I',
        tecnico_campo: 'I',
      }),
    ],
  },
  {
    nome: 'Área Comercial',
    linhas: [
      linha('Prospecção de novo cliente', {
        gestao_comercial: 'R',
        diretor_geral: 'I',
        gestao_tecnica: 'I',
        atendimento_financeiro: 'I',
        tecnico_campo: 'I',
      }),
      linha('Fechamento de contrato', {
        gestao_comercial: 'R',
        diretor_geral: 'A',
        atendimento_financeiro: 'C',
        gestao_tecnica: 'I',
        tecnico_campo: 'I',
      }),
      linha('Cadastro de novo cliente no IXC', {
        gestao_comercial: 'R',
        atendimento_financeiro: 'C',
        gestao_tecnica: 'I',
        diretor_geral: 'I',
        tecnico_campo: 'I',
      }),
      linha('Publicação nas redes sociais', {
        gestao_comercial: 'R',
        diretor_geral: 'C',
        gestao_tecnica: 'I',
        atendimento_financeiro: 'I',
        tecnico_campo: 'I',
      }),
      linha('Criação de campanha/promoção', {
        gestao_comercial: 'R',
        diretor_geral: 'A',
        atendimento_financeiro: 'C',
        gestao_tecnica: 'I',
        tecnico_campo: 'I',
      }),
    ],
  },
  {
    nome: 'Área de Gestão',
    linhas: [
      linha('Contratação de novo colaborador', {
        diretor_geral: 'R',
        gestao_tecnica: 'C',
        gestao_comercial: 'C',
        atendimento_financeiro: 'I',
        tecnico_campo: 'I',
      }),
      linha('Compra de equipamento', {
        gestao_tecnica: 'R',
        diretor_geral: 'A',
        atendimento_financeiro: 'C',
        gestao_comercial: 'I',
        tecnico_campo: 'I',
      }),
      linha('Aprovação de despesa extraordinária', {
        diretor_geral: 'A',
        atendimento_financeiro: 'R',
        gestao_tecnica: 'C',
        gestao_comercial: 'C',
        tecnico_campo: 'I',
      }),
      linha('Acesso ao sistema para novo colaborador', {
        diretor_geral: 'R',
        gestao_tecnica: 'C',
        gestao_comercial: 'I',
        atendimento_financeiro: 'I',
        tecnico_campo: 'I',
      }),
      linha('Alteração de papel de usuário no sistema', {
        diretor_geral: 'R',
        gestao_tecnica: 'C',
        gestao_comercial: 'I',
        atendimento_financeiro: 'I',
        tecnico_campo: 'I',
      }),
    ],
  },
];

const RaciCell: React.FC<{ letra: RaciLetra }> = ({ letra }) => {
  if (!letra) {
    return <div className="h-10 w-full bg-muted/30" />;
  }
  const style = RACI_STYLE[letra];
  return (
    <div
      className="flex h-10 w-full items-center justify-center text-sm font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
      title={style.label}
    >
      {letra}
    </div>
  );
};

// Badge compacto (legenda do rodapé e cargos dos cards do layout mobile).
const RaciBadgeSmall: React.FC<{ letra: RaciLetra }> = ({ letra }) => {
  if (!letra) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const style = RACI_STYLE[letra];
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
      title={style.label}
    >
      {letra}
    </span>
  );
};

const MatrizRaci: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* CSS de impressão: paisagem para caber as 5 colunas de cargo, sem
          margens excessivas. O botão "Exportar PDF" some via print:hidden. */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 12mm; }
        }
      `}</style>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Table2 className="h-5 w-5" />
            Matriz RACI — Fibron
          </h2>
          <p className="text-sm text-muted-foreground">
            Responsabilidades por cargo em cada processo da operação. R = Responsável, A =
            Aprovador, C = Consultado, I = Informado.
          </p>
        </div>
        <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Desktop (lg+): tabela com header e coluna "Processo" sticky. Em
          telas menores o sticky quebra (as colunas coloridas rolam por
          baixo da coluna fixa em vez de ao lado dela), então abaixo de lg
          trocamos para uma lista de cards (ver bloco "block lg:hidden"). */}
      <div className="hidden lg:block rounded-lg border overflow-auto max-h-[70vh]">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                className="sticky top-0 left-0 z-20 bg-background border-b border-r px-3 py-2 text-left font-semibold"
              >
                Processo
              </th>
              {CARGOS.map((cargo) => (
                <th
                  key={cargo.key}
                  className="sticky top-0 z-10 bg-background border-b px-3 py-2 text-center font-semibold whitespace-nowrap"
                >
                  {cargo.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AREAS.map((area) => (
              <React.Fragment key={area.nome}>
                <tr>
                  <td
                    colSpan={CARGOS.length + 1}
                    className="sticky left-0 bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-t"
                  >
                    {area.nome}
                  </td>
                </tr>
                {area.linhas.map((linhaAtual) => (
                  <tr key={linhaAtual.processo} className="border-b last:border-0">
                    <td className="sticky left-0 z-10 bg-background border-r px-3 py-2 font-medium whitespace-nowrap">
                      {linhaAtual.processo}
                    </td>
                    {CARGOS.map((cargo) => (
                      <td key={cargo.key} className="p-0 border-l">
                        <RaciCell letra={linhaAtual.valores[cargo.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile (abaixo de lg): um card por processo em vez de tabela —
          cada card lista os 5 cargos com um badge colorido pela letra
          RACI, agrupados por área com o mesmo separador visual da tabela. */}
      <div className="block lg:hidden space-y-6">
        {AREAS.map((area) => (
          <div key={area.nome} className="space-y-3">
            <div className="rounded-md bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {area.nome}
            </div>
            <div className="space-y-3">
              {area.linhas.map((linhaAtual) => (
                <Card key={linhaAtual.processo}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-snug">
                        {linhaAtual.processo}
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {AREA_BADGE_LABEL[area.nome] ?? area.nome}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2">
                      {CARGOS.map((cargo) => (
                        <div
                          key={cargo.key}
                          className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
                        >
                          <span className="text-xs text-muted-foreground">
                            {CARGO_LABEL_CURTO[cargo.key]}
                          </span>
                          <RaciBadgeSmall letra={linhaAtual.valores[cargo.key]} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        {(Object.keys(RACI_STYLE) as Exclude<RaciLetra, ''>[]).map((letraLegenda) => {
          const style = RACI_STYLE[letraLegenda];
          return (
            <div key={letraLegenda} className="flex items-center gap-2 text-sm">
              <RaciBadgeSmall letra={letraLegenda} />
              <span className="text-muted-foreground">{style.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatrizRaci;
