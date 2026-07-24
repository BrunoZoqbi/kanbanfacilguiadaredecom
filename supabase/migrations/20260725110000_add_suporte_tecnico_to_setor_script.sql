-- Espelha o enum já aplicado em produção.
-- Os 18 scripts do setor suporte_tecnico já estão no banco — não reinsere.
ALTER TYPE setor_script ADD VALUE IF NOT EXISTS 'suporte_tecnico';
