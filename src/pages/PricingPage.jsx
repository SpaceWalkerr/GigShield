import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import planDetails from "../data/planDetails.json";
import { formatCurrency } from "../utils/format";
import { calculateWeeklyPremium, supportedRiskLevels } from "../utils/pricing";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";
import {
  MarketingPageShell,
  MarketingSection,
  SurfaceCard,
} from "@/components/ui/marketing-page-shell";

const planHighlights = {
  basic: [
    { en: "Rain and AQI trigger payouts", hi: "बारिश और AQI ट्रिगर भुगतान" },
    { en: "Daily payout cap: ₹300", hi: "दैनिक भुगतान सीमा: ₹300" },
    { en: "Email support", hi: "ईमेल सहायता" },
  ],
  standard: [
    { en: "All weather and outage triggers", hi: "सभी मौसम और आउटेज ट्रिगर्स" },
    { en: "Daily payout cap: ₹650", hi: "दैनिक भुगतान सीमा: ₹650" },
    { en: "Priority support", hi: "प्राथमिक सहायता" },
  ],
  pro: [
    { en: "24x7 trigger coverage", hi: "24x7 ट्रिगर कवरेज" },
    { en: "Daily payout cap: ₹1,000", hi: "दैनिक भुगतान सीमा: ₹1,000" },
    { en: "Fast-track verification", hi: "फास्ट-ट्रैक सत्यापन" },
    { en: "Priority payout support", hi: "प्राथमिक भुगतान सहायता" },
  ],
};

const faqs = [
  { q: { en: "What billing cycle is used?", hi: "बिलिंग चक्र क्या है?" }, a: { en: "Weekly, auto-renewable. Cancel anytime.", hi: "साप्ताहिक, स्वतः नवीनीकरण। कभी भी रद्द करें।" } },
  { q: { en: "What triggers are covered?", hi: "कौन से ट्रिगर कवर हैं?" }, a: { en: "Rain, heatwave, AQI spike, and platform outages.", hi: "बारिश, भीषण गर्मी, AQI और प्लेटफ़ॉर्म आउटेज।" } },
  { q: { en: "How fast is a payout?", hi: "भुगतान कितना जल्दी होता है?" }, a: { en: "Instant after trigger verification completes.", hi: "ट्रिगर सत्यापन के बाद तुरंत।" } },
  { q: { en: "What is not covered?", hi: "क्या कवर नहीं है?" }, a: { en: "Health, life, accidents, and vehicle repairs are strictly excluded.", hi: "स्वास्थ्य, जीवन, दुर्घटना और वाहन मरम्मत सख्ती से बाहर हैं।" } },
  { q: { en: "Which platforms are supported?", hi: "कौन से प्लेटफॉर्म समर्थित हैं?" }, a: { en: "Zomato, Swiggy, Blinkit, Zepto.", hi: "Zomato, Swiggy, Blinkit, Zepto।" } },
];

