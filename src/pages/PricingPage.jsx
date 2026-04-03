import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Check, Zap, ShieldCheck, Clock } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
import planDetails from "../data/planDetails.json";
import { formatCurrency } from "../utils/format";
import { calculateWeeklyPremium, supportedRiskLevels } from "../utils/pricing";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

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
    { en: "Dedicated claims concierge", hi: "समर्पित क्लेम सहायता" },
  ],
};

const faqs = [
  { q: { en: "What billing cycle is used?", hi: "बिलिंग चक्र क्या है?" }, a: { en: "Weekly, auto-renewable. Cancel anytime.", hi: "साप्ताहिक, स्वतः नवीनीकरण। कभी भी रद्द करें।" } },
  { q: { en: "What triggers are covered?", hi: "कौन से ट्रिगर कवर हैं?" }, a: { en: "Rain, heatwave, AQI spike, and platform outages.", hi: "बारिश, भीषण गर्मी, AQI और प्लेटफ़ॉर्म आउटेज।" } },
  { q: { en: "How fast is a payout?", hi: "भुगतान कितना जल्दी होता है?" }, a: { en: "Instant after trigger verification completes.", hi: "ट्रिगर सत्यापन के बाद तुरंत।" } },
  { q: { en: "Which platforms are supported?", hi: "कौन से प्लेटफॉर्म समर्थित हैं?" }, a: { en: "Zomato, Swiggy, Blinkit, Zepto.", hi: "Zomato, Swiggy, Blinkit, Zepto।" } },
];

function PricingPage() {
  const [platformCount, setPlatformCount] = useState(2);
  const [riskLevel, setRiskLevel] = useState("Medium");
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">


      {/* Hero */}
      <section className="px-6 py-20 sm:px-12 lg:px-24 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">{selectLabel(languageMode, "Plans and Pricing", "योजनाएं और कीमत")}</p>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
          {selectLabel(languageMode, "Pick your", "चुनें अपनी")}<br />
          <span className="text-gray-400">{selectLabel(languageMode, "protection level.", "सुरक्षा योजना।")}</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
          {selectLabel(languageMode, "Every plan includes parametric payouts for major disruptions. Scale coverage based on work hours and risk appetite.", "हर योजना में बड़े व्यवधानों के लिए भुगतान शामिल है।")}
        </p>
      </section>

      {/* Calculator */}
      <section className="px-6 sm:px-12 lg:px-24 pb-12 max-w-6xl mx-auto">
        <div className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-sm">
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
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
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
      </section>

      {/* FAQ */}
      <section className="px-6 sm:px-12 lg:px-24 pb-24 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "Common Questions", "सामान्य प्रश्न")}</p>
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
      </section>

      {/* CTA */}
      <section className="bg-[#1a2229] mx-6 sm:mx-12 lg:mx-24 mb-12 rounded-3xl px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white">{selectLabel(languageMode, "Start your protection today.", "आज से सुरक्षा शुरू करें।")}</h2>
          <p className="text-gray-400 text-sm mt-2">{selectLabel(languageMode, "No paperwork. Cancel anytime.", "कोई कागजी कार्रवाई नहीं। कभी भी रद्द करें।")}</p>
        </div>
        <button onClick={() => navigate("/signin")} className="flex items-center gap-2 bg-white text-[#1a2229] rounded-2xl px-6 py-3 font-bold text-sm hover:bg-gray-100 transition flex-shrink-0">
          {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}<ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}

export default PricingPage;
