"use client";

import clsx from "clsx";
import type { Bus } from "@/lib/departures";
import { getDestination } from "@/lib/destinations";
import { routeFor, waitingAlongRoute } from "@/lib/routes";
import { unwrap, useRealtimeData, type RealtimeTable } from "@/lib/use-realtime-data";
import { useRoutes } from "@/lib/use-routes";
import type { StopSyncClient } from "@/lib/supabase";

const TABLES: readonly RealtimeTable[] = ["queue_tokens"];

async function loadWaiting(supabase: StopSyncClient) {
  return unwrap(await supabase.from("queue_tokens").select("stop_id, destination").eq("status", "waiting"));
}

/** How many people wait for this bus at each stop on its route, live. */
export function WaitingStopsPanel({ bus }: { bus: Bus }) {
  const { routes, error: routesError } = useRoutes();
  const { data: tickets, error } = useRealtimeData(TABLES, loadWaiting);
  const route = routeFor(routes, getDestination(bus.destination)?.route);
  const { stops, elsewhere } = waitingAlongRoute(bus, route, tickets ?? []);
  const total = stops.reduce((sum, s) => sum + s.waiting, 0) + elsewhere;
  const problem = error ?? routesError;

  return (
    <section aria-labelledby="waiting-stops-title" className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="waiting-stops-title" className="text-lg">
          Waiting for you
        </h2>
        <p className="text-sm text-muted">
          <span className="num font-semibold text-ink">{total}</span> in all
        </p>
      </div>
      {problem ? (
        <p role="alert" className="mt-2 font-semibold text-danger">
          {problem}
        </p>
      ) : !tickets || stops.length === 0 ? (
        <p className="mt-2 text-muted">Loading stops…</p>
      ) : (
        <ol className="mt-3 divide-y divide-line" aria-live="polite">
          {stops.map((s) => (
            <li
              key={s.id}
              className={clsx("flex min-h-12 items-center gap-3 py-2", s.passed && "text-muted")}
            >
              <span className="min-w-0 flex-1 truncate">
                {s.name}
                {s.next ? (
                  <span className="ml-2 rounded-pill bg-accent px-2 py-0.5 text-xs font-semibold text-white">Next</span>
                ) : null}
                {s.passed ? <span className="ml-2 text-xs">passed</span> : null}
              </span>
              <span className={clsx("num text-2xl font-bold", s.waiting === 0 && "text-muted")}>{s.waiting}</span>
              <span className="sr-only">{s.waiting === 1 ? "person waiting" : "people waiting"}</span>
            </li>
          ))}
        </ol>
      )}
      {elsewhere > 0 ? (
        <p className="mt-2 text-sm text-muted">
          <span className="num">{elsewhere}</span> more at stops off this route.
        </p>
      ) : null}
    </section>
  );
}
