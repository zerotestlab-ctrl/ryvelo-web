import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  FileInput,
  Menu,
  Quote,
  Scale,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";

import { RyveloLogo } from "@/components/brand/ryvelo-logo";
import { buttonVariants } from "@/components/ui/button";
import {
  marketingSignInUrl,
  marketingSignUpUrl,
} from "@/lib/marketing-auth-links";
import {
  PAYSTACK_CHECKOUT_PRO_URL,
  PAYSTACK_CHECKOUT_STARTER_URL,
} from "@/lib/payments/paystack-checkout-urls";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ryvelo — Cross-border invoice resolution",
  description:
    "Ingest invoices, resolve with AI, collect via Paystack. Built for freelancers, creators & African exporters.",
};

/** Required for `auth()` — marketing `/` stays public; signed-in users redirect to the app. */
export const dynamic = "force-dynamic";

const navLinks = [
  { href: "#problem", label: "Problem" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
] as const;

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#050f1a]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[#050f1a]/75 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)]">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <RyveloLogo href="/" className="min-w-0 shrink" />

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <details className="group relative md:hidden">
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center gap-1 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground",
                "[&::-webkit-details-marker]:hidden"
              )}
            >
              <Menu className="h-4 w-4" aria-hidden />
              Menu
              <ChevronDown className="h-3.5 w-3.5 opacity-60 transition group-open:rotate-180" />
            </summary>
            <div
              className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] rounded-xl border border-border/60 bg-[#071a2e] p-2 shadow-xl shadow-black/40"
              role="menu"
            >
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-white/5"
                  role="menuitem"
                >
                  {label}
                </Link>
              ))}
              <Link
                href={marketingSignInUrl()}
                className="mt-1 block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground sm:hidden"
                role="menuitem"
              >
                Sign in
              </Link>
            </div>
          </details>

          <Link
            href={marketingSignInUrl()}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden text-muted-foreground sm:inline-flex"
            )}
          >
            Sign in
          </Link>
          <Link
            href={marketingSignUpUrl()}
            className={cn(
              buttonVariants({ size: "default" }),
              "min-h-10 px-5 text-sm font-semibold shadow-lg shadow-[#00D4C8]/20 sm:min-h-11 sm:px-6 sm:text-base",
              "bg-[#00D4C8] text-[#0A2540] ring-2 ring-[#00D4C8]/35 hover:bg-[#00D4C8]/92"
            )}
          >
            Sign up free
          </Link>
        </div>
      </div>
    </header>
  );
}

