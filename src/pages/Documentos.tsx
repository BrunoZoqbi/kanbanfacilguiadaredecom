import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { useRecursosDocumentos, RecursoDocumento, RecursoDocumentoInsert } from '@/hooks/useRecursosDocumentos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  FileText,
  Settings,
  Search,
  Loader2,
  ExternalLink,
  BookOpen,
  Shield,
  Users,
  Award,
  Palette,
  Database,
  MessageCircle,
  Share2,
  Smartphone,
  Globe,
  Link,
  Monitor,
  Wifi,
  Mail,
  Phone,
  Map,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type IconName = string;
type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;

const ICON_MAP: Record<string, IconComponent> = {
  FileText,
  BookOpen,
  Shield,
  Users,
  Award,
  Palette,
  Database,
  MessageCircle,
  Share2,
  Smartphone,
  Globe,
  Link,
  ExternalLink,
  Monitor,
  Wifi,
  Mail,
  Phone,
  Map,
  BarChart3,
  Search,
  Settings,
};

function DynamicIcon({ name, className }: { name: IconName | null; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || FileText;
  return <Icon className={className} />;
}

const BLANK_FORM: RecursoDocumentoInsert = {
  titulo: '',
  descricao: '',
  url: '',
  categoria: 'Operacional',
  icone: 'FileText',
  ordem: 0,
  ativo: true,
};

interface DocumentoCardProps {
  item: RecursoDocumento;
}

function DocumentoCard({ item }: DocumentoCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <DynamicIcon name={item.icone} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold leading-tight">{item.titulo}</p>
            <Badge variant="outline" className="text-xs shrink-0">{item.categoria}</Badge>
          </div>
          {item.descricao && (
            <p className="mt-1 text-sm text-muted-foreground leading-snug">{item.descricao}</p>
          )}
        </div>
      </div>
      <Button asChild size="sm" variant="outline" className="w-full" disabled={item.url === '#'}>
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Abrir
        </a>
      </Button>
    </Card>
  );
}

interface DocumentoFormProps {
  initial?: RecursoDocumento;
  onSave: (data: RecursoDocumentoInsert) => void;
  onCancel: () => void;
  saving: boolean;
}

function DocumentoForm({ initial, onSave, onCancel, saving }: DocumentoFormProps) {
  const [form, setForm] = useState<RecursoDocumentoInsert>(
    initial
      ? {
          titulo: initial.titulo,
          descricao: initial.descricao ?? '',
          url: initial.url,
          categoria: initial.categoria,
          icone: initial.icone ?? 'FileText',
          ordem: initial.ordem,
          ativo: initial.ativo,
        }
      : { ...BLANK_FORM }
  );

  const set = (field: keyof RecursoDocumentoInsert, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Título *</Label>
          <Input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>URL *</Label>
          <Input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Descrição</Label>
          <Input value={form.descricao ?? ''} onChange={(e) => set('descricao', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Categoria</Label>
          <Input value={form.categoria} onChange={(e) => set('categoria', e.target.value)} placeholder="Operacional" />
        </div>
        <div className="space-y-1">
          <Label>Ícone (nome Lucide)</Label>
          <div className="flex gap-2 items-center">
            <Input value={form.icone ?? ''} onChange={(e) => set('icone', e.target.value)} placeholder="FileText" />
            <span className="shrink-0">
              <DynamicIcon name={form.icone} className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Ordem</Label>
          <Input
            type="number"
            value={form.ordem}
            onChange={(e) => set('ordem', Number(e.target.value))}
          />
        </div>
        {initial && (
          <div className="flex items-center gap-2">
            <Switch
              checked={form.ativo}
              onCheckedChange={(v) => set('ativo', v)}
              id="ativo-doc"
            />
            <Label htmlFor="ativo-doc">Ativo</Label>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" /> Cancelar
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(form)}
          disabled={!form.titulo || !form.url || saving}
        >
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

function GerenciarDocumentos() {
  const { data: items = [], isLoading, create, update, remove } = useRecursosDocumentos();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecursoDocumento | null>(null);

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="space-y-4">
      {!showForm && !editing && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Documento
        </Button>
      )}
      {showForm && (
        <DocumentoForm
          onSave={(data) => create.mutate(data, { onSuccess: () => setShowForm(false) })}
          onCancel={() => setShowForm(false)}
          saving={create.isPending}
        />
      )}
      <div className="space-y-2">
        {items.map((item) =>
          editing?.id === item.id ? (
            <DocumentoForm
              key={item.id}
              initial={item}
              onSave={(data) => update.mutate({ id: item.id, ...data }, { onSuccess: () => setEditing(null) })}
              onCancel={() => setEditing(null)}
              saving={update.isPending}
            />
          ) : (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0">
                  <DynamicIcon name={item.icone} className="h-4 w-4 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{item.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.categoria}</p>
                </div>
                {!item.ativo && <Badge variant="secondary" className="shrink-0 text-xs">Inativo</Badge>}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button variant="ghost" size="icon" onClick={() => setEditing(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => remove.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

const Documentos: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { data: allItems = [], isLoading } = useRecursosDocumentos();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allItems.filter(
      (i) =>
        i.titulo.toLowerCase().includes(q) ||
        (i.descricao ?? '').toLowerCase().includes(q)
    );
  }, [allItems, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, RecursoDocumento[]>();
    for (const item of filtered) {
      const list = map.get(item.categoria) ?? [];
      list.push(item);
      map.set(item.categoria, list);
    }
    return map;
  }, [filtered]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Documentos
          </h1>
          <p className="text-muted-foreground">Documentos e manuais da empresa</p>
        </div>

        <Tabs defaultValue="documentos">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="gerenciar" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gerenciar
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="documentos" className="mt-6 space-y-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : grouped.size === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">
                  {search ? 'Nenhum documento encontrado.' : 'Nenhum documento cadastrado ainda.'}
                </p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([categoria, docs]) => (
                <section key={categoria} className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {categoria}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {docs.map((doc) => (
                      <DocumentoCard key={doc.id} item={doc} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="gerenciar" className="mt-6">
              <GerenciarDocumentos />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Documentos;
