import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Check,
  FileInput,
  Quote,
  Scale,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";

import { RyveloLogo } from "@/components/brand/ryvelo-logo";
import {
  PAYSTACK_CHECKOUT_PRO,
  PAYSTACK_CHECKOUT_STARTER,
} from "@/components/subscription/upgrade-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ryvelo — Cross-border invoice resolution",
  description:
    "Autonomous AI resolution for freelancers, creators & African exporters. Get paid faster with FX-aware workflows.",
};

/** Required for `auth()` — marketing `/` stays public; signed-in users redirect to the app. */
export const dynamic = "force-dynamic";

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#071a2e]/92 backdrop-blur-xl supports-[backdrop-filter]:bg-[#071a2e]/78 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.65)]">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <RyveloLogo href="/" className="shrink-0" />
        <nav
          className="flex items-center gap-0.5 sm:gap-1"
          aria-label="Primary"
        >
          <Link
            href="#problem"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline md:px-2"
          >
            Problem
          </Link>
          <Link
            href="#how-it-works"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline md:px-2"
          >
            How it works
          </Link>
          <Link
            href="#pricing"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline md:px-2"
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
            className={cn(
              buttonVariants({ size: "sm" }),
              "font-semibold shadow-sm shadow-[#00D4C8]/10"
            )}
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
    <section className="relative overflow-hidden border-b border-border/40 px-4 pb-24 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8 lg:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-25%] h-[min(600px,75vh)] w-[min(960px,130vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,212,200,0.14),transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,hsl(222_53%_15%/0.4)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00D4C8]/35 to-transparent" />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#00D4C8]/90">
          Cross-border receivables
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08] lg:text-[3.15rem] lg:leading-[1.06]">
          Get paid faster on every cross-border invoice
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Autonomous AI resolution for freelancers, creators &amp; African
          exporters.
        </p>
        <div className="mt-11 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "lg" }),
              "inline-flex min-h-12 min-w-[200px] justify-center bg-[#00D4C8] font-semibold text-[#0A2540] shadow-lg shadow-[#00D4C8]/20 hover:bg-[#00D4C8]/90"
            )}
          >
            Sign up free
            <ArrowRight className="opacity-90" />
          </Link>
          <Link
            href="#pricing"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "inline-flex min-h-12 min-w-[200px] justify-center border-border/70 bg-transparent"
            )}
          >
            View pricing
          </Link>
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          No credit card required to start
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
    icon: Scale,
    title: "Disputes",
    body: "Scope, deliverables, and tax lines become negotiation traps. Without a single source of truth, collections stall.",
  },
  {
    icon: FileInput,
    title: "Compliance penalties",
    body: "E-invoicing, VAT, and reporting rules are tightening. Non-compliance means fines and blocked payments—not just delays.",
  },
] as const;

