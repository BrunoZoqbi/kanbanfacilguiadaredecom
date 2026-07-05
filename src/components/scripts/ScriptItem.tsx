import React, { useState } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoriaBadgeClass, ScriptAtendimento } from '@/types/scripts';

interface ScriptItemProps {
  script: ScriptAtendimento;
}

const ScriptItem: React.FC<ScriptItemProps> = ({ script }) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script.conteudo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard indisponível (permissão negada, contexto não seguro etc.) —
      // o usuário ainda pode selecionar e copiar o texto manualmente.
    }
  };

  return (
    <AccordionItem value={script.id}>
      <AccordionTrigger className="text-left hover:no-underline">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn('text-xs shrink-0', getCategoriaBadgeClass(script.categoria))}>
            {script.categoria}
          </Badge>
          <span>{script.titulo}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{script.conteudo}</p>
          {script.observacao && (
            <p className="text-xs italic text-muted-foreground">{script.observacao}</p>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copiado ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            {copiado ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ScriptItem;
