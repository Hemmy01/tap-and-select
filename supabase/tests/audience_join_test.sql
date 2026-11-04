-- Audience join from phones: signed out, one ticket per phone, closed and capped. Always rolls back.

begin;

create temp table results (n serial, check_name text);

create function pg_temp.ok(p_cond boolean, p_name text) returns void language plpgsql as $$
begin
  if p_cond is distinct from true then
    raise exception 'FAILED: %', p_name;
  end if;
  insert into results (check_name) values (p_name);
end $$;

create function pg_temp.as_anon_join(p_dest text, p_device text) returns jsonb language plpgsql as $$
declare
  v jsonb;
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  v := join_from_phone(p_dest, p_device);
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $$;

update queue_tokens set status = 'expired' where status = 'waiting';
update config set value = 0 where key = 'audience_join_open';

do $$
declare
  v jsonb;
  w jsonb;
  joined int;
begin
  v := pg_temp.as_anon_join('REM', 'abc12345phone');
  perform pg_temp.ok(v->>'status' = 'closed', '1 closed by default: nothing is created');

  update config set value = 1 where key = 'audience_join_open';
  joined := audience_joined_today();
  v := pg_temp.as_anon_join('REM', 'abc12345phone');
  perform pg_temp.ok(v->>'status' = 'created' and v->>'code' like 'R2-%', '2 open: a signed-out phone gets a ticket');
  perform pg_temp.ok(exists (select 1 from queue_tokens where card_id = 'PHONE-ABC12345PHONE' and stop_id = 'STOP-01'
                             and status = 'waiting'), '3 it waits at the kiosk like any ticket');

  w := pg_temp.as_anon_join('KIM', 'abc12345phone');
  perform pg_temp.ok(w->>'status' = 'duplicate' and w->>'code' = v->>'code', '4 the same phone gets its ticket back');

  perform pg_temp.ok(pg_temp.as_anon_join('XXX', 'abc12345phone')->>'status' = 'invalid', '5 unknown stop is refused');
  perform pg_temp.ok(pg_temp.as_anon_join('REM', 'bad id!')->>'status' = 'invalid', '6 malformed device id is refused');

  update config set value = joined + 1 where key = 'audience_join_max';
  perform pg_temp.ok(pg_temp.as_anon_join('REM', 'other9999phone')->>'status' = 'full', '7 the daily cap holds');

  perform pg_temp.ok((join_status()->>'joined')::int = joined + 1 and (join_status()->>'open')::boolean,
                     '8 join_status reports open and the count');
end $$;

do $$
declare
  failed boolean := false;
begin
  -- Opening and closing is for HQ only.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    perform set_audience_join(false);
  exception when others then
    failed := true;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform pg_temp.ok(failed, '9 signed out cannot open or close joining');
  perform pg_temp.ok((set_audience_join(false)->>'open')::boolean = false, '10 a trusted caller can close it');
end $$;

do $$
declare
  v jsonb;
  c jsonb;
begin
  -- Leaving the line from the phone, with a reason; works while joining is closed.
  update config set value = 1 where key = 'audience_join_open';
  update config set value = 1000 where key = 'audience_join_max';
  v := pg_temp.as_anon_join('NYA', 'leaver1234phone');
  update config set value = 0 where key = 'audience_join_open';

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  c := cancel_from_phone('leaver1234phone', 'waited_too_long');
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform pg_temp.ok(c->>'status' = 'cancelled' and c->>'code' = v->>'code', '11 a phone leaves the line, even when closed');
  perform pg_temp.ok(exists (select 1 from queue_tokens where card_id = 'PHONE-LEAVER1234PHONE'
                             and status = 'cancelled' and cancel_reason = 'waited_too_long'), '12 the reason is kept');
  perform pg_temp.ok(cancel_from_phone('leaver1234phone', 'waited_too_long')->>'status' = 'not_found', '13 only once');
  perform pg_temp.ok(cancel_from_phone('bad id!', 'other')->>'status' = 'error', '14 malformed device id is refused');
  perform pg_temp.ok(jsonb_array_length(join_status()->'cancel_reasons') >= 3, '15 join_status lists the reasons');
  perform pg_temp.ok((join_status()->>'release_load_pct')::numeric = config_value('release_load_pct', 70),
                     '16 and the dispatch thresholds');
end $$;

select n, check_name as passed from results order by n;

rollback;
