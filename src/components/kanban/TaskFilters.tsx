import React from 'react';
import { Profile, Tag } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';

export interface TaskFiltersState {
  search: string;
  assignee: string;
  priority: string;
  type: string;
  tag: string;
  dateFilter: string;
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFiltersChange: (filters: TaskFiltersState) => void;
  profiles: Profile[];
  tags: Tag[];
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  profiles,
  tags,
}) => {
  const updateFilter = (key: keyof TaskFiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      assignee: '',
      priority: '',
      type: '',
      tag: '',
      dateFilter: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Filter className="h-4 w-4" />
        Filtros
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Assignee */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-muted-foreground">Responsável</Label>
          <Select value={filters.assignee || 'all'} onValueChange={(v) => updateFilter('assignee', v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-muted-foreground">Prioridade</Label>
          <Select value={filters.priority || 'all'} onValueChange={(v) => updateFilter('priority', v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-muted-foreground">Tipo</Label>
          <Select value={filters.type || 'all'} onValueChange={(v) => updateFilter('type', v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="daily">Diária</SelectItem>
              <SelectItem value="one_time">Pontual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Filter */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-muted-foreground">Prazo</Label>
          <Select value={filters.dateFilter || 'all'} onValueChange={(v) => updateFilter('dateFilter', v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Prazo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Vence hoje</SelectItem>
              <SelectItem value="overdue">Atrasadas</SelectItem>
              <SelectItem value="upcoming">Próximas 48h</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Tags:</span>
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => updateFilter('tag', filters.tag === tag.id ? '' : tag.id)}
            className={`text-xs px-2.5 py-1 rounded-full transition-all ${
              filters.tag === tag.id
                ? 'ring-2 ring-offset-1'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              ...(filters.tag === tag.id ? { ringColor: tag.color } : {}),
            }}
          >
            {tag.name}
          </button>
        ))}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default TaskFilters;
