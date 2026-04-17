import { Link } from "react-router-dom";
import { CloudRain, Wind, WifiOff, MapPinOff, ArrowRight, ChevronRight, Zap, Clock, Shield } from "lucide-react";
import triggerEvents from "../data/triggerEvents.json";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage.jsx";
import {
  MarketingPageShell,
  MarketingSection,
  SurfaceCard,
} from "@/components/ui/marketing-page-shell";

const triggerSources = [
  { icon: <CloudRain className="w-5 h-5" />, name: { en: "Weather signals", hi: "मौसम के संकेत" }, detail: { en: "Heavy rain and heatwave alerts from external weather feeds.", hi: "बाहरी मौसम फ़ीड से भारी बारिश और लू के अलर्ट।" } },
  { icon: <Wind className="w-5 h-5" />, name: { en: "Air quality signals", hi: "AQI संकेत" }, detail: { en: "AQI spike conditions that reduce safe outdoor work.", hi: "AQI बढ़ने की स्थिति जो सुरक्षित बाहरी काम कम करती है।" } },
  { icon: <WifiOff className="w-5 h-5" />, name: { en: "Platform status", hi: "प्लेटफ़ॉर्म स्थिति" }, detail: { en: "Outage or downtime events that stop order flow.", hi: "आउटेज या डाउनटाइम घटनाएँ।" } },
  { icon: <MapPinOff className="w-5 h-5" />, name: { en: "Social disruptions", hi: "सामाजिक व्यवधान" }, detail: { en: "Curfews, local strikes, and zone closures impacting pickups.", hi: "कर्फ्यू, स्थानीय हड़ताल, ज़ोन बंद।" } },
];

const payoutRules = [
  { en: "Trigger must be valid for selected plan", hi: "ट्रिगर योजना के लिए मान्य होना चाहिए", icon: <Shield className="w-4 h-4" /> },
  { en: "Coverage time window must be active", hi: "कवरेज समय विंडो सक्रिय होनी चाहिए", icon: <Clock className="w-4 h-4" /> },
  { en: "Daily payout cap must have remaining balance", hi: "दैनिक भुगतान सीमा में शेष राशि होनी चाहिए", icon: <Zap className="w-4 h-4" /> },
  { en: "High risk may require selfie verification", hi: "अधिक जोखिम पर सेल्फी सत्यापन जरूरी हो सकता है", icon: <Zap className="w-4 h-4" /> },
  { en: "Health, life, accidents, and vehicle repairs are excluded", hi: "स्वास्थ्य, जीवन, दुर्घटना और वाहन मरम्मत शामिल नहीं हैं", icon: <Shield className="w-4 h-4" /> },
];

