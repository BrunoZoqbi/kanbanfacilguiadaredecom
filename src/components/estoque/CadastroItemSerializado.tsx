import React, { useMemo, useState } from 'react';
import { useProdutos } from '@/hooks/useProdutos';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { CATEGORIAS_COM_MAC, CondicaoItem } from '@/types/estoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, PackagePlus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const CadastroItemSerializado: React.FC = () => {
  const { produtos } = useProdutos();
  const { createItem } = useItensSerializados();

  const [produtoId, setProdutoId] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [patrimonio, setPatrimonio] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [modelo, setModelo] = useState('');
  const [condicao, setCondicao] = useState<CondicaoItem>('novo');
  const [showOpcionais, setShowOpcionais] = useState(false);
  const [fornecedor, setFornecedor] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [valorAquisicao, setValorAquisicao] = useState('');
  const [garantiaAte, setGarantiaAte] = useState('');
  const [errors, setErrors] = useState<{ produtoId?: string; numeroSerie?: string }>({});

  const produtosSerializados = useMemo(
    () => produtos.filter((p) => p.controla_serial && p.is_active),
    [produtos]
  );

  const selectedProduto = produtosSerializados.find((p) => p.id === produtoId);
  const showMac = !!selectedProduto && CATEGORIAS_COM_MAC.includes(selectedProduto.categoria);

  const resetForm = () => {
    setProdutoId('');
    setNumeroSerie('');
    setMacAddress('');
    setPatrimonio('');
    setFabricante('');
    setModelo('');
    setCondicao('novo');
    setFornecedor('');
    setNotaFiscal('');
    setValorAquisicao('');
    setGarantiaAte('');
    setShowOpcionais(false);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!produtoId) nextErrors.produtoId = 'Selecione o produto.';
    if (!numeroSerie.trim()) nextErrors.numeroSerie = 'Informe o número de série.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await createItem.mutateAsync({
      produto_id: produtoId,
      numero_serie: numeroSerie.trim(),
      mac_address: showMac && macAddress.trim() ? macAddress.trim() : null,
      patrimonio: patrimonio.trim() || null,
      fabricante: fabricante.trim() || null,
      modelo: modelo.trim() || null,
      condicao,
      fornecedor: fornecedor.trim() || null,
      nota_fiscal: notaFiscal.trim() || null,
      valor_aquisicao: valorAquisicao.trim() ? Number(valorAquisicao) : null,
      garantia_ate: garantiaAte || null,
    });
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PackagePlus className="h-5 w-5" />
          Cadastrar Item Serializado
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          Cadastre aqui uma <strong>unidade física específica</strong>, com número de série — o
          produto/tipo já precisa existir em "Tipos de Produto".
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="item-produto">Produto *</Label>
              <Select
                value={produtoId}
                onValueChange={(v) => {
                  setProdutoId(v);
                  if (errors.produtoId) setErrors((prev) => ({ ...prev, produtoId: undefined }));
                }}
              >
                <SelectTrigger id="item-produto">
                  <SelectValue placeholder="Selecione o produto..." />
                </SelectTrigger>
                <SelectContent>
                  {produtosSerializados.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.produtoId && (
                <p className="text-sm font-medium text-destructive">{errors.produtoId}</p>
              )}
              {produtosSerializados.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum produto com controle de série cadastrado ainda.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-serie">Número de Série *</Label>
              <Input
                id="item-serie"
                placeholder="Ex: SN123456789"
                value={numeroSerie}
                onChange={(e) => {
                  setNumeroSerie(e.target.value);
                  if (errors.numeroSerie) setErrors((prev) => ({ ...prev, numeroSerie: undefined }));
                }}
              />
              {errors.numeroSerie && (
                <p className="text-sm font-medium text-destructive">{errors.numeroSerie}</p>
              )}
            </div>

            {showMac && (
              <div className="space-y-2">
                <Label htmlFor="item-mac">MAC Address</Label>
                <Input
                  id="item-mac"
                  placeholder="00:1A:2B:3C:4D:5E"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="item-patrimonio">Patrimônio</Label>
              <Input
                id="item-patrimonio"
                placeholder="Ex: PAT-0001"
                value={patrimonio}
                onChange={(e) => setPatrimonio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-fabricante">Fabricante</Label>
              <Input
                id="item-fabricante"
                placeholder="Ex: Intelbras"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-modelo">Modelo</Label>
              <Input
                id="item-modelo"
                placeholder="Ex: AC1200"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-condicao">Condição</Label>
              <Select value={condicao} onValueChange={(v) => setCondicao(v as CondicaoItem)}>
                <SelectTrigger id="item-condicao">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                  <SelectItem value="recondicionado">Recondicionado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Collapsible open={showOpcionais} onOpenChange={setShowOpcionais}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="px-0 hover:bg-transparent">
                <ChevronDown
                  className={cn('h-4 w-4 mr-1 transition-transform', showOpcionais && 'rotate-180')}
                />
                Dados de aquisição (opcional)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="item-fornecedor">Fornecedor</Label>
                  <Input
                    id="item-fornecedor"
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-nota-fiscal">Nota Fiscal</Label>
                  <Input
                    id="item-nota-fiscal"
                    value={notaFiscal}
                    onChange={(e) => setNotaFiscal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-valor">Valor de Aquisição (R$)</Label>
                  <Input
                    id="item-valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorAquisicao}
                    onChange={(e) => setValorAquisicao(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-garantia">Garantia até</Label>
                  <Input
                    id="item-garantia"
                    type="date"
                    value={garantiaAte}
                    onChange={(e) => setGarantiaAte(e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={createItem.isPending}>
              {createItem.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PackagePlus className="h-4 w-4 mr-2" />
              )}
              Cadastrar Item
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CadastroItemSerializado;
