-- Security fix from /cso --code audit (2026-04-26)
-- Change gym.last_set_per_exercise from SECURITY DEFINER to SECURITY INVOKER
-- so that RLS on gym.sets applies. Combined with middleware header strip,
-- this closes a data-leak path where a forged x-gl-user-id could reach this
-- RPC and bypass RLS to return another user's training history.

CREATE OR REPLACE FUNCTION gym.last_set_per_exercise(p_user_id uuid)
 RETURNS TABLE(exercise_id uuid, reps integer, weight_kg numeric, rpe integer, logged_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public', 'gym'
AS $function$
  select distinct on (s.exercise_id)
    s.exercise_id, s.reps, s.weight_kg, s.rpe, s.logged_at
  from gym.sets s
  where s.user_id = p_user_id
  order by s.exercise_id, s.logged_at desc;
$function$;
