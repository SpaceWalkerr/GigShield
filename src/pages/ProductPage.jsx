import { useNavigate, Link } from "react-router-dom";
import { Zap, ShieldCheck, Eye, ScanFace, LayoutDashboard, ArrowRight, CloudRain, Thermometer, Wind, WifiOff, ChevronRight } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

const situations = [
  { icon: <CloudRain className="w-6 h-6" />, trigger: { en: "Heavy Rain", hi: "तेज़ बारिश" }, issue: { en: "Orders drop and riders lose active earning hours", hi: "ऑर्डर कम हो जाते हैं और राइडर्स काम के घंटे खो देते हैं" }, response: { en: "GigShield detects the rain trigger and releases payout automatically.", hi: "GigShield बारिश को डिटेक्ट करता है और अपने आप भुगतान कर देता है।" } },
  { icon: <Thermometer className="w-6 h-6" />, trigger: { en: "Heatwave", hi: "लू / तेज़ गर्मी" }, issue: { en: "Unsafe working conditions reduce delivery efficiency", hi: "असुरक्षित काम करने की स्थिति डिलीवरी की क्षमता कम करती है" }, response: { en: "Riders receive support payout so income loss is reduced.", hi: "राइडर्स को सहायता भुगतान मिलता है जिससे आय का नुकसान कम होता है।" } },
  { icon: <Wind className="w-6 h-6" />, trigger: { en: "AQI Spike", hi: "खतरनाक AQI" }, issue: { en: "Pollution risk forces shorter shifts or slow movement", hi: "प्रदूषण का जोखिम कम शिफ्ट या धीमी गति को मजबूर करता है" }, response: { en: "Trigger payout protects daily earning consistency.", hi: "ट्रिगर भुगतान दैनिक कमाई की स्थिरता को बचाता है।" } },
  { icon: <WifiOff className="w-6 h-6" />, trigger: { en: "Platform Outage", hi: "प्लेटफ़ॉर्म डाउन" }, issue: { en: "Order flow stops even when riders are ready to work", hi: "राइडर्स तैयार होने पर भी ऑर्डर आना बंद हो जाता है" }, response: { en: "Outage trigger starts payout without claim paperwork.", hi: "आउटेज होने पर बिना कागजी कार्रवाई के भुगतान शुरू हो जाता है।" } },
];

const features = [
  { icon: <Zap className="w-5 h-5" />, title: { en: "Automatic Trigger Payouts", hi: "स्वचालित ट्रिगर भुगतान" }, detail: { en: "No manual claim process. If trigger conditions match, payout is calculated instantly.", hi: "कोई मैन्युअल क्लेम प्रक्रिया नहीं।" } },
  { icon: <ShieldCheck className="w-5 h-5" />, title: { en: "Plan-Based Protection", hi: "योजना-आधारित सुरक्षा" }, detail: { en: "Basic, Standard, and Pro plans define payout amount, coverage window, and daily cap.", hi: "बेसिक, स्टैंडर्ड, और प्रो योजनाएं भुगतान और कवरेज तय करती हैं।" } },
  { icon: <Eye className="w-5 h-5" />, title: { en: "Fraud Guard Layer", hi: "धोखाधड़ी सुरक्षा परत" }, detail: { en: "Risk scoring detects suspicious behavior and can require verification before payout.", hi: "जोखिम स्कोरिंग संदिग्ध व्यवहार का पता लगाता है।" } },
  { icon: <ScanFace className="w-5 h-5" />, title: { en: "Selfie Verification Gate", hi: "सेल्फी सत्यापन द्वार" }, detail: { en: "High-risk sessions are verified through a random selfie gesture challenge.", hi: "उच्च-जोखिम सत्रों के लिए सेल्फी सत्यापन।" } },
  { icon: <LayoutDashboard className="w-5 h-5" />, title: { en: "Transparent Dashboard", hi: "पारदर्शी डैशबोर्ड" }, detail: { en: "Workers can see payouts, active plan, risk state, and premium history in one place.", hi: "सभी जानकारी एक ही जगह।" } },
  { icon: <ArrowRight className="w-5 h-5" />, title: { en: "Fast Demo-to-Real Flow", hi: "तेज़ डेमो प्रवाह" }, detail: { en: "The same dashboard flow demonstrates practical worker protection end to end.", hi: "यही डैशबोर्ड अंत से अंत तक सुरक्षा निर्णय दिखाता है।" } },
];

const steps = [
  { en: "Choose your plan", hi: "अपनी योजना चुनें", desc: { en: "Select Basic, Standard, or Pro based on your work hours and risk needs.", hi: "काम के घंटों और जोखिम के आधार पर चुनें।" } },
  { en: "Keep coverage active", hi: "कवरेज सक्रिय रखें", desc: { en: "When coverage is active, trigger events are evaluated for payout eligibility.", hi: "सक्रिय रहने पर ट्रिगर इवेंट मूल्यांकित होते हैं।" } },
  { en: "Trigger event occurs", hi: "ट्रिगर इवेंट होता है", desc: { en: "Rain, heat, AQI, or outage triggers are checked against your plan and daily cap.", hi: "बारिश, गर्मी, AQI या आउटेज की जाँच की जाती है।" } },
  { en: "Receive payout", hi: "भुगतान प्राप्त करें", desc: { en: "If rules match, payout is applied instantly. High-risk sessions may need selfie check.", hi: "नियम मिलते ही भुगतान तुरंत होता है।" } },
];

