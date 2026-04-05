import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Check,
  FileInput,
  Gavel,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";

import {
  PAYSTACK_CHECKOUT_PRO,
  PAYSTACK_CHECKOUT_STARTER,
} from "@/components/subscription/upgrade-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ryvelo — Get paid faster on every cross-border invoice",
  description:
    "Autonomous AI resolution for freelancers, creators & African exporters. Ingest, resolve, and collect with FX-aware workflows.",
};

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base"
        >
          Ryvelo
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="#problem"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Problem
          </Link>
          <Link
            href="#how-it-works"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            How it works
          </Link>
          <Link
            href="#pricing"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Pricing
          </Link>
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground"
            )}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: "sm" }), "font-semibold")}
          >
            Sign up free
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40 px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8 lg:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-20%] h-[min(560px,70vh)] w-[min(920px,120vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,hsl(176_100%_42%/0.11),transparent_68%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-balance text-[1.65rem] font-semibold leading-snug tracking-tight text-foreground sm:text-4xl sm:leading-tight lg:text-[2.75rem] lg:leading-[1.12]">
          Ryvelo —{" "}
          <span className="bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent">
            Get paid faster on every cross-border invoice
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Autonomous AI resolution for freelancers, creators &amp; African
          exporters.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "lg" }),
              "inline-flex min-h-12 justify-center font-semibold"
            )}
          >
            Sign up free
            <ArrowRight className="opacity-90" />
          </Link>
          <Link
            href="#pricing"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "inline-flex min-h-12 justify-center border-border/80 bg-transparent"
            )}
          >
            See pricing
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          No card required to start · Cancel subscription anytime
        </p>
      </div>
    </section>
  );
}

const problems = [
  {
    icon: TrendingDown,
    title: "FX losses",
    body: "Spreads, timing, and settlement paths leak margin before cash hits your account—often invisible until reconciliation.",
  },
  {
    icon: Gavel,
    title: "Disputes",
    body: "Scope, deliverables, and tax lines become negotiation traps. Without a single source of truth, collections stall.",
  },
  {
    icon: FileInput,
    title: "2026 e-invoicing penalties",
    body: "Digital invoicing and VAT reporting rules are tightening globally. Fines and blocked payments replace polite reminders.",
  },
] as const;

function ProblemSection() {
  return (
    <section
      id="problem"
      className="scroll-mt-16 border-b border-border/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
            The problem
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Cross-border invoices don&apos;t fail loudly—they bleed cash
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three pressure points we see on every desk.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {problems.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/55 bg-card/35 p-6 shadow-[0_1px_0_0_hsl(0_0%_100%/_0.04)_inset] transition-colors hover:border-border hover:bg-card/50"
            >
              <div className="mb-4 inline-flex rounded-xl border border-border/70 bg-background/60 p-3 text-accent">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "1",
    title: "Ingest",
    desc: "Bring invoices in from exports or paste structured data—normalized fields and issue detection in one pass.",
    icon: FileInput,
  },
  {
    n: "2",
    title: "Resolve",
    desc: "AI-assisted workflows flag FX, tax, and compliance gaps, then propose clear recovery steps you can approve.",
    icon: Zap,
  },
  {
    n: "3",
    title: "Collect",
    desc: "Move clients to payment with accurate totals and an audit trail when funds settle.",
    icon: Banknote,
  },
] as const;

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-b border-border/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
            How it works
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Three simple steps
          </h2>
          <p className="mt-3 text-muted-foreground">
            From raw invoice to money in motion.
          </p>
        </div>

        <ol className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3 lg:gap-8">
          {steps.map(({ n, title, desc, icon: Icon }, i) => (
            <li
              key={title}
              className="relative flex flex-col rounded-2xl border border-border/60 bg-gradient-to-b from-card/80 to-background/90 p-7 shadow-lg shadow-black/20"
            >
              <div className="mb-5 flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-mono text-sm font-semibold text-accent">
                  {n}
                </span>
                <div className="rounded-xl border border-accent/15 bg-accent/5 p-2.5 text-accent">
                  <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
              {i < steps.length - 1 ? (
                <div
                  className="mt-6 flex justify-center text-accent/35 lg:hidden"
                  aria-hidden
                >
                  <ArrowRight className="h-5 w-5 rotate-90" />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
            Pricing
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            USD plans, Paystack checkout
          </h2>
          <p className="mt-3 text-muted-foreground">
            Same hosted pages—international cards welcome. Cancel anytime.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-5">
          <div className="flex flex-col rounded-2xl border border-border/60 bg-card/25 p-8 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-semibold text-foreground">Starter</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Solo operators standardizing collections.
            </p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                $6
              </span>
              <span className="text-muted-foreground">/month · USD</span>
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              {[
                "Ingest & resolution workspace",
                "FX, tax & compliance signals",
                "Recovery-ready email flows",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
            <a
              href={PAYSTACK_CHECKOUT_STARTER}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "mt-10 w-full font-semibold"
              )}
            >
              Subscribe — Starter ($6/mo)
            </a>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-accent/35 bg-gradient-to-b from-accent/[0.08] via-card/40 to-card/25 p-8 shadow-[0_24px_60px_-20px_hsl(176_100%_42%/_0.12)]">
            <div className="absolute right-4 top-4 rounded-full border border-accent/35 bg-accent/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
              Recommended
            </div>
            <h3 className="text-lg font-semibold text-foreground">Pro</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Teams with volume and tighter recovery targets.
            </p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                $15
              </span>
              <span className="text-muted-foreground">/month · USD</span>
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              {[
                "Everything in Starter",
                "Higher throughput & routing",
                "Cash velocity reporting",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
            <a
              href={PAYSTACK_CHECKOUT_PRO}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-10 w-full font-semibold shadow-lg shadow-accent/20"
              )}
            >
              Subscribe — Pro ($15/mo)
            </a>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-lg text-center text-xs leading-relaxed text-muted-foreground">
          Checkout opens on Paystack&apos;s hosted pages (
          <code className="rounded bg-muted/50 px-1 py-0.5 text-[11px]">
            paystack.shop
          </code>
          ). Use test mode in Paystack while building.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/[0.08] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
          Built with ZEROTEST LAB QA rigor
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ryvelo
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/sign-in" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/sign-up" className="hover:text-foreground">
              Sign up
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Nav />
      <main className="flex-1">
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
