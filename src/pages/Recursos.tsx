import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { useRecursosLinks, RecursoLink } from '@/hooks/useRecursosLinks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ExternalLink,
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
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

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
};

function DynamicIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || ExternalLink;
  return <Icon className={className} />;
}

function RecursoCard({ item }: { item: RecursoLink }) {
  const isPlaceholder = item.url === '#';
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
      {isPlaceholder ? (
        <Button size="sm" className="w-full" disabled>
          <ExternalLink className="mr-2 h-4 w-4" />
          Acessar
        </Button>
      ) : (
        <Button asChild size="sm" className="w-full">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Acessar
          </a>
        </Button>
      )}
    </Card>
  );
}

const Recursos: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
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
      </div>
    </AppLayout>
  );
};

export default Recursos;
