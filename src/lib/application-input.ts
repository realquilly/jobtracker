import type { Application, Stage } from "./types";
import type { application } from "./db/schema";

type Fields = Partial<typeof application.$inferInsert>;

const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const isDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

const isHttpUrl = (v: string) => {
  try {
    const { protocol } = new URL(v);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

function parseStages(input: unknown): Stage[] {
  if (!Array.isArray(input) || input.length < 2 || input.length > 30) {
    throw new Error("Invalid stages");
  }
  return input.map((s) => {
    const name = text(s?.name, 100);
    if (!name) throw new Error("Invalid stage name");
    const link = text(s?.link, 2000);
    const stage: Stage = { name };
    if (link) {
      if (!isHttpUrl(link)) throw new Error("Invalid stage link");
      stage.link = link;
    }
    if (s?.deadline) {
      if (!isDate(s.deadline)) throw new Error("Invalid stage deadline");
      stage.deadline = s.deadline;
    }
    return stage;
  });
}

// Validates untrusted client input; only keys present in `input` are returned.
export function parseFields(input: Partial<Omit<Application, "id">>): Fields {
  const out: Fields = {};
  if ("company" in input) {
    out.company = text(input.company, 200);
    if (!out.company) throw new Error("Invalid company");
  }
  if ("role" in input) out.role = text(input.role, 200) || null;
  if ("logo" in input) {
    const logo = input.logo;
    if (!logo) out.logo = null;
    else if (
      typeof logo === "string" &&
      logo.length <= 300_000 &&
      /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(logo)
    ) {
      out.logo = logo;
    } else throw new Error("Invalid logo");
  }
  if ("appliedOn" in input) {
    if (!isDate(input.appliedOn)) throw new Error("Invalid date");
    out.appliedOn = input.appliedOn;
  }
  if ("stages" in input) out.stages = parseStages(input.stages);
  if ("currentStage" in input) {
    const n = input.currentStage;
    if (!Number.isInteger(n) || (n as number) < 0) throw new Error("Invalid stage");
    out.currentStage = n;
  }
  if (out.stages && out.currentStage !== undefined) {
    if (out.currentStage >= out.stages.length) throw new Error("Invalid stage");
  }
  if ("rejected" in input) out.rejected = input.rejected === true;
  return out;
}

export function parseId(id: unknown) {
  const v = text(id, 64);
  if (!v) throw new Error("Invalid id");
  return v;
}
