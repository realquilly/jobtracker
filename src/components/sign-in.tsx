"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignIn() {
  const [pending, setPending] = useState(false);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="card w-full max-w-sm border border-base-300 bg-base-100">
        <div className="card-body items-center gap-4 text-center">
          <h1 className="card-title text-2xl">Job tracker</h1>
          <p className="text-base-content/60">
            Sign in to keep track of your applications.
          </p>
          <button
            className="btn btn-primary w-full"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              const { error } = await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
              });
              if (error) setPending(false);
            }}
          >
            {pending && <span className="loading loading-spinner loading-sm" />}
            Sign in with Google
          </button>
        </div>
      </div>
    </main>
  );
}
