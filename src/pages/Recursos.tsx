import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { useRecursosLinks, RecursoLink, RecursoLinkInsert } from '@/hooks/useRecursosLinks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ExternalLink,
  Settings,
  Search,
  Loader2,
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
  FileText,
  BarChart3,
  Shield,
  Users,
  BookOpen,
  Award,
  Palette,
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
  FileText,
  BarChart3,
  Shield,
  Users,
  BookOpen,
  Award,
  Palette,
  Search,
  Settings,
};

function DynamicIcon({ name, className }: { name: IconName | null; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || ExternalLink;
  return <Icon className={className} />;
}

const BLANK_FORM: RecursoLinkInsert = {
  titulo: '',
  descricao: '',
  url: '',
  icone: 'ExternalLink',
  ordem: 0,
  ativo: true,
};

function RecursoCard({ item }: { item: RecursoLink }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <DynamicIcon name={item.icone} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{item.titulo}</p>
          {item.descricao && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{item.descricao}</p>
          )}
        </div>
      </div>
      <Button asChild size="sm" className="w-full" disabled={item.url === '#'}>
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Acessar
        </a>
      </Button>
    </Card>
  );
}

interface RecursoFormProps {
  initial?: RecursoLink;
  onSave: (data: RecursoLinkInsert) => void;
  onCancel: () => void;
  saving: boolean;
}

function RecursoForm({ initial, onSave, onCancel, saving }: RecursoFormProps) {
  const [form, setForm] = useState<RecursoLinkInsert>(
    initial
      ? {
          titulo: initial.titulo,
          descricao: initial.descricao ?? '',
          url: initial.url,
          icone: initial.icone ?? 'ExternalLink',
          ordem: initial.ordem,
          ativo: initial.ativo,
        }
      : { ...BLANK_FORM }
  );

  const set = (field: keyof RecursoLinkInsert, value: string | number | boolean) =>
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
          <Label>Ícone (nome Lucide)</Label>
          <div className="flex gap-2 items-center">
            <Input value={form.icone ?? ''} onChange={(e) => set('icone', e.target.value)} placeholder="ExternalLink" />
            <span className="shrink-0 text-primary">
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
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch
              checked={form.ativo}
              onCheckedChange={(v) => set('ativo', v)}
              id="ativo-link"
            />
            <Label htmlFor="ativo-link">Ativo</Label>
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

function GerenciarRecursos() {
  const { data: items = [], isLoading, create, update, remove } = useRecursosLinks();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecursoLink | null>(null);

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="space-y-4">
      {!showForm && !editing && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Recurso
        </Button>
      )}
      {showForm && (
        <RecursoForm
          onSave={(data) => create.mutate(data, { onSuccess: () => setShowForm(false) })}
          onCancel={() => setShowForm(false)}
          saving={create.isPending}
        />
      )}
      <div className="space-y-2">
        {items.map((item) =>
          editing?.id === item.id ? (
            <RecursoForm
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
                <span className="text-primary shrink-0">
                  <DynamicIcon name={item.icone} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{item.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.url}</p>
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

const Recursos: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { data: allItems = [], isLoading } = useRecursosLinks();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allItems.filter(
      (i) =>
        i.titulo.toLowerCase().includes(q) ||
        (i.descricao ?? '').toLowerCase().includes(q)
    );
  }, [allItems, search]);

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
            <ExternalLink className="h-6 w-6" />
            Recursos
          </h1>
          <p className="text-muted-foreground">Sistemas e ferramentas da operação</p>
        </div>

        <Tabs defaultValue="recursos">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="recursos">Recursos</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="gerenciar" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gerenciar
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="recursos" className="mt-6 space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar recurso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <ExternalLink className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">
                  {search ? 'Nenhum recurso encontrado.' : 'Nenhum recurso cadastrado ainda.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filtered.map((item) => (
                  <RecursoCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="gerenciar" className="mt-6">
              <GerenciarRecursos />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Recursos;
