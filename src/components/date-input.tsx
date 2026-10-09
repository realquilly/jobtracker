"use client";

import { useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

const toIso = (d: Date) => d.toLocaleDateString("en-CA");

// Date picker using daisyUI's calendar styling (react-day-picker).
// `value` is yyyy-mm-dd or "".
export function DateInput({
  value,
  onChange,
  className = "",
  clearable = false,
  placeholder = "Pick a date",
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  clearable?: boolean; // allow deselecting by clicking the selected day
  placeholder?: string;
  "aria-label"?: string;
}) {
  const id = useId();
  const anchorName = `--date-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        className={`input input-bordered justify-start text-left ${className}`}
        style={{ anchorName }}
        {...aria}
      >
        {selected ? (
          selected.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        ) : (
          <span className="opacity-50">{placeholder}</span>
        )}
      </button>
      <div
        ref={popoverRef}
        id={id}
        popover="auto"
        className="dropdown rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
        style={{ positionAnchor: anchorName }}
        onToggle={(e) => setIsOpen(e.newState === "open")}
      >
        {/* Mounted only while open: DayPicker reads the current time, which can't happen during prerender. */}
        {isOpen && (
          <DayPicker
            className="react-day-picker"
            mode="single"
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              if (d) onChange(toIso(d));
              else if (clearable) onChange("");
              else return;
              popoverRef.current?.hidePopover();
            }}
          />
        )}
      </div>
    </>
  );
}
