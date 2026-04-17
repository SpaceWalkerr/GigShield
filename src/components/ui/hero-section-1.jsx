import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  CloudRain,
  Wind,
  WifiOff,
  ShieldCheck,
  BarChart3,
  Wallet,
  ScanSearch,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";

const credibilityItems = [
  { icon: CloudRain, label: "Rain + heat triggers" },
  { icon: Wind, label: "AQI disruption signals" },
  { icon: WifiOff, label: "Platform outage checks" },
  { icon: ShieldCheck, label: "Fraud-guarded payouts" },
  { icon: Wallet, label: "Weekly-priced cover" },
  { icon: BarChart3, label: "Worker + admin dashboards" },
  { icon: ScanSearch, label: "Policy transparency" },
  { icon: Activity, label: "Predictive risk engine" },
];

export function HeroSection() {
  return (
    <main className="overflow-hidden bg-[#06080b] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_40%,rgba(16,24,32,0.92)_0%,rgba(8,10,14,0.98)_46%,#06080b_78%)]" />
        <div className="absolute left-[-10%] top-[-8%] h-[34rem] w-[34rem] rounded-full bg-cyan-400/4 blur-3xl" />
        <div className="absolute right-[-12%] top-[12%] h-[30rem] w-[30rem] rounded-full bg-slate-300/6 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[20%] h-[26rem] w-[26rem] rounded-full bg-cyan-300/4 blur-3xl" />
      </div>

      <section className="relative z-10">
        <div className="relative min-h-[100svh] overflow-hidden">
          <Spotlight
            className="-top-40 left-0 md:left-52 md:-top-28"
            fill="#7dd3fc"
          />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_62%_48%,rgba(9,12,18,0.1)_0%,rgba(4,6,10,0.34)_42%,rgba(3,5,8,0.82)_100%)]" />
          <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(90deg,rgba(3,6,10,0.9)_0%,rgba(3,6,10,0.62)_24%,rgba(3,6,10,0.24)_46%,rgba(3,6,10,0.54)_70%,rgba(3,6,10,0.9)_100%)]" />

          <div className="relative z-10 grid min-h-[100svh] w-full items-center gap-8 px-4 pb-24 pt-28 sm:px-6 md:pt-32 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 xl:px-14">
            <div className="order-1 max-w-3xl text-center lg:text-left">
              <Link
                to="/triggers"
                className="group mx-auto flex w-fit items-center gap-4 rounded-full border border-white/10 bg-white/5 p-1 pl-4 shadow-md shadow-black/20 backdrop-blur-lg transition-all duration-300 hover:border-cyan-300/25 hover:bg-white/10 lg:mx-0"
              >
                <span className="text-sm text-zinc-100">
                  AI-powered weekly protection for delivery workers
                </span>
                <span className="block h-4 w-px bg-white/20" />
                <div className="flex size-6 items-center justify-center rounded-full bg-white/10 transition group-hover:bg-cyan-300/20">
                  <ArrowRight className="size-3" />
                </div>
              </Link>

              <div className="mt-8 max-w-4xl lg:mt-10">
                <h1 className="text-balance text-5xl font-black tracking-[-0.06em] text-white md:text-7xl xl:text-[5.3rem]">
                  Weekly income protection for every disrupted delivery shift.
                </h1>
              </div>

              <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-8 text-zinc-300 lg:mx-0">
                GigShield helps delivery workers stay protected when rain, AQI,
                or platform outages cut earning hours. Weekly plans, automated
                triggers, fraud checks, and Income Radar work together in one
                rider-first protection system.
              </p>

            </div>

            <div className="relative order-2 min-h-[48vh] lg:min-h-[74vh]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.08),transparent_56%)]" />
              <div className="hero-spline-mask absolute -inset-x-4 -inset-y-3 z-0 overflow-hidden sm:-inset-x-6 lg:-inset-x-10 lg:-inset-y-6">
                <SplineScene
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="h-full w-full"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_18%,rgba(3,6,10,0.1)_62%,rgba(3,6,10,0.28)_100%)]" />
            </div>
          </div>

        </div>
      </section>

      <section className="relative z-10 border-t border-white/5 bg-[#070b10] py-12 md:py-14">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4 backdrop-blur-lg sm:col-span-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                What GigShield Is
              </p>
              <p className="mt-3 text-base font-semibold leading-7 text-white">
                GigShield is a weekly income protection product for delivery workers.
                If rain, AQI, or platform disruption reduces working hours, GigShield
                helps protect lost earnings automatically.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-300">
                Weekly Pricing
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                ₹79 to ₹179
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Designed around the weekly cash cycle of gig workers, not
                monthly insurance billing.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-300">
                Coverage Scope
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                Income Loss Only
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Strictly excludes health, life, accidents, and vehicle repair expenses.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
                Standout Feature
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                Income Radar
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Hyperlocal shift advice predicts safer earning windows and risky zones before disruption fully hits.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/5 bg-[#06090d] py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-200">
              Particle Signal Layer
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
              GigShield&apos;s dynamic brand canvas now sits right after the hero.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
              This keeps the hero free for the next visual direction while preserving the
              particle effect as a premium storytelling section in the landing flow.
            </p>
          </div>

          <ParticleTextEffect
            words={["GIGSHIELD", "WEEKLY", "PROTECTED", "INCOME", "RADAR"]}
          />
        </div>
      </section>

      <section className="relative z-10 border-t border-white/5 bg-black/30 py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-200">
                Understand GigShield
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                A safety net for lost delivery income.
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                GigShield is built for riders working on platforms like Zomato,
                Swiggy, Blinkit, and similar gig networks. Workers buy a small
                weekly plan, GigShield watches for disruption signals, and
                support can be triggered automatically when earning ability is
                affected.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-white px-5 text-zinc-950 hover:bg-zinc-200"
                >
                  <Link to="/product">See How It Works</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 text-white hover:bg-white/10"
                >
                  <Link to="/pricing">View Weekly Plans</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200">
                  For Who
                </p>
                <p className="mt-3 text-lg font-bold text-white">
                  Delivery workers
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Built for food delivery, quick-commerce, and last-mile gig riders.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-200">
                  What It Covers
                </p>
                <p className="mt-3 text-lg font-bold text-white">
                  Income loss only
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Covers lost earning windows caused by verified disruption events.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-200">
                  What It Does Not Cover
                </p>
                <p className="mt-3 text-lg font-bold text-white">
                  Not general insurance
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  No health, life, accident, or vehicle repair coverage.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-gradient-to-r from-cyan-300/10 via-white/[0.05] to-emerald-300/10 p-6 backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                  Step 1
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  Pick a weekly plan
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Choose protection that matches the rider&apos;s weekly cash cycle.
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                  Step 2
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  Monitor disruption automatically
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  GigShield watches rain, AQI, outage, and disruption signals in real time.
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                  Step 3
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  Protect earnings fast
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  If a covered trigger hits, validation runs and payout support can begin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/5 bg-zinc-950/60 py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                What GigShield Tracks
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">
                Real-time disruption signals, AI risk posture, and payout
                readiness for delivery workers operating in high-volatility cities.
              </p>
            </div>
            <Link
              to="/product"
              className="hidden text-sm text-zinc-300 duration-150 hover:text-white md:block"
            >
              Explore product
              <ChevronRight className="ml-1 inline-block size-4" />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
            {credibilityItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-white/[0.06]"
              >
                <item.icon className="mx-auto size-5 text-cyan-300" />
                <p className="mt-3 text-sm font-medium text-zinc-200">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">
              Plain And Simple
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-lg font-semibold leading-8 text-white">
              GigShield helps delivery workers avoid or recover income loss caused by
              weather, pollution, and platform disruption.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-300">
              It is a focused weekly protection product for gig workers, not a general
              insurance platform.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

