import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, Activity, ScanFace, Lock, TrendingDown, CheckCircle2 } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

const fraudSignals = [
  { icon: <Activity className="w-5 h-5" />, name: { en: "Behavior risk score", hi: "व्यवहार जोखिम स्कोर" }, detail: { en: "GigShield assigns a risk score from activity patterns and trigger behavior.", hi: "GigShield गतिविधि पैटर्न और ट्रिगर व्यवहार से जोखिम स्कोर निर्दिष्ट करता है।" } },
  { icon: <ScanFace className="w-5 h-5" />, name: { en: "Persona simulation", hi: "पर्सोना सिमुलेशन" }, detail: { en: "Dashboard can switch Normal and Suspicious personas for fraud testing.", hi: "डैशबोर्ड धोखाधड़ी परीक्षण के लिए पर्सोना बदल सकता है।" } },
  { icon: <Lock className="w-5 h-5" />, name: { en: "Verification gate", hi: "सत्यापन गेट" }, detail: { en: "High-risk sessions are paused until selfie gesture verification is completed.", hi: "सेल्फी सत्यापन पूरा होने तक उच्च-जोखिम सत्र रोके जाते हैं।" } },
  { icon: <TrendingDown className="w-5 h-5" />, name: { en: "Payout safety lock", hi: "पेआउट सुरक्षा लॉक" }, detail: { en: "Suspicious payout attempts are blocked with clear reason messages.", hi: "संदिग्ध भुगतान प्रयासों को स्पष्ट कारण संदेशों के साथ रोका जाता है।" } },
];

const guardSteps = [
  { step: { en: "Step 1", hi: "चरण 1" }, title: { en: "Monitor activity and triggers", hi: "गतिविधि और ट्रिगर की निगरानी" }, detail: { en: "System reads behavior patterns and event context continuously.", hi: "सिस्टम व्यवहार पैटर्न और घटना संदर्भ को लगातार पढ़ता है।" } },
  { step: { en: "Step 2", hi: "चरण 2" }, title: { en: "Calculate risk level", hi: "जोखिम स्तर की गणना" }, detail: { en: "Score maps to Low, Medium, or High risk state.", hi: "स्कोर निम्न, मध्यम, या उच्च जोखिम अवस्था निर्धारित करता है।" } },
  { step: { en: "Step 3", hi: "चरण 3" }, title: { en: "Apply safety rule", hi: "सुरक्षा नियम लागू करें" }, detail: { en: "Low/Medium risk can proceed; High risk requires selfie verification.", hi: "निम्न/मध्यम जोखिम आगे बढ़ सकता है; उच्च जोखिम के लिए सेल्फी सत्यापन।" } },
  { step: { en: "Step 4", hi: "चरण 4" }, title: { en: "Allow or block payout", hi: "भुगतान की अनुमति या रोक" }, detail: { en: "Verified users continue, suspicious users are blocked until checks pass.", hi: "सत्यापित उपयोगकर्ता जारी रहते हैं, संदिग्ध रोके जाते हैं।" } },
];

const protectionBenefits = [
  { en: "Honest delivery workers receive faster and safer payouts", hi: "ईमानदार डिलीवरी वर्कर्स को तेज़ और सुरक्षित भुगतान मिलता है" },
  { en: "Fraudulent claims are reduced without harming genuine workers", hi: "असली वर्कर्स को नुकसान पहुँचाए बिना धोखाधड़ी कम होती है" },
  { en: "Payout pool stays sustainable for long-term worker protection", hi: "भुगतान पूल दीर्घकालिक सुरक्षा के लिए टिकाऊ रहता है" },
  { en: "Every blocked or paid decision is transparent on the dashboard", hi: "हर निर्णय डैशबोर्ड पर पारदर्शी है" },
];

function FraudGuardPage() {
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
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">{selectLabel(languageMode, "Fraud Protection Layer", "फ्रॉड सुरक्षा लेयर")}</p>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
          {selectLabel(languageMode, "How Fraud Guard", "Fraud Guard कैसे")}<br />
          <span className="text-gray-400">{selectLabel(languageMode, "protects GigShield.", "GigShield की सुरक्षा करता है।")}</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
          {selectLabel(languageMode, "Fraud Guard is the trust layer in GigShield. It uses risk scoring, verification gates, and decision checks so payouts go to real delivery workers during real disruptions.", "Fraud Guard GigShield की ट्रस्ट लेयर है। यह जोखिम स्कोरिंग और सत्यापन गेट का उपयोग करता है ताकि भुगतान सही वर्कर्स तक पहुंचे।")}
        </p>
      </section>

      {/* Signals */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "Fraud Guard Signals", "Fraud Guard संकेत")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {fraudSignals.map((s, i) => (
            <div key={i} className="group bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl p-6 hover:bg-white/80 transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#f4f5f7] border border-gray-100 flex items-center justify-center text-gray-700 mb-4 group-hover:bg-[#1a2229] group-hover:text-white transition">{s.icon}</div>
              <h3 className="text-base font-bold text-gray-900">{selectLabel(languageMode, s.name.en, s.name.hi)}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{selectLabel(languageMode, s.detail.en, s.detail.hi)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Decision flow */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "Decision Flow", "निर्णय प्रवाह")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {guardSteps.map((item, i) => (
            <div key={i}>
              <div className="w-10 h-10 rounded-xl bg-[#1a2229] text-white flex items-center justify-center text-sm font-bold mb-4">{i + 1}</div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{selectLabel(languageMode, item.step.en, item.step.hi)}</p>
              <h3 className="text-base font-bold text-gray-900">{selectLabel(languageMode, item.title.en, item.title.hi)}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{selectLabel(languageMode, item.detail.en, item.detail.hi)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "Why This Protects Delivery Workers", "यह डिलीवरी वर्कर्स की सुरक्षा कैसे करता है")}</p>
        <div className="space-y-1">
          {protectionBenefits.map((b, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-0">
              <CheckCircle2 className="w-5 h-5 text-[#1a2229] flex-shrink-0" />
              <p className="text-sm font-medium text-gray-800">{selectLabel(languageMode, b.en, b.hi)}</p>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Demo links */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">{selectLabel(languageMode, "Try Fraud Guard Demo", "Fraud Guard डेमो आज़माएं")}</p>
        <p className="text-sm text-gray-600 mb-6">{selectLabel(languageMode, "Use dashboard personas to test how Fraud Guard responds to safe and suspicious sessions.", "डैशबोर्ड पर्सोना का उपयोग करके देखें।")}</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard" className="group flex items-center gap-2 secondary-btn">
            {selectLabel(languageMode, "Open Dashboard", "डैशबोर्ड खोलें")}<ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/dashboard?trigger=heavy-rain" className="group flex items-center gap-2 secondary-btn">
            {selectLabel(languageMode, "Open with Rain Trigger", "बारिश ट्रिगर के साथ खोलें")}<ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a2229] mx-6 sm:mx-12 lg:mx-24 mb-12 rounded-3xl px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white">{selectLabel(languageMode, "A platform built on trust.", "भरोसे पर बना प्लेटफ़ॉर्म।")}</h2>
          <p className="text-gray-400 text-sm mt-2">{selectLabel(languageMode, "Fast for honest riders. Safe for everyone.", "ईमानदार राइडर्स के लिए तेज़। सभी के लिए सुरक्षित।")}</p>
        </div>
        <button onClick={() => navigate("/signin")} className="flex items-center gap-2 bg-white text-[#1a2229] rounded-2xl px-6 py-3 font-bold text-sm hover:bg-gray-100 transition flex-shrink-0">
          {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}<ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}

export default FraudGuardPage;
