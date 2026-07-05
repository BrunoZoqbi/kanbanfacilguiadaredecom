import React, { useMemo, useState } from 'react';
import { useScripts } from '@/hooks/useScripts';
import { ScriptAtendimento, SetorScript } from '@/types/scripts';
import { Accordion } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import ScriptItem from './ScriptItem';

interface ScriptsSetorListProps {
  setor: SetorScript;
}

const ScriptsSetorList: React.FC<ScriptsSetorListProps> = ({ setor }) => {
  const { scripts, isLoading } = useScripts();
  const [busca, setBusca] = useState('');

  // Só scripts ativos aparecem aqui — os desativados só ficam visíveis para
  // admin na aba "Gerenciar".
  const scriptsDoSetor = useMemo(
    () => scripts.filter((s) => s.setor === setor && s.ativo),
    [scripts, setor]
  );

  const scriptsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return scriptsDoSetor;
    return scriptsDoSetor.filter(
      (s) => s.titulo.toLowerCase().includes(termo) || s.conteudo.toLowerCase().includes(termo)
    );
  }, [scriptsDoSetor, busca]);

  const categorias = useMemo(() => {
    const grupos = new Map<string, ScriptAtendimento[]>();
    scriptsFiltrados.forEach((script) => {
      const lista = grupos.get(script.categoria) || [];
      lista.push(script);
      grupos.set(script.categoria, lista);
    });
    return Array.from(grupos.entries());
  }, [scriptsFiltrados]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou conteúdo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {categorias.map(([categoria, scriptsDaCategoria]) => (
        <div key={categoria}>
          <h3 className="text-sm font-semibold text-foreground mb-2">{categoria}</h3>
          <Accordion type="multiple" className="w-full border rounded-lg px-3">
            {scriptsDaCategoria.map((script) => (
              <ScriptItem key={script.id} script={script} />
            ))}
          </Accordion>
        </div>
      ))}

      {categorias.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum script encontrado{busca ? ' para essa busca' : ''}.
        </p>
      )}
    </div>
  );
};

export default ScriptsSetorList;
