import React, { useState } from 'react';
import { useCategoriasProduto } from '@/hooks/useCategoriasProduto';
import { CategoriaProduto } from '@/types/estoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Tags, Plus, Pencil } from 'lucide-react';

const GestaoCategorias: React.FC = () => {
  const { categorias, isLoading, createCategoria, updateCategoria, toggleCategoriaAtivo } =
    useCategoriasProduto();
  const [nome, setNome] = useState('');

  const [editingCategoria, setEditingCategoria] = useState<CategoriaProduto | null>(null);
  const [editNome, setEditNome] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    await createCategoria.mutateAsync(nome.trim());
    setNome('');
  };

  const openEditDialog = (categoria: CategoriaProduto) => {
    setEditingCategoria(categoria);
    setEditNome(categoria.nome);
  };

  const closeEditDialog = () => {
    setEditingCategoria(null);
    setEditNome('');
  };

  const handleSaveEdit = async () => {
    if (!editingCategoria || !editNome.trim()) return;
    await updateCategoria.mutateAsync({ id: editingCategoria.id, nome: editNome.trim() });
    closeEditDialog();
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
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(categoria)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
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

      {/* Edit Categoria Dialog */}
      <Dialog open={!!editingCategoria} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-categoria-nome">Nome *</Label>
            <Input
              id="edit-categoria-nome"
              value={editNome}
              onChange={(e) => setEditNome(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editNome.trim() || updateCategoria.isPending}>
              {updateCategoria.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestaoCategorias;
