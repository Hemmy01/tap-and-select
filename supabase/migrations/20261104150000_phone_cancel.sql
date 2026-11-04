-- Phones on /join can leave the line, with a reason (the kiosk's cancel_reasons), so the
-- dashboard's "Why people left" counts them too. Leaving works even after joining closes.
-- join_status now also returns the reason labels and the two dispatch thresholds the phone
-- explains, because anon can't read cancel_reasons or config.

create function public.cancel_from_phone(p_device text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_device is null or p_device !~ '^[A-Za-z0-9]{8,40}$' then
    return jsonb_build_object('status', 'error', 'message', 'Unknown phone');
  end if;
  return private.cancel_token('PHONE-' || upper(p_device), p_reason);
end;
$$;

create or replace function public.join_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'open', config_value('audience_join_open', 0) >= 1,
    'joined', audience_joined_today(),
    'release_load_pct', config_value('release_load_pct', 70),
    'max_wait_minutes', config_value('max_wait_minutes', 15),
    'cancel_reasons', coalesce((
      select jsonb_agg(jsonb_build_object('code', code, 'label', label) order by sort_order)
        from cancel_reasons), '[]'::jsonb)
  )
$$;

revoke execute on function public.cancel_from_phone(text, text) from public;
grant execute on function public.cancel_from_phone(text, text) to anon, authenticated;
