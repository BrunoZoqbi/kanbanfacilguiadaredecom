import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorComercial } from '@/hooks/useIsGestorComercial';
import { useNotificacoesNaoLidasCount } from '@/hooks/useNotificacoes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  KanbanSquare,
  ListTodo,
  BarChart3,
  CalendarDays,
  Boxes,
  Target,
  Ticket as TicketIcon,
  Plus,
  Menu,
  X,
  LogOut,
  Bell,
  Settings,
  HelpCircle,
  MessageSquareText,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { profile, isAdmin, role, signOut } = useAuth();
  const isGestorComercial = useIsGestorComercial();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: unreadCount = 0 } = useNotificacoesNaoLidasCount();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navigation = [
    ...(isAdmin ? [
      { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    ] : []),
    { name: 'Minhas Tarefas', href: '/my-tasks', icon: ListTodo },
    { name: 'Kanban', href: '/', icon: KanbanSquare },
    { name: 'Calendário', href: '/calendar', icon: CalendarDays },
    ...(isAdmin || isGestorComercial ? [
      { name: 'Prospecção', href: '/prospeccao', icon: Target },
    ] : []),
    { name: 'Scripts', href: '/scripts', icon: MessageSquareText },
    { name: 'Tickets', href: '/tickets', icon: TicketIcon },
    { name: 'Estoque', href: '/estoque', icon: Boxes },
    ...(isAdmin ? [
      { name: 'Gerenciar', href: '/admin', icon: Settings },
    ] : []),
    { name: 'Documentos', href: '/documentos', icon: FileText },
    { name: 'Recursos', href: '/recursos', icon: ExternalLink },
    { name: 'Ajuda', href: '/ajuda', icon: HelpCircle },
  ];

  const NavLink = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-end px-4 border-b border-sidebar-border">
          <button
            className="lg:hidden text-sidebar-foreground/80 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info + Create Task Button */}
        <div className="p-4 border-b border-sidebar-border space-y-3">
          <div className="flex items-center gap-2">
            <Link
              to="/perfil"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate hover:underline">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  {{ admin: 'Administrador', gestor_tecnico: 'Gestor Técnico', gestor_comercial: 'Gestor Comercial', user: 'Usuário' }[role ?? 'user'] ?? 'Usuário'}
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="relative flex-shrink-0 text-sidebar-foreground/80 hover:text-sidebar-foreground"
              aria-label="Notificações"
              onClick={() => {
                setSidebarOpen(false);
                navigate('/notificacoes');
              }}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </div>
          <Button
            onClick={() => {
              setSidebarOpen(false);
              navigate('/create-task');
            }}
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4">
          <Separator className="mb-4 bg-sidebar-border" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left text-destructive hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header — mobile only, só o botão de abrir a sidebar (sino e
            avatar viraram parte da sidebar em si). */}
        <header className="h-16 bg-card border-b flex items-center px-4 lg:hidden">
          <button
            className="text-foreground"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
