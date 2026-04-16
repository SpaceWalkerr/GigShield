import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketingPageShell({
  eyebrow,
  title,
  highlight,
  description,
  primaryAction,
  secondaryAction,
  stats = [],
  children,
}) {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#14313b_0%,rgba(9,9,11,0.97)_40%,#09090b_75%)]" />
        <div className="absolute left-[-8%] top-[4%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12%] top-[18%] h-[26rem] w-[26rem] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-14 pt-28 md:pt-36 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
              {eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-black tracking-[-0.06em] text-white md:text-7xl">
              {title}
              {highlight ? <span className="text-zinc-500"> {highlight}</span> : null}
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-300">
              {description}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {primaryAction ? (
                <ActionLink to={primaryAction.to} variant="primary">
                  {primaryAction.label}
                </ActionLink>
              ) : null}
              {secondaryAction ? (
                <ActionLink to={secondaryAction.to} variant="secondary">
                  {secondaryAction.label}
                </ActionLink>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-4 text-3xl font-black tracking-tight text-white">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">{children}</div>
    </main>
  );
}

export function MarketingSection({ title, caption, children, className }) {
  return (
    <section className={cn("mt-16", className)}>
      {caption ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
          {caption}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
          {title}
        </h2>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function SurfaceCard({ className, children }) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ActionLink({ to, variant, children }) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all",
        variant === "primary"
          ? "bg-cyan-300 text-zinc-950 hover:bg-cyan-200"
          : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
      )}
    >
      {children}
      <ArrowRight className="size-4" />
    </Link>
  );
}
