import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Paystack hosted checkout (configure products in Paystack Dashboard).
 * For development, switch the Paystack account / payment pages to **test mode** and use test keys
 * so charges are not live.
 */
export const PAYSTACK_CHECKOUT_STARTER =
  "https://paystack.shop/pay/azsd6l063h";
export const PAYSTACK_CHECKOUT_PRO =
  "https://paystack.shop/pay/gto1y470q5";

type Variant = "compact" | "hero";

function CheckoutLink({
  href,
  children,
  className,
  highlight,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({
          variant: highlight ? "default" : "secondary",
          size: "sm",
        }),
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Starter + Pro Paystack subscription links (hosted checkout pages).
 */
export function UpgradeSubscriptionButtons({
  variant = "compact",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === "hero") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
          className
        )}
      >
        <CheckoutLink
          href={PAYSTACK_CHECKOUT_STARTER}
          className="h-11 min-w-[200px] justify-center px-5 sm:h-12"
        >
          Starter — $6/mo
        </CheckoutLink>
        <CheckoutLink
          href={PAYSTACK_CHECKOUT_PRO}
          highlight
          className="h-11 min-w-[220px] justify-center px-5 shadow-lg shadow-accent/20 sm:h-12"
        >
          Pro (Recommended) — $15/mo
        </CheckoutLink>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <CheckoutLink href={PAYSTACK_CHECKOUT_STARTER} className="h-9 px-3 text-xs">
        Starter · $6/mo
      </CheckoutLink>
      <CheckoutLink
        href={PAYSTACK_CHECKOUT_PRO}
        highlight
        className="h-9 px-3 text-xs"
      >
        Pro · $15/mo
      </CheckoutLink>
    </div>
  );
}

/** Large dashboard CTA with headline + checkout buttons. */
export function SubscriptionUpgradeCta({
  planLabel,
  className,
}: {
  planLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card p-6 shadow-lg shadow-black/20",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
            Current plan:{" "}
            <span className="text-foreground">{planLabel}</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Unlock unlimited resolutions &amp; payments
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Subscribe via Paystack to lift limits and automate recovery workflows.
            Use test mode in Paystack while building.
          </p>
        </div>
        <UpgradeSubscriptionButtons variant="hero" className="shrink-0 lg:justify-end" />
      </div>
    </div>
  );
}
