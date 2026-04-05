import Link from "next/link";
import { Shield } from "lucide-react";

import { cn } from "@/lib/utils";

type RyveloLogoProps = {
  /** Marketing home (`/`) or app home (`/dashboard`). */
  href?: string;
  /** Second line under the wordmark (e.g. sidebar). */
  tagline?: string;
  className?: string;
  /** Smaller icon + text for dense toolbars. */
  compact?: boolean;
};

/**
 * Shared Ryvelo wordmark: text + shield icon (navy/teal shell).
 */
export function RyveloLogo({
  href = "/",
  tagline,
  className,
  compact = false,
}: RyveloLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/35",
          compact ? "h-8 w-8" : "h-9 w-9"
        )}
        aria-hidden
      >
        <Shield
          className={cn(compact ? "h-4 w-4" : "h-[18px] w-[18px]")}
          strokeWidth={2}
        />
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={cn(
            "block font-semibold tracking-tight text-foreground",
            compact ? "text-sm" : "text-[15px] sm:text-base"
          )}
        >
          Ryvelo
        </span>
        {tagline ? (
          <span className="block truncate text-xs text-muted-foreground">
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
