import React from "react";
import { cn } from "@/lib/utils";

export function AppPageShell({
  title,
  description,
  children,
}) {
  return (
    <main className="min-h-screen bg-[#09090b] pb-24 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#14313b_0%,rgba(9,9,11,0.97)_40%,#09090b_75%)]" />
        <div className="absolute left-[-8%] top-[5%] h-[26rem] w-[26rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-28 lg:px-10">
        {(title || description) ? (
          <header className="mb-10">
            {title ? (
              <h1 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                {description}
              </p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </main>
  );
}

export function AppSurface({ className, children }) {
  return (
    <div className={cn("rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}
