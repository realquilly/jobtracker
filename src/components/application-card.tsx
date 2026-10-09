import type { Application, Stage } from "@/lib/types";

// Only http(s) links are rendered, so a stored `javascript:` URL can't run.
const safeLink = (link?: string) => {
  try {
    const url = new URL(link ?? "");
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
};

const DAY_MS = 86_400_000;

const urgency = (deadline: string) => {
  const startOfToday = new Date(
    new Date().toLocaleDateString("en-CA") + "T00:00:00",
  );
  const days = Math.round(
    (new Date(deadline + "T00:00:00").getTime() - startOfToday.getTime()) /
      DAY_MS,
  );
  if (days < 0) return { label: "Overdue", cls: "text-error", relative: true };
  if (days === 0) return { label: "Due today", cls: "text-warning", relative: true };
  if (days <= 2) return { label: `Due in ${days}d`, cls: "text-warning", relative: true };
  return { label: "Due", cls: "text-base-content/60", relative: false };
};

function StageLabel({
  stage,
  live,
}: {
  stage: Stage;
  live: boolean; // deadline still matters: stage not passed, not rejected
}) {
  const href = safeLink(stage.link);
  const due = stage.deadline
    ? new Date(stage.deadline + "T00:00:00").toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })
    : null;
  const u = stage.deadline && live ? urgency(stage.deadline) : null;

  return (
    <span className="flex flex-col items-center gap-0.5">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="link link-hover inline-flex items-center gap-1"
        >
          {stage.name}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </a>
      ) : (
        stage.name
      )}
      {due && (
        <span className={`text-xs ${u?.cls ?? "text-base-content/50"}`}>
          {u?.relative ? `${u.label} · ${due}` : `Due ${due}`}
        </span>
      )}
    </span>
  );
}

export function ApplicationCard({
  app,
  onStageChange,
  onEdit,
  onDelete,
}: {
  app: Application;
  onStageChange: (stage: number | "rejected") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const fillClass = app.rejected ? "step-error" : "step-primary";
  const applied = new Date(app.appliedOn + "T00:00:00").toLocaleDateString(
    undefined,
    { day: "numeric", month: "short", year: "numeric" },
  );

  return (
    <div className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <div className="flex items-start gap-4">
          {app.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={app.logo}
              alt=""
              className="h-12 w-12 shrink-0 rounded-box border border-base-300 object-contain"
            />
          )}
          <div className="flex-1">
            <h2 className="card-title">{app.company}</h2>
            <p className="text-sm text-base-content/60">
              {app.role ? `${app.role} · ` : ""}Applied {applied}
            </p>
          </div>
          <select
            className="select select-bordered select-sm w-auto"
            value={app.rejected ? "rejected" : app.currentStage}
            onChange={(e) =>
              onStageChange(
                e.target.value === "rejected" ? "rejected" : Number(e.target.value),
              )
            }
            aria-label="Current stage"
          >
            {app.stages.map((s, i) => (
              <option key={i} value={i}>
                {s.name}
              </option>
            ))}
            <option value="rejected">Rejected</option>
          </select>
          <button
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Edit application"
            onClick={onEdit}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
          <button
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Delete application"
            onClick={onDelete}
          >
            ✕
          </button>
        </div>

        <ul className="steps w-full overflow-x-auto">
          {app.stages.map((s, i) => (
            <li
              key={i}
              className={`step ${i <= app.currentStage ? fillClass : ""}`}
            >
              <StageLabel
                stage={s}
                live={!app.rejected && i >= app.currentStage}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