function FlowPills() {
  const items = [
    { href: "#step-ingest", label: "Ingest" },
    { href: "#step-resolve", label: "Resolve" },
    { href: "#step-collect", label: "Collect" },
  ] as const;
  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-2 text-[13px] sm:text-sm">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 ? (
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 text-[#00D4C8]/45"
              aria-hidden
            />
          ) : null}
          <Link
            href={item.href}
            className="rounded-full border border-[#00D4C8]/25 bg-[#00D4C8]/[0.08] px-3 py-1.5 font-medium text-[#00D4C8] transition hover:border-[#00D4C8]/45 hover:bg-[#00D4C8]/12"
          >
            {item.label}
          </Link>
        </span>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40 px-4 pb-28 pt-14 sm:px-6 sm:pb-32 sm:pt-20 lg:px-8 lg:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-20%] h-[min(560px,72vh)] w-[min(920px,125vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,212,200,0.16),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,hsl(215_45%_12%/0.55)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00D4C8]/40 to-transparent" />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#00D4C8]/90">
          Cross-border receivables
        </p>
        <FlowPills />
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08] lg:text-[3.25rem] lg:leading-[1.05]">
          From invoice to collected cash—one flow
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Upload and normalize invoices, let AI surface FX and compliance gaps,
          approve recovery steps, then send buyers to Paystack with the right
          totals. Built for freelancers, creators, and African exporters.
        </p>
        <div className="mt-12 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href={marketingSignUpUrl()}
            className={cn(
              buttonVariants({ size: "lg" }),
              "inline-flex min-h-[3.25rem] min-w-[220px] justify-center px-8 text-base font-semibold",
              "bg-[#00D4C8] text-[#0A2540] shadow-[0_20px_50px_-12px_rgba(0,212,200,0.45)] ring-2 ring-[#00D4C8]/40 hover:bg-[#00D4C8]/90"
            )}
          >
            Sign up free
            <ArrowRight className="opacity-90" aria-hidden />
          </Link>
          <Link
            href="#pricing"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "inline-flex min-h-[3.25rem] min-w-[200px] justify-center border-border/70 bg-white/[0.03] backdrop-blur-sm"
            )}
          >
            View pricing (USD)
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          No credit card to create your account · Clerk sign-in on production
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
      className="scroll-mt-[5.5rem] border-b border-border/40 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
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
              className="group rounded-2xl border border-border/50 bg-card/25 p-8 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] transition-colors hover:border-[#00D4C8]/28 hover:bg-card/40"
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
    desc: "Drop PDFs or structured payloads. We normalize fields, detect issues, and attach everything to a single resolution thread.",
    icon: FileInput,
  },
  {
    n: "2",
    title: "Resolve",
    desc: "AI surfaces FX, tax, and compliance gaps, drafts recovery steps, and waits for your approve/reject in the app.",
    icon: Zap,
  },
  {
    n: "3",
    title: "Collect",
    desc: "After approval, open your Paystack hosted link with invoice totals where supported—clear audit trail from quote to cash.",
    icon: Banknote,
  },
] as const;

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-[5.5rem] border-b border-border/40 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00D4C8]">
            How it works
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Ingest → Resolve → Collect
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            The same three steps we ship in the product—from file upload to
            Paystack checkout.
          </p>
        </div>

        <ol className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3 lg:gap-5">
          {steps.map(({ n, title, desc, icon: Icon }, i) => (
            <li
              key={title}
              id={`step-${title.toLowerCase()}`}
              className="relative scroll-mt-[6rem] flex flex-col rounded-2xl border border-border/55 bg-gradient-to-b from-card/55 to-background/95 p-8 shadow-xl shadow-black/30"
            >
              {i < steps.length - 1 ? (
                <div
                  className="absolute -right-3 top-1/2 z-0 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#00D4C8]/20 bg-[#071a2e] text-[#00D4C8]/50 lg:flex"
                  aria-hidden
                >
                  <ArrowRight className="h-4 w-4" />
                </div>
              ) : null}
              <div className="relative z-[1] mb-6 flex items-center gap-4">
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
              <h3 className="relative z-[1] text-xl font-semibold text-foreground">
                {title}
              </h3>
              <p className="relative z-[1] mt-3 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
              {i < steps.length - 1 ? (
                <div
                  className="mt-8 flex justify-center text-[#00D4C8]/35 lg:hidden"
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
      className="scroll-mt-[5.5rem] px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00D4C8]">
            Pricing
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple plans in USD
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Paystack-hosted checkout. Cancel anytime.
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
              href={PAYSTACK_CHECKOUT_STARTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "mt-12 w-full font-semibold"
              )}
            >
              Get Starter — $6/mo
            </a>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/90">
              <span className="font-medium text-muted-foreground">
                Paystack link
              </span>
              <br />
              <code className="mt-1 block break-all rounded-md bg-black/25 px-2 py-1.5 text-[10px] text-[#00D4C8]/90">
                {PAYSTACK_CHECKOUT_STARTER_URL}
              </code>
            </p>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-[#00D4C8]/40 bg-gradient-to-b from-[#00D4C8]/[0.08] via-card/50 to-card/30 p-8 sm:p-10 shadow-[0_24px_64px_-24px_rgba(0,212,200,0.2)]">
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
              href={PAYSTACK_CHECKOUT_PRO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-12 w-full bg-[#00D4C8] font-semibold text-[#0A2540] shadow-lg shadow-[#00D4C8]/25 hover:bg-[#00D4C8]/90"
              )}
            >
              Get Pro — $15/mo
            </a>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/90">
              <span className="font-medium text-muted-foreground">
                Paystack link
              </span>
              <br />
              <code className="mt-1 block break-all rounded-md bg-black/25 px-2 py-1.5 text-[10px] text-[#00D4C8]/90">
                {PAYSTACK_CHECKOUT_PRO_URL}
              </code>
            </p>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-lg text-center text-sm text-muted-foreground">
          Prices listed in USD. Checkout, receipts, and renewals are handled by
          Paystack on the URLs above.
        </p>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-t border-border/40 bg-muted/[0.06] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00D4C8]">
          Customers
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Shipping with design partners
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Logos and case studies land here as we onboard teams across Africa and
          the diaspora.
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card/30 px-8 py-14">
          <Quote
            className="mx-auto h-10 w-10 text-muted-foreground/40"
            aria-hidden
          />
          <p className="mx-auto mt-5 max-w-md text-sm italic leading-relaxed text-muted-foreground">
            We&apos;re focused on the ingest → resolve → collect loop first—your
            wins will show up here next.
          </p>
        </div>
      </div>
    </section>
  );
}

function MidCta() {
  return (
    <section className="border-t border-border/40 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#00D4C8]/25 bg-gradient-to-br from-[#00D4C8]/[0.09] via-card/40 to-[#071a2e]/80 p-8 text-center shadow-[0_24px_64px_-28px_rgba(0,0,0,0.45)] sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Run the full flow in your workspace
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Create a free account, connect your stack, and move from first upload
          to Paystack collect in one session.
        </p>
        <Link
          href={marketingSignUpUrl()}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 inline-flex min-h-[3rem] min-w-[220px] justify-center px-8 text-base font-semibold",
            "bg-[#00D4C8] text-[#0A2540] shadow-lg shadow-[#00D4C8]/25 ring-2 ring-[#00D4C8]/30 hover:bg-[#00D4C8]/90"
          )}
        >
          Sign up free
          <ArrowRight className="opacity-90" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 bg-[#040d18]/90 px-4 py-14 sm:px-6 lg:px-8">
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
            <Link href={marketingSignInUrl()} className="hover:text-foreground">
              Sign in
            </Link>
            <Link
              href={marketingSignUpUrl()}
              className="font-medium text-[#00D4C8] hover:underline"
            >
              Sign up free
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
        <MidCta />
      </main>
      <Footer />
    </div>
  );
}
