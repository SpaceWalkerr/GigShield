import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import planDetails from "../data/planDetails.json";
import { formatCurrency } from "../utils/format";
import { calculateWeeklyPremium, supportedRiskLevels } from "../utils/pricing";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage.jsx";
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
        <SurfaceCard className="overflow-hidden p-0">
          <div className="border-b border-white/8 px-6 py-5 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">{selectLabel(languageMode, "Adjust Premium Estimate", "प्रीमियम अनुमान बदलें")}</p>
            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
              {selectLabel(
                languageMode,
                "Use this to see how weekly price changes based on platform count and disruption exposure. The final plan is still built weekly, not monthly.",
                "इसे बदलकर देखें कि प्लेटफॉर्म संख्या और जोखिम के आधार पर साप्ताहिक कीमत कैसे बदलती है। अंतिम योजना साप्ताहिक ही रहती है, मासिक नहीं।",
              )}
            </p>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                  {selectLabel(languageMode, "Linked platforms", "जुड़े प्लेटफॉर्म")}
                </p>
                <p className="mb-4 text-3xl font-black tracking-tight text-white">{platformCount}</p>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={platformCount}
                  onChange={e => setPlatformCount(Number(e.target.value))}
                  className="w-full accent-cyan-300"
                />
                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  {selectLabel(languageMode, "More linked platforms can increase weekly disruption exposure.", "अधिक जुड़े प्लेटफॉर्म साप्ताहिक जोखिम बढ़ा सकते हैं।")}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                  {selectLabel(languageMode, "Risk level", "जोखिम स्तर")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {supportedRiskLevels.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setRiskLevel(l)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        riskLevel === l
                          ? "bg-cyan-300 text-slate-950"
                          : "border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  {selectLabel(languageMode, "Risk reflects local disruption intensity and working pattern.", "जोखिम स्थानीय व्यवधान और काम के पैटर्न को दर्शाता है।")}
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-cyan-300/15 bg-cyan-300/8 p-6 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                {selectLabel(languageMode, "Current premium signal", "वर्तमान प्रीमियम संकेत")}
              </p>
              <p className="mt-3 text-4xl font-black tracking-tight text-white">
                {formatCurrency(
                  calculateWeeklyPremium({
                    basePremium: planDetails.find((plan) => plan.id === "standard")?.weeklyPremium ?? 129,
                    platformCount,
                    riskLevel,
                  }).adjustedPremium,
                )}
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-300">
                {selectLabel(languageMode, "Estimated weekly price for the Standard plan under this setup.", "इस सेटअप के लिए Standard योजना की अनुमानित साप्ताहिक कीमत।")}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    {selectLabel(languageMode, "Model", "मॉडल")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {selectLabel(languageMode, "Weekly pricing", "साप्ताहिक कीमत")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    {selectLabel(languageMode, "Coverage type", "कवरेज प्रकार")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {selectLabel(languageMode, "Income loss only", "सिर्फ आय हानि")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Why weekly pricing fits the worker", "साप्ताहिक कीमत वर्कर के लिए क्यों सही है")} caption="Pricing rationale">
        <SurfaceCard className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">
              {selectLabel(languageMode, "Why Weekly Pricing", "साप्ताहिक कीमत क्यों")}
            </p>
            <p className="text-sm leading-7 text-zinc-300">
              {selectLabel(
                languageMode,
                "Gig workers usually manage cash flow weekly, so GigShield prices cover on the same weekly rhythm as their earning and withdrawal cycle.",
                "गिग वर्कर्स आमतौर पर अपनी नकदी प्रवाह साप्ताहिक आधार पर संभालते हैं, इसलिए GigShield की कीमत भी उनकी कमाई और निकासी चक्र के उसी साप्ताहिक रिदम पर रखी गई है।",
              )}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: selectLabel(languageMode, "Matches earnings rhythm", "कमाई के चक्र से मेल"),
                detail: selectLabel(languageMode, "Workers think in weekly payouts, not monthly policy cycles.", "वर्कर साप्ताहिक भुगतान के हिसाब से सोचते हैं, मासिक नहीं।"),
              },
              {
                label: selectLabel(languageMode, "Easier to activate", "सक्रिय करना आसान"),
                detail: selectLabel(languageMode, "Lower commitment and easier entry for platform workers.", "प्लेटफॉर्म वर्कर्स के लिए कम प्रतिबद्धता और आसान शुरुआत।"),
              },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-2 text-xs leading-6 text-zinc-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Choose your weekly plan", "अपनी साप्ताहिक योजना चुनें")} caption="Plans">
        <div className="grid lg:grid-cols-3 gap-6">
          {planDetails.map(plan => {
            const isRec = plan.id === "standard";
            const highlights = planHighlights[plan.id] ?? [];
            const premium = calculateWeeklyPremium({ basePremium: plan.weeklyPremium, platformCount, riskLevel });
            return (
              <div
                key={plan.id}
                className={`relative rounded-[1.9rem] border p-7 transition ${
                  isRec
                    ? "scale-[1.02] border-cyan-300/30 bg-slate-950/80 shadow-[0_24px_80px_-32px_rgba(34,211,238,0.35)]"
                    : "border-white/10 bg-white/[0.04] backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                {isRec && (
                  <span className="absolute -top-3 left-6 rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-950">
                    {selectLabel(languageMode, "Recommended", "सुझाई गई")}
                  </span>
                )}
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isRec ? "text-cyan-200/70" : "text-zinc-500"}`}>
                  {selectLabel(languageMode, "Weekly Plan", "साप्ताहिक योजना")}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">{plan.name}</h2>
                <p className="mt-5 text-4xl font-extrabold tracking-tight text-white">{formatCurrency(premium.adjustedPremium)}</p>
                <p className={`mt-1 text-xs ${isRec ? "text-zinc-400" : "text-zinc-500"}`}>
                  {selectLabel(languageMode, "per week", "प्रति सप्ताह")} · {plan.coverageHours}
                </p>

                <div className={`mt-5 rounded-2xl border px-4 py-4 ${isRec ? "border-white/10 bg-white/[0.04]" : "border-white/8 bg-slate-950/35"}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    {selectLabel(languageMode, "Best for", "उपयुक्त")}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-zinc-300">
                    {plan.id === "basic"
                      ? selectLabel(languageMode, "Lower weekly exposure and selective trigger cover.", "कम साप्ताहिक जोखिम और चयनित ट्रिगर कवर।")
                      : plan.id === "standard"
                        ? selectLabel(languageMode, "Most active urban riders who need balanced weekly protection.", "अधिकांश सक्रिय शहरी राइडर्स के लिए संतुलित साप्ताहिक सुरक्षा।")
                        : selectLabel(languageMode, "Heavy exposure riders who want broader hours and stronger payout support.", "उच्च जोखिम वाले राइडर्स के लिए अधिक घंटे और मजबूत भुगतान सहायता।")}
                  </p>
                </div>

                <ul className="mt-6 space-y-3">
                  {highlights.map(h => (
                    <li key={h.en} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <Check className={`h-4 w-4 flex-shrink-0 ${isRec ? "text-cyan-300" : "text-zinc-200"}`} />
                      {selectLabel(languageMode, h.en, h.hi)}
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/signup?plan=${plan.id}&risk=${riskLevel}&platforms=${platformCount}`}
                  className={`mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isRec
                      ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                      : "border border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.1]"
                  }`}
                >
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
            <div key={i} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-300 text-[10px] font-bold text-slate-950">Q</div>
                <div>
                  <p className="text-sm font-bold text-white">{selectLabel(languageMode, f.q.en, f.q.hi)}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">{selectLabel(languageMode, f.a.en, f.a.hi)}</p>
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

