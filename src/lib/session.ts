import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";

// Reads request headers, so callers must sit behind a <Suspense> boundary.
export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
