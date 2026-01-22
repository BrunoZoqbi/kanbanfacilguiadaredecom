import React from 'react';
import { Profile, Tag } from '@/types/database';
import { Input } from '@/components/ui/input';
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
        <Select value={filters.assignee} onValueChange={(v) => updateFilter('assignee', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select value={filters.priority} onValueChange={(v) => updateFilter('priority', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
          </SelectContent>
        </Select>

        {/* Type */}
        <Select value={filters.type} onValueChange={(v) => updateFilter('type', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="daily">Diária</SelectItem>
            <SelectItem value="one_time">Pontual</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Select value={filters.dateFilter} onValueChange={(v) => updateFilter('dateFilter', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="today">Vence hoje</SelectItem>
            <SelectItem value="overdue">Atrasadas</SelectItem>
            <SelectItem value="upcoming">Próximas 48h</SelectItem>
          </SelectContent>
        </Select>
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
