import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { useRecursosDocumentos, RecursoDocumento } from '@/hooks/useRecursosDocumentos';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  Headphones,
  DollarSign,
  MessageSquare,
  Heart,
  Star,
  Calendar,
  LayoutGrid,
  Network,
  AlertTriangle,
  Gift,
  UserPlus,
  Lock,
  Folder,
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
  Headphones,
  DollarSign,
  MessageSquare,
  Heart,
  Star,
  Calendar,
  LayoutGrid,
  Network,
  AlertTriangle,
  Gift,
  UserPlus,
  Lock,
};

// recursos_documentos só guarda ícone por documento, não por categoria —
// mapeamento fixo por nome de categoria, com Folder como fallback para
// categorias novas ainda não listadas aqui.
const CATEGORIA_ICON_MAP: Record<string, IconComponent> = {
  Operacional: BookOpen,
  'Jurídico': Shield,
  Marca: Palette,
  RH: Users,
  'Gestão': LayoutGrid,
  Atendimento: Headphones,
  Comercial: DollarSign,
  Cultura: Heart,
  'Segurança': Lock,
};

function DynamicIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || FileText;
  return <Icon className={className} />;
}

function CategoriaIcon({ nome, className }: { nome: string; className?: string }) {
  const Icon = CATEGORIA_ICON_MAP[nome] || Folder;
  return <Icon className={className} />;
}

function DocumentoRow({ item }: { item: RecursoDocumento }) {
  const navigate = useNavigate();
  const isPlaceholder = item.url === '#';
  // Documentos "internos" (ex: Matriz RACI) apontam para uma rota do
  // próprio sistema em vez de um link externo — navegam na mesma aba via
  // React Router em vez de abrir em nova aba.
  const isRotaInterna = item.url.startsWith('/');

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <DynamicIcon name={item.icone} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight truncate">{item.titulo}</p>
        {item.descricao && (
          <p className="text-sm text-muted-foreground truncate">{item.descricao}</p>
        )}
      </div>
      {isPlaceholder ? (
        <Button size="sm" variant="outline" className="shrink-0" disabled>
          <ExternalLink className="mr-2 h-4 w-4" />
          Abrir
        </Button>
      ) : isRotaInterna ? (
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate(item.url)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Abrir
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir
          </a>
        </Button>
      )}
    </div>
  );
}

const CATEGORIAS_ABERTAS_STORAGE_KEY = 'documentos_categorias_abertas';
const CATEGORIA_PADRAO_ABERTA = 'Operacional';

const lerCategoriasAbertasSalvas = (): string[] => {
  try {
    const raw = localStorage.getItem(CATEGORIAS_ABERTAS_STORAGE_KEY);
    if (!raw) return [CATEGORIA_PADRAO_ABERTA];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [CATEGORIA_PADRAO_ABERTA];
  } catch {
    return [CATEGORIA_PADRAO_ABERTA];
  }
};

const Documentos: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: allItems = [], isLoading } = useRecursosDocumentos();
  const [search, setSearch] = useState('');
  const [categoriasAbertas, setCategoriasAbertas] = useState<string[]>(lerCategoriasAbertasSalvas);

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

  const isSearching = search.trim().length > 0;
  const categoriasComResultado = useMemo(() => Array.from(grouped.keys()), [grouped]);

  // Persiste só o estado "manual" (fora de busca) — o auto-expand durante a
  // busca é transitório e não deve sobrescrever a preferência do usuário.
  useEffect(() => {
    if (isSearching) return;
    localStorage.setItem(CATEGORIAS_ABERTAS_STORAGE_KEY, JSON.stringify(categoriasAbertas));
  }, [categoriasAbertas, isSearching]);

  const handleAccordionChange = (value: string[]) => {
    if (isSearching) return; // durante a busca, as categorias com resultado ficam sempre abertas
    setCategoriasAbertas(value);
  };

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
          <Card>
            <CardContent className="pt-6">
              <Accordion
                type="multiple"
                value={isSearching ? categoriasComResultado : categoriasAbertas}
                onValueChange={handleAccordionChange}
                className="w-full"
              >
                {Array.from(grouped.entries()).map(([categoria, docs]) => (
                  <AccordionItem key={categoria} value={categoria}>
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <CategoriaIcon nome={categoria} className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{categoria}</span>
                        <Badge variant="secondary" className="ml-1">{docs.length}</Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="divide-y">
                        {docs.map((doc) => (
                          <DocumentoRow key={doc.id} item={doc} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Documentos;