function ProductPage() {
  const navigate = useNavigate();
  const { languageMode, setLanguageMode } = useSiteLanguage();

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#f4f5f7]/80 backdrop-blur-md border-b border-white/60 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-gray-900">GIGSHIELD.</Link>
        <div className="flex items-center gap-3">
          <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
          <button onClick={() => navigate("/triggers")} className="hidden sm:inline-flex secondary-btn text-xs px-3 py-2">{selectLabel(languageMode, "Triggers", "ट्रिगर्स")}</button>
          <button onClick={() => navigate("/pricing")} className="hidden sm:inline-flex secondary-btn text-xs px-3 py-2">{selectLabel(languageMode, "Pricing", "कीमत")}</button>
          <button onClick={() => navigate("/signin")} className="primary-btn text-xs px-4 py-2">{selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 sm:px-12 lg:px-24 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">{selectLabel(languageMode, "Product Overview", "उत्पाद अवलोकन")}</p>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-3xl">
          {selectLabel(languageMode, "How GigShield works", "GigShield कैसे")}<br />
          <span className="text-gray-400">{selectLabel(languageMode, "for delivery workers.", "काम करता है।")}</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
          {selectLabel(languageMode, "GigShield protects gig worker earnings when real-world events interrupt delivery flow. It watches verified triggers and releases support payouts quickly.", "GigShield गिग वर्कर्स की कमाई की सुरक्षा करता है जब घटनाएं डिलीवरी को प्रभावित करती हैं।")}
        </p>
        <div className="mt-8 flex gap-3 flex-wrap">
          <button onClick={() => navigate("/signin")} className="primary-btn gap-2 flex items-center">
            {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}<ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/pricing")} className="secondary-btn">{selectLabel(languageMode, "View Pricing", "कीमत देखें")}</button>
        </div>
      </section>

      {/* How it works steps */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "How To Use", "कैसे उपयोग करें")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="group">
              <div className="w-10 h-10 rounded-xl bg-[#1a2229] text-white flex items-center justify-center text-sm font-bold mb-4">{i + 1}</div>
              <h3 className="text-base font-bold text-gray-900">{selectLabel(languageMode, s.en, s.hi)}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{selectLabel(languageMode, s.desc.en, s.desc.hi)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200 mx-6 sm:mx-12 lg:mx-24" />

      {/* Protection situations */}
      <section className="px-6 sm:px-12 lg:px-24 py-20 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "Protection In Real Situations", "वास्तविक स्थितियों में सुरक्षा")}</p>
        <div className="space-y-1">
          {situations.map((s, i) => (
            <div key={i} className="group flex items-start gap-6 py-6 border-b border-gray-200 last:border-0 hover:bg-white/40 rounded-2xl px-4 -mx-4 transition cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-white/60 flex items-center justify-center text-gray-700 shadow-sm flex-shrink-0 mt-0.5 group-hover:bg-[#1a2229] group-hover:text-white transition">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{selectLabel(languageMode, s.trigger.en, s.trigger.hi)}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">{selectLabel(languageMode, "Worker event", "वर्कर इवेंट")}</span>
                </div>
                <p className="text-sm text-gray-500">{selectLabel(languageMode, s.issue.en, s.issue.hi)}</p>
                <p className="text-sm text-gray-700 mt-1 font-medium">{selectLabel(languageMode, "→ " + s.response.en, "→ " + s.response.hi)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition flex-shrink-0 mt-2" />
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 sm:px-12 lg:px-24 pb-24 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{selectLabel(languageMode, "Key Features", "मुख्य विशेषताएं")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl p-6 hover:bg-white/80 transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#f4f5f7] border border-gray-100 flex items-center justify-center text-gray-700 mb-4">{f.icon}</div>
              <h3 className="text-base font-bold text-gray-900">{selectLabel(languageMode, f.title.en, f.title.hi)}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{selectLabel(languageMode, f.detail.en, f.detail.hi)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a2229] mx-6 sm:mx-12 lg:mx-24 mb-12 rounded-3xl px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white">{selectLabel(languageMode, "Ready to ride protected?", "सुरक्षित राइड के लिए तैयार हैं?")}</h2>
          <p className="text-gray-400 text-sm mt-2">{selectLabel(languageMode, "Activate in under 3 minutes. No paperwork.", "3 मिनट में सक्रिय करें। कोई कागजी कार्रवाई नहीं।")}</p>
        </div>
        <button onClick={() => navigate("/signin")} className="flex items-center gap-2 bg-white text-[#1a2229] rounded-2xl px-6 py-3 font-bold text-sm hover:bg-gray-100 transition flex-shrink-0">
          {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}<ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}

export default ProductPage;
