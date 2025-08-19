-- WARNING: FOR TESTING PURPOSES ONLY. HIGHLY INSECURE.
-- This function allows any SQL query to be executed.
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  -- Declare a variable to hold the final JSON result.
  result_json json;
BEGIN
  -- We build a new query string that wraps the user's provided SQL
  -- inside the json_agg function. Then we execute this *new* string
  -- and store its single result INTO our variable.
  EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t'
  INTO result_json;

  -- Return the captured JSON result.
  RETURN result_json;
END;
$$;