import React, { useState } from 'react';
import { useScripts } from '@/hooks/useScripts';
import { ScriptAtendimento, SETOR_SCRIPT_LABELS, SetorScript } from '@/types/scripts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Pencil } from 'lucide-react';

const GerenciarScripts: React.FC = () => {
  const { scripts, isLoading, updateScript, toggleAtivo } = useScripts();
  const [editando, setEditando] = useState<ScriptAtendimento | null>(null);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [observacao, setObservacao] = useState('');

  const abrirEdicao = (script: ScriptAtendimento) => {
    setEditando(script);
    setTitulo(script.titulo);
    setCategoria(script.categoria);
    setConteudo(script.conteudo);
    setObservacao(script.observacao || '');
  };

  const fecharEdicao = () => setEditando(null);

  const salvarEdicao = () => {
    if (!editando || !titulo.trim() || !categoria.trim() || !conteudo.trim()) return;
    updateScript.mutate(
      {
        id: editando.id,
        titulo: titulo.trim(),
        categoria: categoria.trim(),
        conteudo,
        observacao: observacao.trim() || null,
      },
      { onSuccess: fecharEdicao }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const setores = Object.keys(SETOR_SCRIPT_LABELS) as SetorScript[];

  return (
    <div className="space-y-6">
      {setores.map((setor) => {
        const scriptsDoSetor = scripts.filter((s) => s.setor === setor);
        return (
          <Card key={setor}>
            <CardHeader>
              <CardTitle className="text-base">{SETOR_SCRIPT_LABELS[setor]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg divide-y">
                {scriptsDoSetor.map((script) => (
                  <div
                    key={script.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate max-w-full">{script.titulo}</p>
                        <Badge variant="outline" className="text-xs">
                          {script.categoria}
                        </Badge>
                        {!script.ativo && (
                          <Badge variant="secondary" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Ativo</span>
                        <Switch
                          checked={script.ativo}
                          onCheckedChange={(checked) =>
                            toggleAtivo.mutate({ id: script.id, ativo: checked })
                          }
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(script)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}

                {scriptsDoSetor.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Nenhum script cadastrado neste setor.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!editando} onOpenChange={(open) => !open && fecharEdicao()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Script</DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="script-titulo">Título</Label>
                <Input id="script-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="script-categoria">Categoria</Label>
                <Input
                  id="script-categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="script-conteudo">Conteúdo</Label>
                <Textarea
                  id="script-conteudo"
                  className="min-h-[160px]"
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="script-observacao">Observação (opcional)</Label>
                <Textarea
                  id="script-observacao"
                  className="min-h-[70px]"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={fecharEdicao}>
              Cancelar
            </Button>
            <Button
              onClick={salvarEdicao}
              disabled={!titulo.trim() || !categoria.trim() || !conteudo.trim() || updateScript.isPending}
            >
              {updateScript.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarScripts;
