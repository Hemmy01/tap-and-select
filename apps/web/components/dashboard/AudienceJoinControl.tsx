"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { parseJoinStatus, type JoinStatus } from "@/lib/join";
import { getSupabase } from "@/lib/supabase";

const REFRESH_MS = 5_000;

/** HQ opens /join for the audience during the demo, and sees how many phones joined. */
export function AudienceJoinControl() {
  const [status, setStatus] = useState<JoinStatus | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      const { data, error: err } = await getSupabase().rpc("join_status");
      if (!live) return;
      if (!err) setStatus(parseJoinStatus(data));
      timer = setTimeout(load, REFRESH_MS);
    };
    void load();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  const toggle = async () => {
    if (!status || pending) return;
    setPending(true);
    setError(null);
    const { data, error: err } = await getSupabase().rpc("set_audience_join", { p_open: !status.open });
    if (err) setError(err.message);
    else setStatus(parseJoinStatus(data));
    setPending(false);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-[120px]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Phones {status?.open ? "· open" : "· closed"}
        </p>
        <p className="num text-[32px] font-bold leading-tight">{status?.joined ?? "–"}</p>
      </div>
      <Button
        size="lg"
        variant={status?.open ? "secondary" : "primary"}
        onClick={() => void toggle()}
        pending={pending}
        disabled={!status}
        icon={<Smartphone aria-hidden className="h-4 w-4" />}
        title={error ?? "Let the audience join the line from /join"}
      >
        {status?.open ? "Close joining" : "Open joining"}
      </Button>
      {error ? (
        <p role="alert" className="max-w-[200px] text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
