// Escapa um valor para uso seguro dentro do filtro `.or()` do PostgREST —
// evita que vírgula/parênteses/aspas no termo digitado pelo usuário sejam
// interpretados como sintaxe de filtro (ex: injetar uma condição extra via
// vírgula). Ver postgrest.org, seção de escaping de valores especiais.
const escapeFilterValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

// Monta um filtro `column.ilike."%termo%"` por coluna, unidos com OR — para
// usar com `.or(buildIlikeOrFilter(termo, ['col1', 'col2']))` do supabase-js.
export const buildIlikeOrFilter = (term: string, columns: string[]): string => {
  const pattern = `"%${escapeFilterValue(term.trim())}%"`;
  return columns.map((c) => `${c}.ilike.${pattern}`).join(',');
};
