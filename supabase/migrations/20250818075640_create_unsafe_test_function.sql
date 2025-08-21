-- TODO: MAKE THIS FUNCTION MORE SECURE
-- This function allows any SQL query to be executed.
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result_json json;
BEGIN
  -- We build a new query string that wraps the user's provided SQL
  -- inside the json_agg function. Then we execute this *new* string
  -- and store its single result INTO our variable.
  EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t'
  INTO result_json;

  RETURN result_json;
END;
$$;