function TriggerPage() {
  const { languageMode } = useSiteLanguage();

  return (
    <MarketingPageShell
      eyebrow={selectLabel(languageMode, "Trigger System", "ट्रिगर सिस्टम")}
      title={selectLabel(languageMode, "How trigger payouts work", "ट्रिगर भुगतान कैसे काम करते हैं")}
      highlight={selectLabel(languageMode, "in GigShield.", "GigShield में।")}
      description={selectLabel(languageMode, "A trigger is a verified disruption event. GigShield checks weekly plan rules, policy boundaries, caps, and risk controls before support is released.", "GigShield साप्ताहिक योजना, पॉलिसी सीमा, कैप और जोखिम नियंत्रण की जांच करके भुगतान जारी करता है।")}
      primaryAction={{ to: "/dashboard", label: selectLabel(languageMode, "Open Trigger View", "ट्रिगर व्यू खोलें") }}
      secondaryAction={{ to: "/pricing", label: selectLabel(languageMode, "See Plans", "योजनाएं देखें") }}
      stats={[
        { label: "Monitoring", value: "Real-time", detail: "Weather, AQI, outage, and social disruption signals." },
        { label: "Claims", value: "Automatic", detail: "No manual proof of individual damage is needed." },
        { label: "Rules", value: "Policy-aware", detail: "Coverage hours, daily caps, and exclusions are enforced." },
        { label: "Goal", value: "Instant support", detail: "Fast income protection when earning hours collapse." },
      ]}
    >
      <MarketingSection title={selectLabel(languageMode, "Where trigger signals come from", "ट्रिगर सिग्नल कहाँ से आते हैं")} caption="Sources">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {triggerSources.map((s, i) => (
            <SurfaceCard key={i}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">{s.icon}</div>
              <h3 className="mt-4 text-base font-bold text-white">{selectLabel(languageMode, s.name.en, s.name.hi)}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{selectLabel(languageMode, s.detail.en, s.detail.hi)}</p>
            </SurfaceCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Why parametric logic matters", "पैरामेट्रिक लॉजिक क्यों ज़रूरी है")} caption="Logic">
        <div className="grid gap-6 lg:grid-cols-2">
          <SurfaceCard>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
              {selectLabel(languageMode, "Parametric Logic", "पैरामेट्रिक लॉजिक")}
            </p>
            <p className="text-sm leading-7 text-zinc-300">
              {selectLabel(
                languageMode,
                "Workers do not have to prove individual damage. GigShield uses verified external signals like rainfall, AQI, and outage data to trigger payouts automatically.",
                "वर्कर्स को व्यक्तिगत नुकसान साबित नहीं करना पड़ता। GigShield बारिश, AQI और आउटेज जैसे सत्यापित बाहरी सिग्नल से अपने आप भुगतान ट्रिगर करता है।",
              )}
            </p>
          </SurfaceCard>
          <SurfaceCard className="border-amber-300/20 bg-amber-300/10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 mb-3">
              {selectLabel(languageMode, "Strict Exclusions", "सख्त बहिष्करण")}
            </p>
            <p className="text-sm leading-7 text-amber-50/90">
              {selectLabel(
                languageMode,
                "This product is only for income loss caused by external disruptions. It never pays for health treatment, life cover, accidents, or vehicle repair expenses.",
                "यह उत्पाद केवल बाहरी व्यवधानों से हुई आय हानि के लिए है। यह स्वास्थ्य इलाज, जीवन कवर, दुर्घटना या वाहन मरम्मत खर्च के लिए कभी भुगतान नहीं करता।",
              )}
            </p>
          </SurfaceCard>
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Available trigger payouts", "उपलब्ध ट्रिगर भुगतान")} caption="Trigger matrix">
        <div className="overflow-x-auto rounded-[1.75rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-white/10">
              <tr>
                {[selectLabel(languageMode, "Trigger", "ट्रिगर"), "Basic", "Standard", "Pro"].map(h => (
                  <th key={h} className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {triggerEvents.map((event, i) => (
                <tr key={event.id} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                  <td className="px-5 py-4 font-semibold text-white">{event.label}</td>
                  <td className="px-5 py-4 text-zinc-300">{formatCurrency(event.payoutByPlan.basic)}</td>
                  <td className="px-5 py-4 text-zinc-300">{formatCurrency(event.payoutByPlan.standard)}</td>
                  <td className="px-5 py-4 text-zinc-300">{formatCurrency(event.payoutByPlan.pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Payout decision rules", "भुगतान निर्णय नियम")} caption="Rules">
        <div className="space-y-1">
          {payoutRules.map((r, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-white/8 py-4 last:border-0">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/8 text-cyan-300 flex-shrink-0">{r.icon}</div>
              <p className="text-sm font-medium text-zinc-200">{selectLabel(languageMode, r.en, r.hi)}</p>
              <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 text-zinc-500" />
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Explore trigger behavior", "ट्रिगर व्यवहार देखें")} caption="Automation">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {triggerEvents.map(event => (
            <Link key={event.id} to={`/dashboard?plan=standard&trigger=${event.id}`}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
              <span>{selectLabel(languageMode, event.label, event.label)}</span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-300 transition" />
            </Link>
          ))}
        </div>
      </MarketingSection>
    </MarketingPageShell>
  );
}

export default TriggerPage;

