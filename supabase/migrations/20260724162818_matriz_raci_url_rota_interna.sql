-- A Matriz RACI agora é uma página interna (/raci, componente
-- MatrizRaci.tsx) em vez de um link placeholder aguardando cadastro.
UPDATE public.recursos_documentos
SET url = '/raci'
WHERE titulo = 'Matriz RACI — Responsabilidades por Cargo';
