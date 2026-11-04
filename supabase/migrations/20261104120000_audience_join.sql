-- Audience join (/join): during the pitch, people in the room join the kiosk's line from their
-- phones without signing in. Off by default; HQ opens it for the demo (set_audience_join).
-- Each phone sends a random device id and becomes card PHONE-<id>, so the usual rule applies:
-- one waiting ticket per card (a second tap gets the same ticket back). A daily cap stops a
-- shared link from flooding the queue. Phone tickets are stored with method 'manual'.

insert into config (key, value, description) values
  ('audience_join_open', 0, '1 lets phones join the kiosk line from /join without signing in; 0 closes it'),
  ('audience_join_max', 150, 'Most phone tickets per day (Kigali time) from /join')
on conflict (key) do nothing;

-- Phone tickets made today, Kigali time.
create function public.audience_joined_today()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
    from queue_tokens
   where card_id like 'PHONE-%'
     and (created_at at time zone 'Africa/Kigali')::date = (now() at time zone 'Africa/Kigali')::date
$$;

-- What /join needs before showing the stops: is it open, and how many joined.
create function public.join_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'open', config_value('audience_join_open', 0) >= 1,
    'joined', audience_joined_today()
  )
$$;

create function public.join_from_phone(p_dest text, p_device text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card   text;
  v_result jsonb;
  v_board  jsonb;
begin
  if config_value('audience_join_open', 0) < 1 then
    return jsonb_build_object('status', 'closed');
  end if;
  if p_device is null or p_device !~ '^[A-Za-z0-9]{8,40}$'
     or not exists (select 1 from destinations where code = p_dest) then
    return jsonb_build_object('status', 'invalid');
  end if;
  v_card := 'PHONE-' || upper(p_device);

  -- One at a time, so the cap holds when the whole room taps at once.
  perform pg_advisory_xact_lock(hashtext('join_from_phone'));
  if not exists (select 1 from queue_tokens where card_id = v_card and status = 'waiting')
     and audience_joined_today() >= config_value('audience_join_max', 150) then
    return jsonb_build_object('status', 'full');
  end if;

  v_result := private.create_token(kiosk_stop_id(), p_dest, v_card, 'manual', null);
  if v_result->>'status' = 'created' then
    v_board := board_parked_bus(p_dest, kiosk_stop_id());
    if v_board is not null then
      v_result := v_result || jsonb_build_object('boarded_bus', v_board->>'bus_id');
    end if;
  end if;
  return v_result;
end;
$$;

-- HQ opens and closes joining (dispatcher or admin).
create function public.set_audience_join(p_open boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform require_role(has_role('dispatcher'));
  update config set value = case when p_open then 1 else 0 end where key = 'audience_join_open';
  return join_status();
end;
$$;

revoke execute on function public.audience_joined_today() from public, anon, authenticated;
revoke execute on function public.join_status(), public.join_from_phone(text, text), public.set_audience_join(boolean) from public;
grant execute on function public.join_status(), public.join_from_phone(text, text) to anon, authenticated;
grant execute on function public.set_audience_join(boolean) to authenticated;
