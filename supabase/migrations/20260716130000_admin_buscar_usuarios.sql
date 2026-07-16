-- Busca + paginação server-side para "Gerenciar > Usuários"
-- (UserManagement.tsx), que hoje carrega TODOS os usuários de uma vez e
-- filtra no cliente só por nome — não escala à medida que a base cresce, e
-- não permite buscar por e-mail (que vive em auth.users, não em profiles).
--
-- SECURITY DEFINER + checagem de is_admin() interna: precisa enxergar
-- auth.users.email (não exposto via API normalmente, mesmo para admins via
-- RLS comum), mesmo padrão de admin_get_user_email.
CREATE OR REPLACE FUNCTION public.admin_buscar_usuarios(
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  is_active BOOLEAN,
  phone_whatsapp TEXT,
  created_at TIMESTAMPTZ,
  email TEXT,
  role TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Sem permissão para consultar usuários';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.is_active,
    p.phone_whatsapp,
    p.created_at,
    u.email,
    COALESCE(ur.role::TEXT, 'user') AS role
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE
    (p_role IS NULL OR p_role = '' OR COALESCE(ur.role::TEXT, 'user') = p_role)
    AND (
      p_search IS NULL OR p_search = '' OR
      p.full_name ILIKE '%' || p_search || '%' OR
      p.phone_whatsapp ILIKE '%' || p_search || '%' OR
      u.email ILIKE '%' || p_search || '%'
    )
  ORDER BY p.full_name
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_buscar_usuarios(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
