-- Permite ao Admin consultar o e-mail de login (auth.users) de outro
-- usuário, para pré-preencher o campo de e-mail no formulário "Editar
-- Usuário" — auth.users não é exposta via API por padrão, mesmo para
-- admins, então é necessário uma função SECURITY DEFINER dedicada.
CREATE OR REPLACE FUNCTION public.admin_get_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Sem permissão para consultar e-mail de usuários';
  END IF;

  SELECT email INTO result FROM auth.users WHERE id = p_user_id;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_email(UUID) TO authenticated;
