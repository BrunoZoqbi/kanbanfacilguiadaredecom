import React, { useState } from 'react';
import { useProdutos } from '@/hooks/useProdutos';
import { useCategoriasProduto } from '@/hooks/useCategoriasProduto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Package, Plus, Search } from 'lucide-react';

const CadastroProdutos: React.FC = () => {
  const { produtos, isLoading, createProduto, toggleProdutoActive } = useProdutos();
  const { categorias } = useCategoriasProduto();
  const categoriasAtivas = categorias.filter((c) => c.ativo);

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [controlaSerial, setControlaSerial] = useState(true);
  const [unidadeMedida, setUnidadeMedida] = useState('un');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<{ nome?: string; categoria?: string }>({});

  const resetForm = () => {
    setNome('');
    setCategoria('');
    setControlaSerial(true);
    setUnidadeMedida('un');
    setErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!nome.trim()) nextErrors.nome = 'Informe o nome do produto.';
    if (!categoria) nextErrors.categoria = 'Selecione uma categoria.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await createProduto.mutateAsync({
      nome: nome.trim(),
      categoria,
      controla_serial: controlaSerial,
      unidade_medida: unidadeMedida.trim() || 'un',
    });
    resetForm();
  };

  const filteredProdutos = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Cadastre aqui o <strong>tipo de produto/categoria</strong>, ex: Roteador TP-Link. Isso é o
        catálogo — use "Novo Equipamento" para lançar uma unidade física específica.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5" />
            Cadastrar Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="produto-nome">Nome *</Label>
                <Input
                  id="produto-nome"
                  placeholder="Ex: Roteador Intelbras AC1200"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (errors.nome) setErrors((prev) => ({ ...prev, nome: undefined }));
                  }}
                />
                {errors.nome && <p className="text-sm font-medium text-destructive">{errors.nome}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="produto-categoria">Categoria *</Label>
                <Select
                  value={categoria}
                  onValueChange={(v) => {
                    setCategoria(v);
                    if (errors.categoria) setErrors((prev) => ({ ...prev, categoria: undefined }));
                  }}
                >
                  <SelectTrigger id="produto-categoria">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasAtivas.map((c) => (
                      <SelectItem key={c.id} value={c.nome}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoria && (
                  <p className="text-sm font-medium text-destructive">{errors.categoria}</p>
                )}
                {categoriasAtivas.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma categoria ativa. Cadastre uma na aba "Categorias".
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="produto-unidade">Unidade de Medida</Label>
                <Input
                  id="produto-unidade"
                  placeholder="un, m, cx..."
                  value={unidadeMedida}
                  onChange={(e) => setUnidadeMedida(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="produto-controla-serial"
                  checked={controlaSerial}
                  onCheckedChange={setControlaSerial}
                />
                <Label htmlFor="produto-controla-serial" className="cursor-pointer">
                  Controla número de série / patrimônio
                </Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={createProduto.isPending}>
                {createProduto.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Cadastrar Produto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Produtos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
              {filteredProdutos.map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between gap-4 p-3 flex-wrap"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{produto.nome}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {produto.categoria}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {produto.controla_serial ? 'Controla série/patrimônio' : `Saldo em ${produto.unidade_medida || 'un'}`}
                        </span>
                        {!produto.is_active && (
                          <Badge variant="destructive" className="text-xs">Inativo</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleProdutoActive.mutate({ id: produto.id, is_active: !produto.is_active })
                    }
                    disabled={toggleProdutoActive.isPending}
                  >
                    {produto.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              ))}

              {filteredProdutos.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroProdutos;
