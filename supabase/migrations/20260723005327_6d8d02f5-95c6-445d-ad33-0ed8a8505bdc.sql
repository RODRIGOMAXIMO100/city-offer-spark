
CREATE OR REPLACE FUNCTION public.admin_exec_sql(p_sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_trimmed text;
  v_first_word text;
  v_is_select boolean;
  v_rows_affected bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
    RAISE EXCEPTION 'Apenas ADMIN pode executar SQL';
  END IF;

  v_trimmed := btrim(p_sql);
  v_trimmed := regexp_replace(v_trimmed, ';\s*$', '');
  v_first_word := lower(split_part(regexp_replace(v_trimmed, '^\s+', ''), ' ', 1));
  v_is_select := v_first_word IN ('select', 'with', 'show', 'explain', 'table', 'values');

  BEGIN
    IF v_is_select THEN
      EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (%s) t', v_trimmed)
        INTO v_result;
      RETURN jsonb_build_object('status', 'ok', 'kind', 'select', 'rows', v_result);
    ELSE
      EXECUTE v_trimmed;
      GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
      RETURN jsonb_build_object('status', 'ok', 'kind', 'exec', 'rows_affected', v_rows_affected);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exec_sql(text) TO authenticated;
