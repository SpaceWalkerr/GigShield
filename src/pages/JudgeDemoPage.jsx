import { Link, useNavigate } from "react-router-dom";
import { Compass, Radar, CloudRain, Wallet, ShieldCheck } from "lucide-react";
import {
  MarketingPageShell,
  MarketingSection,
  SurfaceCard,
} from "@/components/ui/marketing-page-shell";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage.jsx";
import { saveSession } from "../utils/session";
import userProfile from "../data/userProfile.json";
import planDetails from "../data/planDetails.json";
import { calculateWeeklyPremium } from "../utils/pricing";

const demoSteps = [
  {
    step: "01",
    title: "Start with the rider problem",
    detail:
      "Explain that delivery workers can lose weekly income when rain, AQI, or platform outages cut active earning hours.",
    to: "/product",
    cta: "Open product overview",
    icon: Compass,
  },
  {
    step: "02",
    title: "Show the standout feature",
    detail:
      "Open Income Radar to show how GigShield predicts safer earning zones and helps workers avoid loss before disruption fully hits.",
    to: "/income-radar",
    cta: "Open Income Radar",
    icon: Radar,
  },
  {
    step: "03",
    title: "Trigger the disruption story",
    detail:
      "Move into the live demo and simulate a weather, AQI, or outage event to show parametric automation in action.",
    to: "/dashboard",
    cta: "Open live dashboard",
    icon: CloudRain,
  },
  {
    step: "04",
    title: "Show automated payout",
    detail:
      "Walk through the payout flow to demonstrate that support can move without claim paperwork once rules and caps are satisfied.",
    to: "/payout",
    cta: "Open payout flow",
    icon: Wallet,
  },
  {
    step: "05",
    title: "Close with trust and controls",
    detail:
      "Show fraud validation, payout integrity, and admin visibility so judges see this is not just flashy, but operationally credible.",
    to: "/admin-ops",
    cta: "Open admin view",
    icon: ShieldCheck,
  },
];
export default function JudgeDemoPage({ setSession }) {
  const navigate = useNavigate();
  const { languageMode } = useSiteLanguage();

  const handleLiveDemoAccess = (e, path) => {
    e.preventDefault();
    // Automatically create a demo session for judges to bypass the login wall
    const selectedPlan = planDetails[0];
    const premiumData = calculateWeeklyPremium({
      basePremium: selectedPlan.weeklyPremium,
      platformCount: 2,
      riskLevel: "Medium",
    });

    const demoSession = {
      isAuthenticated: true,
      mode: "demo",
      name: userProfile.name,
      email: "demo@gigshield.app",
      city: userProfile.city,
      workerId: "demo-worker",
      platforms: ["Zomato", "Swiggy"],
      selectedPlanId: selectedPlan.id,
      riskLevel: "Medium",
      calculatedWeeklyPremium: premiumData.adjustedPremium,
      premiumBreakdown: premiumData,
      premiumHistory: [],
      signedInAt: new Date().toISOString(),
    };

    saveSession(demoSession);
    if (setSession) setSession(demoSession);

    navigate(path || "/dashboard");
  };

  return (
    <MarketingPageShell
      eyebrow={selectLabel(languageMode, "Judge Demo Mode", "जज डेमो मोड")}
      title={selectLabel(languageMode, "A guided 60-second story", "60-सेकंड गाइडेड स्टोरी")}
      highlight={selectLabel(languageMode, "for GigShield.", "GigShield के लिए।")}
      description={selectLabel(
        languageMode,
        "This page is the fastest way to present GigShield clearly. It gives judges a simple sequence: rider risk, predictive guidance, trigger automation, payout proof, and fraud-aware operations.",
        "यह पेज GigShield को जल्दी और स्पष्ट रूप से दिखाने का सबसे अच्छा तरीका है। इसमें जज के लिए सरल क्रम है: राइडर जोखिम, प्रिडिक्टिव गाइडेंस, ट्रिगर ऑटोमेशन, भुगतान प्रमाण और फ्रॉड-अवेयर ऑपरेशंस।",
      )}
      primaryAction={{ to: "/income-radar", label: selectLabel(languageMode, "Start With Income Radar", "इनकम रडार से शुरू करें") }}
      secondaryAction={{ 
        onClick: (e) => handleLiveDemoAccess(e, "/dashboard"),
        label: selectLabel(languageMode, "Jump To Live Demo", "लाइव डेमो खोलें") 
      }}
      stats={[
        { label: "Narrative", value: "5 steps", detail: "A tight flow for demo day instead of random page hopping." },
        { label: "Standout", value: "Income Radar", detail: "Lead with the strongest differentiator first." },
        { label: "Automation", value: "Parametric", detail: "Triggers and payouts show the core insurance logic." },
        { label: "Trust", value: "Fraud-aware", detail: "Close with verification and admin control." },
      ]}
    >
      <MarketingSection title={selectLabel(languageMode, "The recommended demo sequence", "सुझाया गया डेमो सीक्वेंस")} caption="Walkthrough">
        <div className="grid gap-4 lg:grid-cols-5">
          {demoSteps.map((item) => {
            const Icon = item.icon;
            return (
              <SurfaceCard key={item.step} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    Step {item.step}
                  </span>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-zinc-300">{item.detail}</p>
                <button
                  onClick={(e) => handleLiveDemoAccess(e, item.to)}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.08]"
                >
                  {item.cta}
                </button>
              </SurfaceCard>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "What to say while presenting", "प्रेजेंट करते समय क्या कहना है")} caption="Script assist">
        <div className="grid gap-4 lg:grid-cols-3">
          <SurfaceCard>
            <h3 className="text-lg font-bold text-white">Opening</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              GigShield protects delivery workers from external disruption-driven income loss using weekly-priced parametric protection.
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <h3 className="text-lg font-bold text-white">Differentiator</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Our strongest feature is Income Radar. It does not only pay after loss. It helps riders move before income falls.
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <h3 className="text-lg font-bold text-white">Close</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              The product stays credible because triggers, payouts, fraud checks, and admin visibility all work together in one system.
            </p>
          </SurfaceCard>
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Best route for judges", "जज के लिए सबसे अच्छा रूट")} caption="Recommended clicks">
        <div className="rounded-[1.75rem] border border-cyan-300/20 bg-cyan-300/10 p-6 backdrop-blur-xl">
          <p className="text-sm leading-8 text-cyan-50/95">
            <span className="font-black text-white">Recommended order:</span>{" "}
            Income Radar page, then the dashboard, then payout flow, then admin view.
            That sequence makes GigShield feel predictive, automated, and trustworthy in under a minute.
          </p>
        </div>
      </MarketingSection>
    </MarketingPageShell>
  );
}

