import { ProfileBootstrap } from "@/components/auth/profile-bootstrap";
import ClerkUserButton from "@/components/ui/clerk-user-button";
import { Sidebar } from "@/components/app-shell/sidebar";
import { TopBar } from "@/components/app-shell/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <ProfileBootstrap />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          rightSlot={
            <div className="flex items-center gap-2">
              <ClerkUserButton />
            </div>
          }
        />
        <main className="flex-1 px-5 py-6 sm:px-8">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

