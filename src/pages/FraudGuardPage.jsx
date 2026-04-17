import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Activity, ScanFace, Lock, TrendingDown, CheckCircle2 } from "lucide-react";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage.jsx";
import {
  MarketingPageShell,
  MarketingSection,
  SurfaceCard,
} from "@/components/ui/marketing-page-shell";

const fraudSignals = [
  { icon: <Activity className="w-5 h-5" />, name: { en: "Behavior risk score", hi: "व्यवहार जोखिम स्कोर" }, detail: { en: "GigShield assigns a risk score from activity patterns and trigger behavior.", hi: "GigShield गतिविधि पैटर्न और ट्रिगर व्यवहार से जोखिम स्कोर निर्दिष्ट करता है।" } },
  { icon: <ScanFace className="w-5 h-5" />, name: { en: "Persona simulation", hi: "पर्सोना सिमुलेशन" }, detail: { en: "Dashboard can switch Normal and Suspicious personas for fraud testing.", hi: "डैशबोर्ड धोखाधड़ी परीक्षण के लिए पर्सोना बदल सकता है।" } },
  { icon: <Lock className="w-5 h-5" />, name: { en: "Verification gate", hi: "सत्यापन गेट" }, detail: { en: "High-risk sessions are paused until selfie gesture verification is completed.", hi: "सेल्फी सत्यापन पूरा होने तक उच्च-जोखिम सत्र रोके जाते हैं।" } },
  { icon: <TrendingDown className="w-5 h-5" />, name: { en: "Payout safety lock", hi: "पेआउट सुरक्षा लॉक" }, detail: { en: "Suspicious payout attempts are blocked with clear reason messages.", hi: "संदिग्ध भुगतान प्रयासों को स्पष्ट कारण संदेशों के साथ रोका जाता है।" } },
];

const controlMatrix = [
  {
    title: { en: "Anomaly detection", hi: "अनियमितता पहचान" },
    detail: { en: "Risk scoring flags sudden trigger spikes, abnormal request patterns, and suspicious claim velocity.", hi: "रिस्क स्कोरिंग अचानक ट्रिगर स्पाइक और संदिग्ध पैटर्न को फ्लैग करती है।" },
  },
  {
    title: { en: "Location validation", hi: "लोकेशन सत्यापन" },
    detail: { en: "Live geolocation is checked against the worker's expected city zone before payout release.", hi: "भुगतान से पहले लाइव लोकेशन को अपेक्षित शहर क्षेत्र से मिलाया जाता है।" },
  },
  {
    title: { en: "Activity validation", hi: "गतिविधि सत्यापन" },
    detail: { en: "Delivery activity context and persona behavior are reviewed so only genuine worker sessions pass automatically.", hi: "सिर्फ असली वर्कर सत्रों को पास करने के लिए गतिविधि संदर्भ की समीक्षा की जाती है।" },
  },
  {
    title: { en: "Duplicate claim prevention", hi: "डुप्लिकेट क्लेम रोकथाम" },
    detail: { en: "Cooldown and de-duplication rules stop repeated claims for the same disruption event.", hi: "कूलडाउन और डी-डुप्लिकेशन नियम एक ही व्यवधान के लिए दोहराए गए क्लेम रोकते हैं।" },
  },
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
  const { languageMode } = useSiteLanguage();

  return (
    <MarketingPageShell
      eyebrow={selectLabel(languageMode, "Fraud Protection Layer", "फ्रॉड सुरक्षा लेयर")}
      title={selectLabel(languageMode, "How Fraud Guard protects", "Fraud Guard कैसे सुरक्षा करता है")}
      highlight="GigShield."
      description={selectLabel(languageMode, "Fraud Guard is the trust layer in GigShield. It uses risk scoring, verification gates, location checks, and moderation logic so payouts go to genuine delivery workers during genuine disruptions.", "Fraud Guard जोखिम स्कोरिंग, लोकेशन चेक और सत्यापन के साथ सही वर्कर्स तक भुगतान पहुंचाता है।")}
      primaryAction={{ to: "/dashboard", label: selectLabel(languageMode, "Open Dashboard", "डैशबोर्ड खोलें") }}
      secondaryAction={{ to: "/dashboard?trigger=heavy-rain", label: selectLabel(languageMode, "Open Fraud View", "फ्रॉड व्यू खोलें") }}
      stats={[
        { label: "Risk states", value: "Low / Medium / High", detail: "Behavior scoring changes how much friction a payout requires." },
        { label: "Location", value: "Validated", detail: "Claim coordinates are checked against expected city zones." },
        { label: "Duplicate control", value: "Dedup + cooldown", detail: "Repeated disruption claims are throttled and blocked." },
        { label: "Outcome", value: "Fast + safe", detail: "Honest riders move fast while suspicious flows are reviewed." },
      ]}
    >
      <MarketingSection title={selectLabel(languageMode, "Fraud Guard signals", "Fraud Guard संकेत")} caption="Signals">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {fraudSignals.map((s, i) => (
            <SurfaceCard key={i}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">{s.icon}</div>
              <h3 className="mt-4 text-base font-bold text-white">{selectLabel(languageMode, s.name.en, s.name.hi)}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{selectLabel(languageMode, s.detail.en, s.detail.hi)}</p>
            </SurfaceCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Decision flow", "निर्णय प्रवाह")} caption="Flow">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {guardSteps.map((item, i) => (
            <SurfaceCard key={i}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-300 text-sm font-bold text-zinc-950">{i + 1}</div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{selectLabel(languageMode, item.step.en, item.step.hi)}</p>
              <h3 className="mt-2 text-base font-bold text-white">{selectLabel(languageMode, item.title.en, item.title.hi)}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{selectLabel(languageMode, item.detail.en, item.detail.hi)}</p>
            </SurfaceCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Fraud control matrix", "फ्रॉड नियंत्रण मैट्रिक्स")} caption="Controls">
        <div className="grid sm:grid-cols-2 gap-6">
          {controlMatrix.map((item) => (
            <SurfaceCard key={item.title.en}>
              <h3 className="text-base font-bold text-white">{selectLabel(languageMode, item.title.en, item.title.hi)}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{selectLabel(languageMode, item.detail.en, item.detail.hi)}</p>
            </SurfaceCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Why this protects delivery workers", "यह डिलीवरी वर्कर्स की सुरक्षा कैसे करता है")} caption="Impact">
        <div className="space-y-1">
          {protectionBenefits.map((b, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-white/8 py-4 last:border-0">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-cyan-300" />
              <p className="text-sm font-medium text-zinc-200">{selectLabel(languageMode, b.en, b.hi)}</p>
              <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 text-zinc-500" />
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Try Fraud Guard live", "Fraud Guard लाइव आज़माएं")} caption="Demo">
        <p className="text-sm text-zinc-300 mb-6">{selectLabel(languageMode, "Use dashboard personas to test how Fraud Guard responds to safe and suspicious sessions.", "डैशबोर्ड पर्सोना का उपयोग करके देखें।")}</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]">
            {selectLabel(languageMode, "Open Dashboard", "डैशबोर्ड खोलें")}<ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/dashboard?trigger=heavy-rain" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]">
            {selectLabel(languageMode, "Open with Rain Trigger", "बारिश ट्रिगर के साथ खोलें")}<ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </MarketingSection>
    </MarketingPageShell>
  );
}

export default FraudGuardPage;

