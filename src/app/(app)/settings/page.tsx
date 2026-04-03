export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace configuration and integrations.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="px-4 py-3">
          <div className="text-sm font-semibold">Integrations</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Clerk + Supabase configuration placeholders.
          </div>
        </div>
        <div className="border-t border-border px-4 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-black/10 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Clerk
              </div>
              <div className="mt-1 text-sm text-foreground">
                Authentication enabled
              </div>
            </div>
            <div className="rounded-lg border border-border bg-black/10 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Supabase
              </div>
              <div className="mt-1 text-sm text-foreground">
                Client configured
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

