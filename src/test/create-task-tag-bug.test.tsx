import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Referências estáveis entre renders — mimetiza o comportamento real do
// useQuery do React Query (mesma referência de `data` enquanto o cache não
// muda), em vez de recriar os arrays a cada chamada do hook.
const stableProfiles = [{ id: 'user-1', full_name: 'Fulano' }];
const stableTags = [
  { id: 'tag-1', name: 'Urgente', color: '#ff0000' },
  { id: 'tag-2', name: 'Instalação', color: '#00ff00' },
];

vi.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    profiles: stableProfiles,
    tags: stableTags,
    createTask: { mutateAsync: vi.fn(), isPending: false },
    isLoading: false,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, isAdmin: true }),
}));

vi.mock('@/hooks/useIsGestorTecnico', () => ({
  useIsGestorTecnico: () => false,
}));

vi.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: () => ({ uploadFile: vi.fn() }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

import CreateTaskForm from '@/components/tasks/CreateTaskForm';

// Regressão: o Radix Select usado nos campos "Tipo"/"Prioridade" espera
// PointerEvent/ResizeObserver, que o jsdom não implementa (browsers reais
// têm ambos). Sem estes polyfills o teste falharia por uma limitação do
// ambiente de teste, não por um bug do app.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error - test polyfill
global.ResizeObserver = ResizeObserverStub;
// @ts-expect-error - test polyfill
Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
// @ts-expect-error - test polyfill
Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || (() => {});
// @ts-expect-error - test polyfill
Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || (() => {});
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});

describe('CreateTaskForm - seleção de tag', () => {
  it('seleciona e desmarca uma tag sem entrar em loop de renderização', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CreateTaskForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const tagButton = screen.getByText('Urgente').closest('button')!;
    expect(tagButton).toBeTruthy();

    // Regressão: um <Checkbox> do Radix aninhado dentro deste <button>
    // disparava um clique sintético (bubbling) ao sincronizar seu input
    // nativo oculto, o que re-acionava o onClick do próprio botão e
    // alternava a seleção infinitamente ("Maximum update depth exceeded"),
    // derrubando a árvore inteira do React (tela em branco).
    expect(() => fireEvent.click(tagButton)).not.toThrow();
    expect(tagButton).toHaveAttribute('aria-pressed', 'true');

    expect(() => fireEvent.click(tagButton)).not.toThrow();
    expect(tagButton).toHaveAttribute('aria-pressed', 'false');
  });
});
