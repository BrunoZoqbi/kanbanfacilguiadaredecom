import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { useRecursosDocumentos, RecursoDocumento } from '@/hooks/useRecursosDocumentos';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
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
  Map as MapIcon,
  BarChart3,
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
  Map: MapIcon,
  BarChart3,
};

function DynamicIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || FileText;
  return <Icon className={className} />;
}

function DocumentoCard({ item }: { item: RecursoDocumento }) {
  const isPlaceholder = item.url === '#';
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
      {isPlaceholder ? (
        <Button size="sm" variant="outline" className="w-full" disabled>
          <ExternalLink className="mr-2 h-4 w-4" />
          Abrir
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline" className="w-full">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir
          </a>
        </Button>
      )}
    </Card>
  );
}

const Documentos: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
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
    const groupMap = new Map<string, RecursoDocumento[]>();
    for (const item of filtered) {
      const list = groupMap.get(item.categoria) ?? [];
      list.push(item);
      groupMap.set(item.categoria, list);
    }
    return groupMap;
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
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([categoria, docs]) => (
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
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Documentos;
