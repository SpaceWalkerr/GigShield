import React from "react";
import { cn } from "@/lib/utils";

export function AuthPageShell({
  eyebrow,
  title,
  description,
  asideItems = [],
  children,
}) {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#14313b_0%,rgba(9,9,11,0.97)_40%,#09090b_75%)]" />
        <div className="absolute left-[-8%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-8%] bottom-[10%] h-[22rem] w-[22rem] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-28 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <aside className="hidden lg:block">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
            {eyebrow}
          </p>
          <h1 className="mt-6 max-w-xl text-6xl font-black tracking-[-0.06em] text-white">
            {title}
          </h1>
          <p className="mt-8 max-w-md text-lg leading-8 text-zinc-300">
            {description}
          </p>

          <div className="mt-10 space-y-4">
            {asideItems.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-300 text-zinc-950">
                    {item.icon}
                  </div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
                {item.detail ? (
                  <p className="mt-3 text-sm leading-7 text-zinc-300">{item.detail}</p>
                ) : null}
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}

export function AuthPanel({ className, children }) {
  return (
    <div className={cn("rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}
