-- Tabela de links/recursos externos
CREATE TABLE IF NOT EXISTS recursos_links (
  id         uuid                     PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     text                     NOT NULL,
  descricao  text,
  url        text                     NOT NULL,
  icone      text                     DEFAULT 'ExternalLink',
  ordem      integer                  NOT NULL DEFAULT 0,
  ativo      boolean                  NOT NULL DEFAULT true,
  created_at timestamptz              NOT NULL DEFAULT now()
);

ALTER TABLE recursos_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recursos_links_select"
  ON recursos_links FOR SELECT
  TO authenticated
  USING (ativo = true OR is_admin());

CREATE POLICY "recursos_links_insert"
  ON recursos_links FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "recursos_links_update"
  ON recursos_links FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "recursos_links_delete"
  ON recursos_links FOR DELETE
  TO authenticated
  USING (is_admin());

-- Tabela de documentos internos
CREATE TABLE IF NOT EXISTS recursos_documentos (
  id         uuid                     PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     text                     NOT NULL,
  descricao  text,
  url        text                     NOT NULL,
  categoria  text                     NOT NULL DEFAULT 'Operacional',
  icone      text                     DEFAULT 'FileText',
  ordem      integer                  NOT NULL DEFAULT 0,
  ativo      boolean                  NOT NULL DEFAULT true,
  created_at timestamptz              NOT NULL DEFAULT now()
);

ALTER TABLE recursos_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recursos_documentos_select"
  ON recursos_documentos FOR SELECT
  TO authenticated
  USING (ativo = true OR is_admin());

CREATE POLICY "recursos_documentos_insert"
  ON recursos_documentos FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "recursos_documentos_update"
  ON recursos_documentos FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "recursos_documentos_delete"
  ON recursos_documentos FOR DELETE
  TO authenticated
  USING (is_admin());

-- Seed: recursos_links
INSERT INTO recursos_links (titulo, descricao, url, icone, ordem) VALUES
  ('Portal IXC',          'Sistema de gestão e faturamento da Fibron',             '#',                             'Database',      1),
  ('Mundiale / Wit Desk', 'Plataforma de atendimento e chatbot WhatsApp',           '#',                             'MessageCircle', 2),
  ('Meta Business Suite', 'Gestão de redes sociais e anúncios',                     'https://business.facebook.com', 'Share2',        3),
  ('App Fibron — Android','Aplicativo oficial na Play Store',                        '#',                             'Smartphone',    4),
  ('App Fibron — iOS',    'Aplicativo oficial na App Store',                         '#',                             'Smartphone',    5),
  ('Site Institucional',  'fibrontec.com.br',                                        'https://fibrontec.com.br',      'Globe',         6);

-- Seed: recursos_documentos
INSERT INTO recursos_documentos (titulo, descricao, url, categoria, icone, ordem) VALUES
  ('Manual do Sistema',                 'Guia completo de uso do Kanban Fácil',                       '#', 'Operacional', 'BookOpen', 1),
  ('POP 01 — Retirada de Equipamento',  'Procedimento de retirada e devolução de equipamentos',       '#', 'Operacional', 'FileText', 2),
  ('POP 02 — Classificação de Prospecção','Critérios de pontuação e classificação de leads',          '#', 'Operacional', 'FileText', 3),
  ('POP 03 — Proteção de Dados (LGPD)', 'Procedimentos de proteção de dados de clientes',            '#', 'Jurídico',    'Shield',   4),
  ('POP 04 — Atendimento de Ticket',    'Fluxo de abertura, atendimento e encerramento de chamados', '#', 'Operacional', 'FileText', 5),
  ('POP 05 — Gestão de Usuários',       'Procedimentos para gestão de usuários pelo Admin',           '#', 'Operacional', 'Users',    6),
  ('Política de Privacidade',           'LGPD — Política de privacidade da Fibron',                   'https://fibrontec.com.br/privacidade', 'Jurídico', 'Shield', 7),
  ('Brandbook',                         'Manual de identidade visual da Fibron',                       '#', 'Marca',       'Palette',  8),
  ('Código de Conduta',                 'Valores e conduta esperada da equipe',                        '#', 'RH',          'Award',    9);
