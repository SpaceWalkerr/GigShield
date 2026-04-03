import { Link, useNavigate } from "react-router-dom";
import { CloudRain, Thermometer, Wind, WifiOff, MapPinOff, ArrowRight, ChevronRight, Zap, Clock, Shield } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
import triggerEvents from "../data/triggerEvents.json";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

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
  { en: "Health, life, accidents excluded", hi: "स्वास्थ्य, जीवन, दुर्घटना और वाहन मरम्मत शामिल नहीं हैं", icon: <Shield className="w-4 h-4" /> },
];

function TriggerPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#f4f5f7]/80 backdrop-blur-md border-b border-white/60 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-gray-900">GIGSHIELD.</Link>
        <div className="flex items-center gap-3">
          <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
          <Link to="/" className="secondary-btn text-xs px-3 py-2">{selectLabel(languageMode, "Back", "वापस")}</Link>
          <Link to="/product" className="hidden sm:inline-flex secondary-btn text-xs px-3 py-2">{selectLabel(languageMode, "Product", "उत्पाद")}</Link>
          <button onClick={() => navigate("/signin")} className="primary-btn text-xs px-4 py-2">{selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 sm:px-12 lg:px-24 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">{selectLabel(languageMode, "Trigger System", "ट्रिगर सिस्टम")}</p>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
          {selectLabel(languageMode, "How trigger payouts", "ट्रिगर भुगतान कैसे")}<br />
          <span className="text-gray-400">{selectLabel(languageMode, "work in GigShield.", "GigShield में काम करते हैं।")}</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
          {selectLabel(languageMode, "A trigger is a verified disruption event. When one happens, GigShield checks plan rules and risk controls, then applies payout instantly if conditions match.", "ट्रिगर एक सत्यापित व्यवधान घटना है। शर्तें मिलने पर तुरंत भुगतान होता है।")}
        </p>
      </section>

      {/* Sources */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "Where Triggers Come From", "ट्रिगर्स कहां से आते हैं")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {triggerSources.map((s, i) => (
            <div key={i} className="group bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl p-6 hover:bg-white/80 transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#f4f5f7] border border-gray-100 flex items-center justify-center text-gray-700 mb-4 group-hover:bg-[#1a2229] group-hover:text-white transition">{s.icon}</div>
              <h3 className="text-base font-bold text-gray-900">{selectLabel(languageMode, s.name.en, s.name.hi)}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{selectLabel(languageMode, s.detail.en, s.detail.hi)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Events table */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "Available Trigger Events", "उपलब्ध ट्रिगर इवेंट्स")}</p>
        <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/60 backdrop-blur-sm shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                {[selectLabel(languageMode, "Trigger", "ट्रिगर"), "Basic", "Standard", "Pro"].map(h => (
                  <th key={h} className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {triggerEvents.map((event, i) => (
                <tr key={event.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "" : "bg-white/20"}`}>
                  <td className="px-5 py-4 font-semibold text-gray-900">{event.label}</td>
                  <td className="px-5 py-4 text-gray-700">{formatCurrency(event.payoutByPlan.basic)}</td>
                  <td className="px-5 py-4 text-gray-700">{formatCurrency(event.payoutByPlan.standard)}</td>
                  <td className="px-5 py-4 text-gray-700">{formatCurrency(event.payoutByPlan.pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rules */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "Payout Decision Rules", "भुगतान निर्णय नियम")}</p>
        <div className="space-y-1">
          {payoutRules.map((r, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-0">
              <div className="w-8 h-8 rounded-xl bg-white/80 border border-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">{r.icon}</div>
              <p className="text-sm font-medium text-gray-800">{selectLabel(languageMode, r.en, r.hi)}</p>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Demo links */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">{selectLabel(languageMode, "Try a Live Trigger Demo", "लाइव ट्रिगर डेमो आज़माएं")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {triggerEvents.map(event => (
            <Link key={event.id} to={`/dashboard?plan=standard&trigger=${event.id}`}
              className="group flex items-center justify-between bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-4 text-sm font-semibold text-gray-900 hover:bg-white transition shadow-sm">
              <span>{selectLabel(languageMode, event.label, event.label)}</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a2229] mx-6 sm:mx-12 lg:mx-24 mb-12 rounded-3xl px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white">{selectLabel(languageMode, "Let triggers protect your income.", "ट्रिगर से अपनी कमाई सुरक्षित करें।")}</h2>
          <p className="text-gray-400 text-sm mt-2">{selectLabel(languageMode, "Real payouts for real disruptions.", "असली बाधाओं के लिए असली भुगतान।")}</p>
        </div>
        <button onClick={() => navigate("/signin")} className="flex items-center gap-2 bg-white text-[#1a2229] rounded-2xl px-6 py-3 font-bold text-sm hover:bg-gray-100 transition flex-shrink-0">
          {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}<ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}

export default TriggerPage;
