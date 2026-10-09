"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function UserMenu({
  user,
}: {
  user: { name: string; email: string; image?: string | null };
}) {
  const router = useRouter();

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar"
        aria-label="Account menu"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-base-200 font-semibold">
            {user.name[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <div
        tabIndex={0}
        className="dropdown-content z-10 mt-2 w-60 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg"
      >
        <p className="truncate font-medium">{user.name}</p>
        <p className="truncate text-sm text-base-content/60">{user.email}</p>
        <button
          className="btn btn-sm mt-3 w-full"
          onClick={() =>
            authClient.signOut({
              fetchOptions: { onSuccess: () => router.refresh() },
            })
          }
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
