import { useState } from "react";
import {
  addApplication,
  removeApplication,
  updateApplication,
} from "@/app/actions";
import type { Application } from "./types";

// Applies changes to local state immediately, saves them on the server,
// and rolls back if the save fails.
export function useApplications(initial: Application[]) {
  const [apps, setApps] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const save = (action: Promise<unknown>, rollback: Application[]) =>
    action
      .then(() => {
        setError(null);
        return true;
      })
      .catch(() => {
        setApps(rollback);
        setError("Could not save that change, so it was undone.");
        return false;
      });

  return {
    apps,
    error,
    dismissError: () => setError(null),
    add(app: Application) {
      setApps([app, ...apps]);
      return save(addApplication(app), apps);
    },
    update(id: string, patch: Partial<Omit<Application, "id">>) {
      setApps(apps.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      return save(updateApplication(id, patch), apps);
    },
    remove(id: string) {
      setApps(apps.filter((a) => a.id !== id));
      return save(removeApplication(id), apps);
    },
  };
}
