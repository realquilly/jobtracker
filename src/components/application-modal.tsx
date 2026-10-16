"use client";

import { useRef, useState } from "react";
import type { Application, Stage } from "@/lib/types";
import { resizeImage } from "@/lib/resize-image";
import { DateInput } from "./date-input";

const DEFAULT_STAGES: Stage[] = [
  "Applied",
  "Phone screen",
  "Interview",
  "Offer",
].map((name) => ({ name }));

// A stage being edited. `details` controls whether its link and date are shown,
// `origin` is its index before editing (so the current stage can follow it when
// stages are reordered), and `uid` is a stable React key.
type DraftStage = Stage & { details: boolean; origin: number | null; uid: number };

let nextUid = 0;

const newDraft = (): DraftStage => ({
  name: "",
  details: false,
  origin: null,
  uid: nextUid++,
});

const toDraft = (stages: Stage[]): DraftStage[] =>
  stages.map((s, i) => ({
    ...s,
    details: !!(s.link || s.deadline),
    origin: i,
    uid: nextUid++,
  }));

const GRIP_ICON = (
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
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

const normaliseLink = (link: string) =>
  /^https?:\/\//i.test(link) ? link : `https://${link}`;

const today = () => new Date().toLocaleDateString("en-CA");

export function ApplicationModal({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: Application | null; // null = adding a new application
  onClose: () => void;
  onSubmit: (
    data: Pick<
      Application,
      "company" | "logo" | "role" | "appliedOn" | "stages" | "currentStage"
    >,
  ) => void;
}) {
  const [company, setCompany] = useState("");
  const [logo, setLogo] = useState<string | undefined>();
  const [role, setRole] = useState("");
  const [appliedOn, setAppliedOn] = useState("");
  const [stages, setStages] = useState<DraftStage[]>(() =>
    toDraft(DEFAULT_STAGES),
  );
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep the native dialog in sync with the `open` prop.
  const setDialog = (el: HTMLDialogElement | null) => {
    dialogRef.current = el;
    if (!el) return;
    if (open && !el.open) {
      setCompany(initial?.company ?? "");
      setLogo(initial?.logo);
      setRole(initial?.role ?? "");
      setAppliedOn(initial?.appliedOn ?? today());
      setStages(toDraft(initial?.stages ?? DEFAULT_STAGES));
      el.showModal();
      if (formRef.current) formRef.current.scrollTop = 0;
      // showModal focuses the first field; start with nothing focused instead.
      (document.activeElement as HTMLElement | null)?.blur();
    } else if (!open && el.open) {
      el.close();
    }
  };

  const loadLogo = async (file: File) => {
    try {
      setLogo(await resizeImage(file));
    } catch {}
  };

  const moveStage = (from: number, to: number) => {
    if (from === to || to < 0 || to >= stages.length) return;
    const next = stages.slice();
    next.splice(to, 0, next.splice(from, 1)[0]);
    setStages(next);
  };

  const keptStages = stages.filter((s) => s.name.trim());
  // The current stage follows its stage when reordered; if it was removed, clamp.
  const currentStage = (() => {
    if (!initial) return 0;
    const moved = keptStages.findIndex((s) => s.origin === initial.currentStage);
    return moved >= 0
      ? moved
      : Math.min(initial.currentStage, keptStages.length - 1);
  })();

  const cleanStages: Stage[] = keptStages
    .map((s) => {
      // Hiding the details drops them on save.
      const link = s.details ? s.link?.trim() : undefined;
      const deadline = s.details ? s.deadline : undefined;
      return {
        name: s.name.trim(),
        ...(link && { link: normaliseLink(link) }),
        ...(deadline && { deadline }),
      };
    });
  const valid =
    company.trim() !== "" &&
    role.trim() !== "" &&
    appliedOn !== "" &&
    cleanStages.length >= 2;

  return (
    <dialog ref={setDialog} className="modal" onClose={onClose}>
      <form
        ref={formRef}
        onPaste={(e) => {
          // Pasting an image anywhere in the modal sets the logo; text pastes are untouched.
          const file = Array.from(e.clipboardData.files).find((f) =>
            f.type.startsWith("image/"),
          );
          if (!file) return;
          e.preventDefault();
          loadLogo(file);
        }}
        className="modal-box max-h-[calc(100dvh-4rem)] space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSubmit({
            company: company.trim(),
            logo,
            role: role.trim(),
            appliedOn,
            stages: cleanStages,
            currentStage,
          });
        }}
      >
        <h3 className="text-lg font-semibold">
          {initial ? "Edit application" : "Add application"}
        </h3>

        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-box border border-base-300 bg-base-200 text-lg font-semibold text-base-content/50">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-full w-full object-contain" />
            ) : (
              (company.trim()[0] ?? "?").toUpperCase()
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => fileRef.current?.click()}
          >
            {logo ? "Change logo" : "Upload logo"}
          </button>
          {logo && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setLogo(undefined)}
            >
              Remove
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // allow re-picking the same file
              if (file) await loadLogo(file);
            }}
          />
        </div>

        <label className="block">
          <span className="label-text mb-1 block">Company</span>
          <input
            className="input input-bordered w-full"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. J.P. Morgan"
          />
        </label>

        <label className="block">
          <span className="label-text mb-1 block">Job role</span>
          <input
            className="input input-bordered w-full"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Graduate Software Engineer"
          />
        </label>

        <div>
          <span className="label-text mb-1 block">Date applied</span>
          <DateInput
            className="w-full"
            value={appliedOn}
            onChange={setAppliedOn}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="label-text mb-1">Stages</legend>
          {stages.map((stage, i) => {
            const update = (patch: Partial<DraftStage>) =>
              setStages(stages.map((s, j) => (j === i ? { ...s, ...patch } : s)));
            return (
              <div
                key={stage.uid}
                data-stage-row
                className={`space-y-2 rounded-field ${
                  dragFrom !== null && dragOver === i && dragFrom !== i
                    ? "bg-base-200"
                    : ""
                }`}
                onDragOver={(e) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  setDragOver(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null) moveStage(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                }}
              >
                <div className="flex gap-2">
                  <span
                    role="button"
                    tabIndex={0}
                    draggable
                    aria-label="Reorder stage. Drag, or use the up and down arrow keys."
                    className="flex w-6 shrink-0 cursor-grab items-center justify-center text-base-content/50 active:cursor-grabbing"
                    onDragStart={(e) => {
                      setDragFrom(i);
                      e.dataTransfer.effectAllowed = "move";
                      const row = e.currentTarget.closest("[data-stage-row]");
                      if (row) e.dataTransfer.setDragImage(row, 16, 16);
                    }}
                    onDragEnd={() => {
                      setDragFrom(null);
                      setDragOver(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                      e.preventDefault();
                      moveStage(i, i + (e.key === "ArrowUp" ? -1 : 1));
                    }}
                  >
                    {GRIP_ICON}
                  </span>
                  <input
                    className="input input-bordered flex-1"
                    value={stage.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder={`Stage ${i + 1}`}
                  />
                  <button
                    type="button"
                    className={`btn btn-square ${stage.details ? "" : "btn-ghost"}`}
                    aria-label="Link and date"
                    aria-pressed={stage.details}
                    onClick={() => update({ details: !stage.details })}
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
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-square"
                    aria-label="Remove stage"
                    disabled={stages.length <= 2}
                    onClick={() => setStages(stages.filter((_, j) => j !== i))}
                  >
                    ✕
                  </button>
                </div>
                {stage.details && (
                  <div className="ml-8 flex gap-2 border-l-2 border-base-300 pl-3">
                    <input
                      className="input input-bordered input-sm flex-1"
                      value={stage.link ?? ""}
                      onChange={(e) => update({ link: e.target.value })}
                      placeholder="Link, e.g. assessment URL"
                      aria-label={`${stage.name || "Stage"} link`}
                    />
                    <DateInput
                      className="input-sm w-40"
                      clearable
                      placeholder="Date"
                      value={stage.deadline ?? ""}
                      onChange={(deadline) => update({ deadline })}
                      aria-label={`${stage.name || "Stage"} date`}
                    />
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setStages([...stages, newDraft()])}
          >
            + Add stage
          </button>
        </fieldset>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!valid}>
            {initial ? "Save changes" : "Add application"}
          </button>
        </div>
      </form>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
