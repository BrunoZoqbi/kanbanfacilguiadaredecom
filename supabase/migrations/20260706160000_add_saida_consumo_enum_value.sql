-- Nenhum valor existente de tipo_movimento_estoque representa saída de
-- consumo de material não-serializado (instalacao é ligado a item
-- serializado). Necessário para lancar_saida_consumivel.
ALTER TYPE public.tipo_movimento_estoque ADD VALUE 'saida_consumo';
