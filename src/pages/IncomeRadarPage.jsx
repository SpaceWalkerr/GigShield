import { useEffect, useMemo, useState } from "react";
import { Radar, Route, ShieldCheck, MapPinned } from "lucide-react";
import IncomeRadarPanel from "../components/IncomeRadarPanel";
import {
  MarketingPageShell,
  MarketingSection,
  SurfaceCard,
} from "@/components/ui/marketing-page-shell";
import { buildIncomeRadar } from "../utils/incomeRadar";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage.jsx";
import { fetchLatestIncomeRadarSnapshot } from "../services/backend/incomeRadarService";

const cityOptions = ["New Delhi", "Mumbai", "Bengaluru"];

export default function IncomeRadarPage() {
  const { languageMode } = useSiteLanguage();
  const [selectedCity, setSelectedCity] = useState("New Delhi");
  const [backendRadar, setBackendRadar] = useState(null);

  const localRadar = useMemo(
    () =>
      buildIncomeRadar({
        city: selectedCity,
        riskLevel: "Medium",
        platformCount: 3,
      }),
    [selectedCity],
  );

  useEffect(() => {
    let alive = true;

    const hydrateRadar = async () => {
      const next = await fetchLatestIncomeRadarSnapshot({ city: selectedCity });
      if (!alive) {
        return;
      }
      setBackendRadar(next);
    };

    hydrateRadar();

    return () => {
      alive = false;
    };
  }, [selectedCity]);

  const radar = backendRadar || localRadar;

  return (
    <MarketingPageShell
      eyebrow={selectLabel(languageMode, "Signature Feature", "सिग्नेचर फीचर")}
      title={selectLabel(languageMode, "Income Radar", "इनकम रडार")}
      highlight={selectLabel(languageMode, "for delivery workers.", "डिलीवरी वर्कर्स के लिए।")}
      description={selectLabel(
        languageMode,
        "Income Radar predicts safer earning zones, risky pockets, and the next best shift move before disruption fully hurts worker income.",
        "इनकम रडार सुरक्षित कमाई ज़ोन, जोखिम वाले क्षेत्र और अगली बेहतर शिफ्ट मूव का अनुमान लगाता है, इससे पहले कि व्यवधान आय को नुकसान पहुंचाए।",
      )}
      primaryAction={{ to: "/dashboard", label: selectLabel(languageMode, "Open Dashboard", "डैशबोर्ड खोलें") }}
      secondaryAction={{ to: "/get-protected", label: selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें") }}
      stats={[
        { label: "Purpose", value: "Avoid loss first", detail: "GigShield helps workers move before income drops." },
        { label: "Signals", value: "Hyperlocal", detail: "Zone risk, earning windows, and disruption pressure." },
        { label: "Protection", value: "Payout-ready", detail: "Coverage timing stays connected to risky windows." },
        { label: "Outcome", value: "Actionable", detail: "Workers get a real next move, not just a score." },
      ]}
    >
      <MarketingSection title={selectLabel(languageMode, "How this feature helps workers", "यह फीचर वर्कर्स की कैसे मदद करता है")} caption="Quick guidance" className="mt-0">
        <div className="rounded-[1.75rem] border border-cyan-300/20 bg-cyan-300/10 p-6 backdrop-blur-xl">
          <p className="text-sm leading-8 text-cyan-50/95">
            Income Radar helps a worker act before earnings are hit. It turns weather, AQI, and disruption signals
            into practical guidance on safer zones, better timing, and when payout-ready protection matters most.
          </p>
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Explore the radar by city", "शहर के अनुसार रडार देखें")} caption="Interactive preview">
        <div className="mb-6 flex flex-wrap gap-3">
          {cityOptions.map((city) => {
            const active = city === selectedCity;
            return (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition ${
                  active
                    ? "bg-cyan-300 text-zinc-950"
                    : "border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
        <IncomeRadarPanel radar={radar} />
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Why this feature stands out", "यह फीचर अलग क्यों है")} caption="Differentiation">
        <div className="grid gap-4 md:grid-cols-3">
          <SurfaceCard>
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">
              <Radar className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Predictive movement</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              Income Radar tells a rider where to move next, not just whether a claim may happen later.
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">
              <MapPinned className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Zone intelligence</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              It translates weather, AQI, and outage pressure into hyperlocal earning advice.
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Protection timing</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              Workers know when to rely on safer routing and when payout-ready protection becomes most important.
            </p>
          </SurfaceCard>
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "How the workflow unfolds", "वर्कफ़्लो कैसे आगे बढ़ता है")} caption="Protection flow">
        <div className="grid gap-4 md:grid-cols-3">
          <SurfaceCard>
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">
              <MapPinned className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">1. Risk builds</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-300">{radar.demoStory.setup}</p>
          </SurfaceCard>
          <SurfaceCard>
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">
              <Route className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">2. Rider reroutes</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-300">{radar.demoStory.move}</p>
          </SurfaceCard>
          <SurfaceCard>
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">3. Protection still holds</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-300">{radar.demoStory.fallback}</p>
          </SurfaceCard>
        </div>
      </MarketingSection>
    </MarketingPageShell>
  );
}

