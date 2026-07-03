import React, { useState } from 'react';
import { useCategoriasProduto } from '@/hooks/useCategoriasProduto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tags, Plus } from 'lucide-react';

const GestaoCategorias: React.FC = () => {
  const { categorias, isLoading, createCategoria, toggleCategoriaAtivo } = useCategoriasProduto();
  const [nome, setNome] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    await createCategoria.mutateAsync(nome.trim());
    setNome('');
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Categorias disponíveis no cadastro de "Tipos de Produto". Desativar uma categoria não
        apaga produtos que já a usam — só a remove das opções para novos cadastros.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Nova Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex items-end gap-3 flex-wrap">
            <div className="space-y-2">
              <Label htmlFor="categoria-nome">Nome *</Label>
              <Input
                id="categoria-nome"
                placeholder="Ex: Antena"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-56"
                required
              />
            </div>
            <Button type="submit" disabled={createCategoria.isPending || !nome.trim()}>
              {createCategoria.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Cadastrar Categoria
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {categorias.map((categoria) => (
                <div
                  key={categoria.id}
                  className="flex items-center justify-between gap-4 p-3 flex-wrap"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{categoria.nome}</span>
                    {!categoria.ativo && (
                      <Badge variant="destructive" className="text-xs">Inativa</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleCategoriaAtivo.mutate({ id: categoria.id, ativo: !categoria.ativo })
                    }
                    disabled={toggleCategoriaAtivo.isPending}
                  >
                    {categoria.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              ))}

              {categorias.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma categoria cadastrada
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GestaoCategorias;
