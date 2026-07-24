import React, { useEffect, useState } from 'react';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useRecursosDocumentos, RecursoDocumento, RecursoDocumentoInsert } from '@/hooks/useRecursosDocumentos';
import { useRecursosLinks, RecursoLink, RecursoLinkInsert } from '@/hooks/useRecursosLinks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  Boxes,
  FileText,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
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
  BookOpen,
  Shield,
  Users,
  Award,
  Palette,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

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
};

function DynamicIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || FileText;
  return <Icon className={className} />;
}

// ─── Documentos ────────────────────────────────────────────────────────────

const BLANK_DOC: RecursoDocumentoInsert = {
  titulo: '',
  descricao: '',
  url: '',
  categoria: 'Operacional',
  icone: 'FileText',
  ordem: 0,
  ativo: true,
};

interface DocFormProps {
  initial?: RecursoDocumento;
  onSave: (data: RecursoDocumentoInsert) => void;
  onCancel: () => void;
  saving: boolean;
}

function DocForm({ initial, onSave, onCancel, saving }: DocFormProps) {
  const [form, setForm] = useState<RecursoDocumentoInsert>(
    initial
      ? { titulo: initial.titulo, descricao: initial.descricao ?? '', url: initial.url, categoria: initial.categoria, icone: initial.icone ?? 'FileText', ordem: initial.ordem, ativo: initial.ativo }
      : { ...BLANK_DOC }
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
            <span className="shrink-0"><DynamicIcon name={form.icone} className="h-5 w-5" /></span>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Ordem</Label>
          <Input type="number" value={form.ordem} onChange={(e) => set('ordem', Number(e.target.value))} />
        </div>
        {initial && (
          <div className="flex items-center gap-2">
            <Switch checked={form.ativo} onCheckedChange={(v) => set('ativo', v)} id="ativo-doc-settings" />
            <Label htmlFor="ativo-doc-settings">Ativo</Label>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" /> Cancelar
        </Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.titulo || !form.url || saving}>
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

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {!showForm && !editing && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Documento
        </Button>
      )}
      {showForm && (
        <DocForm
          onSave={(data) => create.mutate(data, { onSuccess: () => setShowForm(false) })}
          onCancel={() => setShowForm(false)}
          saving={create.isPending}
        />
      )}
      <div className="space-y-2">
        {items.map((item) =>
          editing?.id === item.id ? (
            <DocForm
              key={item.id}
              initial={item}
              onSave={(data) => update.mutate({ id: item.id, ...data }, { onSuccess: () => setEditing(null) })}
              onCancel={() => setEditing(null)}
              saving={update.isPending}
            />
          ) : (
            <div key={item.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0"><DynamicIcon name={item.icone} className="h-4 w-4 text-muted-foreground" /></span>
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
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(item.id)}>
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

// ─── Recursos (Links) ───────────────────────────────────────────────────────

const BLANK_LINK: RecursoLinkInsert = {
  titulo: '',
  descricao: '',
  url: '',
  icone: 'ExternalLink',
  ordem: 0,
  ativo: true,
};

interface LinkFormProps {
  initial?: RecursoLink;
  onSave: (data: RecursoLinkInsert) => void;
  onCancel: () => void;
  saving: boolean;
}

function LinkForm({ initial, onSave, onCancel, saving }: LinkFormProps) {
  const [form, setForm] = useState<RecursoLinkInsert>(
    initial
      ? { titulo: initial.titulo, descricao: initial.descricao ?? '', url: initial.url, icone: initial.icone ?? 'ExternalLink', ordem: initial.ordem, ativo: initial.ativo }
      : { ...BLANK_LINK }
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
            <span className="shrink-0 text-primary"><DynamicIcon name={form.icone} className="h-5 w-5" /></span>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Ordem</Label>
          <Input type="number" value={form.ordem} onChange={(e) => set('ordem', Number(e.target.value))} />
        </div>
        {initial && (
          <div className="flex items-center gap-2">
            <Switch checked={form.ativo} onCheckedChange={(v) => set('ativo', v)} id="ativo-link-settings" />
            <Label htmlFor="ativo-link-settings">Ativo</Label>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" /> Cancelar
        </Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.titulo || !form.url || saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

function GerenciarLinks() {
  const { data: items = [], isLoading, create, update, remove } = useRecursosLinks();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecursoLink | null>(null);

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {!showForm && !editing && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Recurso
        </Button>
      )}
      {showForm && (
        <LinkForm
          onSave={(data) => create.mutate(data, { onSuccess: () => setShowForm(false) })}
          onCancel={() => setShowForm(false)}
          saving={create.isPending}
        />
      )}
      <div className="space-y-2">
        {items.map((item) =>
          editing?.id === item.id ? (
            <LinkForm
              key={item.id}
              initial={item}
              onSave={(data) => update.mutate({ id: item.id, ...data }, { onSuccess: () => setEditing(null) })}
              onCancel={() => setEditing(null)}
              saving={update.isPending}
            />
          ) : (
            <div key={item.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-primary shrink-0"><DynamicIcon name={item.icone} className="h-4 w-4" /></span>
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
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(item.id)}>
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

// ─── SystemSettings ─────────────────────────────────────────────────────────

const SystemSettings: React.FC = () => {
  const { value, isLoading, updateConfig } = useSystemConfig('estoque_baixo_limite');
  const [limite, setLimite] = useState('');

  useEffect(() => {
    if (value !== null && value !== undefined) {
      setLimite(value);
    }
  }, [value]);

  const handleSave = () => {
    const parsed = Number(limite);
    if (!Number.isInteger(parsed) || parsed < 0) return;
    updateConfig.mutate(String(parsed));
  };

  return (
    <div className="space-y-6">
      {/* Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-5 w-5" />
            Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="limite-estoque-baixo">Limite de "Estoque baixo"</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="limite-estoque-baixo"
                  type="number"
                  min={0}
                  step={1}
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                />
                <Button
                  onClick={handleSave}
                  disabled={updateConfig.isPending || limite === value}
                >
                  {updateConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Produtos com quantidade disponível igual ou menor que esse valor mostram o alerta
                "Estoque baixo".
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GerenciarDocumentos />
        </CardContent>
      </Card>

      {/* Recursos (Links) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Recursos (Links)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GerenciarLinks />
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
