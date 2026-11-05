-- Quick simulated drive (presentation): the dashboard drives a bus to the kiosk in about
-- 15 seconds, so the ETA from avg_bus_speed_kmh ("about 19 min") would be wrong. The drive
-- now sends the minutes it has left, and that replaces the ETA while the bus is on the way.
-- Without p_eta_minutes nothing changes. Real phone GPS (update_bus_location) is untouched.

drop function public.simulate_bus_position(text, double precision, double precision);

create function public.simulate_bus_position(
  p_bus text, p_lat double precision, p_lng double precision, p_eta_minutes int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_result jsonb;
begin
  perform require_role(has_role('dispatcher'));
  select status into v_status from buses where id = p_bus;
  if v_status is null then
    return jsonb_build_object('status', 'error', 'message', 'Bus not found');
  end if;
  if v_status <> 'on_the_way' then
    return jsonb_build_object('status', 'error', 'message', 'Only a bus on the way can be simulated');
  end if;
  -- Speed unknown (the ETA uses avg_bus_speed_kmh); accuracy as good as a phone outdoors.
  v_result := private.update_bus_location(p_bus, p_lat, p_lng, null, 5);

  if p_eta_minutes is not null and (select status from buses where id = p_bus) = 'on_the_way' then
    update buses set eta_minutes = greatest(p_eta_minutes, 1) where id = p_bus;
    v_result := v_result || jsonb_build_object('eta_minutes', greatest(p_eta_minutes, 1));
  end if;
  return v_result;
end;
$$;

revoke execute on function public.simulate_bus_position(text, double precision, double precision, int) from public, anon;
grant execute on function public.simulate_bus_position(text, double precision, double precision, int) to authenticated;
