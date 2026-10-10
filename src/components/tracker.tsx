"use client";

import { useState, useSyncExternalStore } from "react";
import { useApplications } from "@/lib/use-applications";
import { UserMenu } from "./user-menu";
import type { Application } from "@/lib/types";
import { ApplicationModal } from "./application-modal";
import { ApplicationCard } from "./application-card";

type SortKey = "added" | "applied" | "company" | "deadline";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "added", label: "Recently added" },
  { value: "applied", label: "Date applied" },
  { value: "company", label: "Company (A–Z)" },
  { value: "deadline", label: "Soonest date" },
];

// Earliest deadline on a stage that still matters; "" sorts last.
const nextDeadline = (a: Application) =>
  a.rejected
    ? ""
    : a.stages
        .slice(a.currentStage)
        .map((s) => s.deadline)
        .filter((d): d is string => !!d)
        .sort()[0] ?? "";

// Fraction of the timeline filled in, matching what the card shows.
const progress = (a: Application) => (a.currentStage + 1) / a.stages.length;

const SORTERS: Record<SortKey, (a: Application, b: Application) => number> = {
  added: () => 0, // stored newest first
  applied: (a, b) => b.appliedOn.localeCompare(a.appliedOn),
  company: (a, b) => a.company.localeCompare(b.company),
  deadline: (a, b) => {
    const [x, y] = [nextDeadline(a), nextDeadline(b)];
    if (x && y) return x.localeCompare(y);
    if (x || y) return x ? -1 : 1;
    // Neither has a date: rejected last, then furthest along first.
    if (!!a.rejected !== !!b.rejected) return a.rejected ? 1 : -1;
    return progress(b) - progress(a);
  },
};

// The chosen sort is remembered in this browser.
const SORT_STORAGE_KEY = "jobtracker:sort";
const sortListeners = new Set<() => void>();

const subscribeSort = (cb: () => void) => {
  sortListeners.add(cb);
  return () => {
    sortListeners.delete(cb);
  };
};

const readSort = () => {
  try {
    return localStorage.getItem(SORT_STORAGE_KEY);
  } catch {
    return null;
  }
};

function usePersistedSort() {
  const raw = useSyncExternalStore(subscribeSort, readSort, () => null);
  const sort = SORT_OPTIONS.find((o) => o.value === raw)?.value ?? "added";

  const setSort = (next: SortKey) => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, next);
    } catch {}
    sortListeners.forEach((cb) => cb());
  };

  return [sort, setSort] as const;
}

export function Tracker({
  initialApps,
  user,
}: {
  initialApps: Application[];
  user: { name: string; email: string; image?: string | null };
}) {
  const { apps, error, dismissError, add, update, remove } =
    useApplications(initialApps);
  // `app` is kept after closing so the dialog doesn't change text mid-animation.
  const [modal, setModal] = useState<{ open: boolean; app: Application | null }>({
    open: false,
    app: null,
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = usePersistedSort();

  const q = query.trim().toLowerCase();
  const visible = (
    q
      ? apps.filter((a) =>
          `${a.company} ${a.role ?? ""}`.toLowerCase().includes(q),
        )
      : apps
  )
    .slice()
    .sort(SORTERS[sort]);

  const open = apps.filter((a) => !a.rejected);
  // The final stage is always the offer.
  const offers = open.filter((a) => a.currentStage === a.stages.length - 1)
    .length;
  const stats = [
    { label: "Total", value: apps.length },
    { label: "In progress", value: open.length - offers },
    { label: "Rejected", value: apps.length - open.length },
    { label: "Offers", value: offers },
  ];

  return (
    <>
      <header className="navbar bg-base-100 border-b border-base-300 px-6">
        <span className="text-xl font-semibold">Job tracker</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-primary" onClick={() => setModal({ open: true, app: null })}>
            Add application
          </button>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-6 space-y-6">
        <div className="stats stats-vertical sm:stats-horizontal w-full border border-base-300">
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <div className="stat-title">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {apps.length === 0 ? (
          <div className="card border border-base-300 bg-base-100">
            <div className="card-body items-center text-center py-16">
              <h2 className="card-title">No applications yet</h2>
              <p className="text-base-content/60">
                Add your first one to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
            <label className="input input-bordered flex flex-1 items-center gap-2">
              <svg
                className="h-4 w-4 opacity-50"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                className="grow"
                placeholder="Search by company or role"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              className="select select-bordered w-auto"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort by"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            </div>

            {visible.length === 0 && (
              <p className="py-8 text-center text-base-content/60">
                No applications match your search.
              </p>
            )}

            {visible.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onStageChange={(stage) =>
                  update(
                    app.id,
                    stage === "rejected"
                      ? { rejected: true }
                      : { currentStage: stage, rejected: false },
                  )
                }
                onEdit={() => setModal({ open: true, app })}
                onDelete={() => remove(app.id)}
              />
            ))}
          </div>
        )}
      </main>

      <ApplicationModal
        open={modal.open}
        initial={modal.app}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSubmit={(data) => {
          const editing = modal.app;
          if (editing) {
            update(editing.id, {
              ...data,
              currentStage: Math.min(editing.currentStage, data.stages.length - 1),
            });
          } else {
            add({ ...data, id: crypto.randomUUID(), currentStage: 0 });
          }
          setModal((m) => ({ ...m, open: false }));
        }}
      />

      {error && (
        <div className="toast">
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={dismissError}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}
