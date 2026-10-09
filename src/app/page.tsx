import { Suspense } from "react";
import { SignIn } from "@/components/sign-in";
import { Tracker } from "@/components/tracker";
import { getApplications } from "@/lib/data";
import { getUser } from "@/lib/session";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

// Reads the session, so it streams in behind the Suspense boundary above.
async function Content() {
  const user = await getUser();
  if (!user) return <SignIn />;

  const apps = await getApplications(user.id);
  return (
    <Tracker
      key={user.id}
      initialApps={apps}
      user={{ name: user.name, email: user.email, image: user.image }}
    />
  );
}
