import React from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { TextEffect } from '@/components/ui/text-effect';

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

const credibilityItems = [
  { icon: CloudRain, label: 'Rain + heat triggers' },
  { icon: Wind, label: 'AQI disruption signals' },
  { icon: WifiOff, label: 'Platform outage checks' },
  { icon: ShieldCheck, label: 'Fraud-guarded payouts' },
  { icon: Wallet, label: 'Weekly-priced cover' },
  { icon: BarChart3, label: 'Worker + admin dashboards' },
  { icon: ScanSearch, label: 'Policy transparency' },
  { icon: Activity, label: 'Predictive risk engine' },
];

export function HeroSection() {
  return (
      <main className="overflow-hidden bg-[#09090b] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#17414a_0%,rgba(9,9,11,0.96)_42%,#09090b_78%)]" />
          <div className="absolute left-[-10%] top-[-8%] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute right-[-12%] top-[12%] h-[30rem] w-[30rem] rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute bottom-[-18%] left-[20%] h-[26rem] w-[26rem] rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <section className="relative z-10">
          <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-28 md:pt-36 lg:px-10 lg:pb-24">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="text-center lg:text-left">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    to="/triggers"
                    className="group mx-auto flex w-fit items-center gap-4 rounded-full border border-white/10 bg-white/5 p-1 pl-4 shadow-md shadow-black/20 backdrop-blur-lg transition-all duration-300 hover:border-cyan-300/25 hover:bg-white/10 lg:mx-0"
                  >
                    <span className="text-sm text-zinc-100">
                      AI-powered weekly protection for delivery workers
                    </span>
                    <span className="block h-4 w-px bg-white/20" />

                    <div className="size-6 overflow-hidden rounded-full bg-white/10 duration-500 group-hover:bg-cyan-300/20">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="mt-8 max-w-4xl lg:mt-14">
                    <TextEffect
                      as="h1"
                      per="word"
                      preset="slide"
                      className="text-balance text-5xl font-black tracking-[-0.06em] text-white md:text-7xl xl:text-[5.15rem]"
                    >
                      Protect every delivery shift from weather, pollution, and platform outages.
                    </TextEffect>
                  </div>

                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-8 text-zinc-300 lg:mx-0">
                    GigShield gives riders a weekly parametric income safety net.
                    When verified city disruptions reduce earning hours, payouts
                    start automatically with fraud checks built in. Income Radar
                    also tells riders where to shift next before earnings fall.
                  </p>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
                >
                  <div className="rounded-[14px] border border-cyan-300/30 bg-cyan-300/10 p-0.5">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl bg-cyan-300 px-5 text-base font-semibold text-zinc-950 hover:bg-cyan-200"
                    >
                      <Link to="/get-protected">
                        <span className="text-nowrap">Get Protected</span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 text-white hover:bg-white/10"
                  >
                    <Link to="/dashboard">
                      <span className="text-nowrap">View Live Demo</span>
                    </Link>
                  </Button>
                </AnimatedGroup>

                <AnimatedGroup
                  preset="blur-slide"
                  className="mt-10 grid gap-3 sm:grid-cols-3"
                >
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
                      Strictly excludes health, life, accidents, and vehicle
                      repair expenses.
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
                      Hyperlocal shift advice predicts safer earning windows and
                      risky zones before disruption fully hits.
                    </p>
                  </div>
                </AnimatedGroup>
              </div>

              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.75,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className="relative"
              >
                <div className="absolute -inset-10 hidden rounded-[2rem] bg-cyan-300/10 blur-3xl lg:block" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
                  <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between rounded-full border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-md">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">
                        Live Monitoring
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        Delhi NCR rider grid
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Active
                    </div>
                  </div>
                  <img
                    className="aspect-[4/5] w-full rounded-[1.4rem] object-cover lg:aspect-[5/6]"
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
                    alt="Delivery operations analytics"
                    width="1200"
                    height="1500"
                  />
                  <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/10 bg-zinc-950/80 p-5 backdrop-blur-xl">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                          Trigger
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">
                          AQI Spike
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          Auto-checking payout eligibility
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                          Risk
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">
                          Medium
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          Weekly price updates with persona risk
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                          Payout
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">
                          Instant
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          Released after validation and caps check
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-200">
                        Income Radar Advice
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        Shift west before 6 PM. AQI drag rises in East NCR after sunset.
                      </p>
                      <p className="mt-1 text-sm text-zinc-300">
                        Coverage stays active if the worker remains in the payout-ready risk window.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedGroup>
            </div>
          </div>
        </section>

        <section className="relative z-10 border-t border-white/5 bg-zinc-950/60 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                  What GigShield Tracks
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">
                  Real-time disruption signals, AI risk posture, and payout
                  readiness for delivery workers operating in high-volatility
                  cities.
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
          </div>
        </section>
      </main>
  );
}
