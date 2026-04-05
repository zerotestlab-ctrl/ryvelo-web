import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ProfileBootstrap } from "@/components/auth/profile-bootstrap";
import { DashboardProfileShell } from "@/components/dashboard/dashboard-profile-shell";

import { DashboardPageContent } from "./dashboard-content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <>
      <ProfileBootstrap />
      <DashboardProfileShell>
        <DashboardPageContent />
      </DashboardProfileShell>
    </>
  );
}