function PricingPage() {
  const [platformCount, setPlatformCount] = useState(2);
  const [riskLevel, setRiskLevel] = useState("Medium");
  const { languageMode } = useSiteLanguage();
  return (
    <MarketingPageShell
      eyebrow={selectLabel(languageMode, "Plans and Pricing", "योजनाएं और कीमत")}
      title={selectLabel(languageMode, "Pick your protection level", "अपनी सुरक्षा योजना चुनें")}
      highlight=""
      description={selectLabel(languageMode, "Every plan includes weekly-priced parametric payouts for major disruptions. Scale protection based on work hours, platform count, and risk appetite.", "हर योजना में साप्ताहिक पैरामेट्रिक भुगतान शामिल है और सुरक्षा काम के घंटों और जोखिम के अनुसार बढ़ती है।")}
      primaryAction={{ to: "/get-protected", label: selectLabel(languageMode, "Start Weekly Cover", "साप्ताहिक कवर शुरू करें") }}
      secondaryAction={{ to: "/product", label: selectLabel(languageMode, "See Product", "उत्पाद देखें") }}
      stats={[
        { label: "Basic", value: "₹79", detail: "Entry weekly protection for riders with lower exposure." },
        { label: "Standard", value: "₹129", detail: "Balanced weekly plan for most active urban riders." },
        { label: "Pro", value: "₹179", detail: "24x7 higher-cap cover for heavy weekly exposure." },
        { label: "Model", value: "Weekly", detail: "Aligned with weekly rider cash flow, not monthly billing." },
      ]}
    >
      <MarketingSection title={selectLabel(languageMode, "Dynamic weekly premium calculator", "डायनेमिक साप्ताहिक प्रीमियम कैलकुलेटर")} caption="Pricing engine">
        <SurfaceCard>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-5">{selectLabel(languageMode, "Adjust Premium Estimate", "प्रीमियम अनुमान बदलें")}</p>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">{selectLabel(languageMode, "Linked platforms", "जुड़े प्लेटफॉर्म")}: <span className="text-[#1a2229]">{platformCount}</span></p>
              <input type="range" min="1" max="6" value={platformCount} onChange={e => setPlatformCount(Number(e.target.value))} className="w-full accent-[#1a2229]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">{selectLabel(languageMode, "Risk level", "जोखिम स्तर")}</p>
              <div className="flex gap-2">
                {supportedRiskLevels.map(l => (
                  <button key={l} type="button" onClick={() => setRiskLevel(l)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${riskLevel === l ? "bg-[#1a2229] text-white" : "border border-gray-200 bg-white/80 text-gray-700 hover:bg-white"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SurfaceCard>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Why weekly pricing fits the worker", "साप्ताहिक कीमत वर्कर के लिए क्यों सही है")} caption="Pricing rationale">
        <SurfaceCard>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
            {selectLabel(languageMode, "Why Weekly Pricing", "साप्ताहिक कीमत क्यों")}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {selectLabel(
              languageMode,
              "Gig workers usually manage cash flow weekly, so GigShield prices cover on the same weekly rhythm as their earning and withdrawal cycle.",
              "गिग वर्कर्स आमतौर पर अपनी नकदी प्रवाह साप्ताहिक आधार पर संभालते हैं, इसलिए GigShield की कीमत भी उनकी कमाई और निकासी चक्र के उसी साप्ताहिक रिदम पर रखी गई है।",
            )}
          </p>
        </SurfaceCard>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Choose your weekly plan", "अपनी साप्ताहिक योजना चुनें")} caption="Plans">
        <div className="grid lg:grid-cols-3 gap-6">
          {planDetails.map(plan => {
            const isRec = plan.id === "standard";
            const highlights = planHighlights[plan.id] ?? [];
            const premium = calculateWeeklyPremium({ basePremium: plan.weeklyPremium, platformCount, riskLevel });
            return (
              <div key={plan.id} className={`relative rounded-3xl p-7 border transition ${isRec ? "bg-[#1a2229] border-[#1a2229] shadow-2xl scale-[1.02]" : "bg-white/70 border-white/60 backdrop-blur-sm shadow-sm hover:shadow-md"}`}>
                {isRec && (
                  <span className="absolute -top-3 left-6 rounded-full bg-[#f4cf3f] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1a2229]">
                    {selectLabel(languageMode, "Recommended", "सुझाई गई")}
                  </span>
                )}
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isRec ? "text-gray-400" : "text-gray-500"}`}>{selectLabel(languageMode, "Weekly Plan", "साप्ताहिक योजना")}</p>
                <h2 className={`mt-2 text-3xl font-bold tracking-tight ${isRec ? "text-white" : "text-gray-900"}`}>{plan.name}</h2>
                <p className={`mt-5 text-4xl font-extrabold tracking-tight ${isRec ? "text-white" : "text-gray-900"}`}>{formatCurrency(premium.adjustedPremium)}</p>
                <p className={`text-xs mt-1 ${isRec ? "text-gray-400" : "text-gray-500"}`}>{selectLabel(languageMode, "per week", "प्रति सप्ताह")} · {plan.coverageHours}</p>

                <ul className="mt-6 space-y-3">
                  {highlights.map(h => (
                    <li key={h.en} className={`flex items-center gap-2.5 text-sm ${isRec ? "text-gray-300" : "text-gray-700"}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 ${isRec ? "text-[#f4cf3f]" : "text-[#1a2229]"}`} />
                      {selectLabel(languageMode, h.en, h.hi)}
                    </li>
                  ))}
                </ul>

                <Link to={`/signup?plan=${plan.id}&risk=${riskLevel}&platforms=${platformCount}`}
                  className={`mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isRec ? "bg-white text-[#1a2229] hover:bg-gray-100" : "bg-[#1a2229] text-white hover:bg-gray-800"}`}>
                  {selectLabel(languageMode, "Choose", "चुनें")} {plan.name} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Common questions", "सामान्य प्रश्न")} caption="FAQ">
        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
          {faqs.map((f, i) => (
            <div key={i}>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#1a2229] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">Q</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectLabel(languageMode, f.q.en, f.q.hi)}</p>
                  <p className="mt-1 text-sm text-gray-600">{selectLabel(languageMode, f.a.en, f.a.hi)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </MarketingSection>
    </MarketingPageShell>
  );
}

export default PricingPage;
