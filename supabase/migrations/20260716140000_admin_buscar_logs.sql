-- Busca + paginação server-side para "Gerenciar > Logs" (ActivityLogs.tsx),
-- que hoje carrega até 200 logs de uma vez (LIMIT fixo) e filtra no cliente
-- por nome do usuário e por conteúdo do JSON `details` via
-- JSON.stringify(...).includes(...) — não escala e não pagina de verdade.
--
-- SECURITY INVOKER (padrão): activity_logs já tem RLS "Only admins can view
-- activity logs" (USING is_admin()) e profiles é visível a todos — a função
-- não enxerga nada que a RLS do chamador já não liberasse, então não há
-- elevação de privilégio a fazer aqui (diferente de admin_buscar_usuarios,
-- que precisa de auth.users).
CREATE OR REPLACE FUNCTION public.admin_buscar_logs(
  p_search TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 30,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ,
  user_name TEXT
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT
    l.id,
    l.user_id,
    l.action,
    l.entity_type,
    l.entity_id,
    l.details,
    l.created_at,
    COALESCE(p.full_name, 'Usuário desconhecido') AS user_name
  FROM public.activity_logs l
  LEFT JOIN public.profiles p ON p.id = l.user_id
  WHERE
    (p_action IS NULL OR p_action = '' OR l.action = p_action)
    AND (p_entity_type IS NULL OR p_entity_type = '' OR l.entity_type = p_entity_type)
    AND (
      p_search IS NULL OR p_search = '' OR
      p.full_name ILIKE '%' || p_search || '%' OR
      l.details::TEXT ILIKE '%' || p_search || '%'
    )
  ORDER BY l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_buscar_logs(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