function ProblemSection() {
  return (
    <section
      id="problem"
      className="scroll-mt-20 border-b border-border/40 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00D4C8]">
            The problem
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Receivables break at the border
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Three risks that quietly erode cash and control.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/50 bg-card/30 p-8 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] transition-colors hover:border-[#00D4C8]/25 hover:bg-card/45"
            >
              <div
                className="mb-5 inline-flex rounded-xl border border-white/[0.08] p-3"
                style={{ backgroundColor: "#0A2540" }}
              >
                <Icon
                  className="h-6 w-6"
                  style={{ color: "#00D4C8" }}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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
    desc: "Bring invoices from exports or structured payloads—normalized fields and issue detection in one pass.",
    icon: FileInput,
  },
  {
    n: "2",
    title: "Resolve",
    desc: "AI-assisted workflows surface FX, tax, and compliance gaps, then propose recovery steps you approve.",
    icon: Zap,
  },
  {
    n: "3",
    title: "Collect",
    desc: "Route clients to payment with accurate totals and a clear audit trail when funds settle.",
    icon: Banknote,
  },
] as const;

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-border/40 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00D4C8]">
            How it works
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Three steps. One flow.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            From invoice to collected cash—without the spreadsheet chaos.
          </p>
        </div>

        <ol className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3 lg:gap-6">
          {steps.map(({ n, title, desc, icon: Icon }, i) => (
            <li
              key={title}
              className="relative flex flex-col rounded-2xl border border-border/55 bg-gradient-to-b from-card/60 to-background/95 p-8 shadow-xl shadow-black/25"
            >
              <div className="mb-6 flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#00D4C8]/30 bg-[#00D4C8]/10 font-mono text-sm font-bold text-[#00D4C8]">
                  {n}
                </span>
                <div
                  className="rounded-xl border border-[#00D4C8]/20 p-3"
                  style={{ backgroundColor: "rgba(0,212,200,0.06)" }}
                >
                  <Icon
                    className="h-6 w-6"
                    style={{ color: "#00D4C8" }}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
              {i < steps.length - 1 ? (
                <div
                  className="mt-8 flex justify-center text-[#00D4C8]/30 lg:hidden"
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
    <section
      id="pricing"
      className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00D4C8]">
            Pricing
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple USD pricing
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Choose a plan. Cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-6">
          <div className="flex flex-col rounded-2xl border border-border/55 bg-card/20 p-8 sm:p-10">
            <h3 className="text-lg font-semibold text-foreground">Starter</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              For solo operators standardizing collections.
            </p>
            <p className="mt-8 flex items-baseline gap-1">
              <span className="text-5xl font-semibold tabular-nums tracking-tight text-foreground">
                $6
              </span>
              <span className="text-muted-foreground">/month · USD</span>
            </p>
            <ul className="mt-10 space-y-4 text-sm text-muted-foreground">
              {[
                "Ingest & resolution workspace",
                "FX, tax & compliance signals",
                "Recovery-ready email flows",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4C8]"
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
                "mt-12 w-full font-semibold"
              )}
            >
              Get Starter — $6/mo
            </a>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-[#00D4C8]/40 bg-gradient-to-b from-[#00D4C8]/[0.07] via-card/50 to-card/30 p-8 sm:p-10 shadow-[0_24px_64px_-24px_rgba(0,212,200,0.18)]">
            <div className="absolute right-5 top-5 rounded-full border border-[#00D4C8]/35 bg-[#00D4C8]/12 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00D4C8]">
              Recommended
            </div>
            <h3 className="text-lg font-semibold text-foreground">Pro</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              For teams with volume and tighter recovery targets.
            </p>
            <p className="mt-8 flex items-baseline gap-1">
              <span className="text-5xl font-semibold tabular-nums tracking-tight text-foreground">
                $15
              </span>
              <span className="text-muted-foreground">/month · USD</span>
            </p>
            <ul className="mt-10 space-y-4 text-sm text-muted-foreground">
              {[
                "Everything in Starter",
                "Higher throughput & routing",
                "Cash velocity reporting",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4C8]"
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
                "mt-12 w-full bg-[#00D4C8] font-semibold text-[#0A2540] shadow-lg shadow-[#00D4C8]/25 hover:bg-[#00D4C8]/90"
              )}
            >
              Get Pro — $15/mo
            </a>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-lg text-center text-sm text-muted-foreground">
          Checkout is hosted by Paystack. Prices shown in USD.
        </p>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-t border-border/40 bg-muted/[0.06] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00D4C8]">
          Customers
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Trusted by teams who ship
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Case studies and logos coming soon.
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card/30 px-8 py-16">
          <Quote
            className="mx-auto h-10 w-10 text-muted-foreground/40"
            aria-hidden
          />
          <p className="mx-auto mt-5 max-w-md text-sm italic leading-relaxed text-muted-foreground">
            Customer quotes and social proof will appear here as we onboard
            design partners across Africa and the diaspora.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 bg-[#061525]/80 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <RyveloLogo href="/" compact className="opacity-95" />
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#00D4C8]" aria-hidden />
              Built with ZEROTEST LAB QA rigor
            </div>
          </div>
          <div className="max-w-md text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
            <p>
              Questions?{" "}
              <a
                href="mailto:ryvelo12@gmail.com"
                className="font-medium text-[#00D4C8] underline-offset-4 hover:underline"
              >
                ryvelo12@gmail.com
              </a>{" "}
              or{" "}
              <a
                href="https://x.com/zerotestlab"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#00D4C8] underline-offset-4 hover:underline"
              >
                @zerotestlab on X
              </a>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-6 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ryvelo
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
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

/**
 * Public marketing homepage — no sign-in required.
 * Signed-in users are sent to `/dashboard` (see `middleware.ts` and `redirect` below).
 */
export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Nav />
      <main className="flex-1">
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
