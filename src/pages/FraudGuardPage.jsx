import { Link } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

const fraudSignals = [
  {
    name: { en: "Behavior risk score", hi: "व्यवहार जोखिम स्कोर" },
    detail: { en: "GigShield assigns a risk score from activity patterns and trigger behavior.", hi: "GigShield गतिविधि पैटर्न और ट्रिगर व्यवहार से एक जोखिम स्कोर निर्दिष्ट करता है।" },
  },
  {
    name: { en: "Persona simulation", hi: "पर्सोना सिमुलेशन" },
    detail: { en: "Dashboard can switch Normal and Suspicious personas for fraud testing.", hi: "डैशबोर्ड धोखाधड़ी परीक्षण के लिए सामान्य और संदिग्ध पर्सोना को बदल सकता है।" },
  },
  {
    name: { en: "Verification gate", hi: "सत्यापन गेट" },
    detail: { en: "High-risk sessions are paused until selfie gesture verification is completed.", hi: "सेल्फी जेस्चर सत्यापन पूरा होने तक उच्च-जोखिम वाले सत्र रोके जाते हैं।" },
  },
  {
    name: { en: "Payout safety lock", hi: "पेआउट सुरक्षा लॉक" },
    detail: { en: "Suspicious payout attempts are blocked with clear reason messages.", hi: "संदिग्ध भुगतान प्रयासों को स्पष्ट कारण संदेशों के साथ रोक दिया जाता है।" },
  },
];

const protectionBenefits = [
  { en: "Honest delivery workers receive faster and safer payouts", hi: "ईमानदार डिलीवरी वर्कर्स को तेज़ और सुरक्षित भुगतान मिलता है" },
  { en: "Fraudulent claims are reduced without harming genuine workers", hi: "असली वर्कर्स को नुकसान पहुँचाए बिना धोखाधड़ी वाले दावे कम हो जाते हैं" },
  { en: "Payout pool stays sustainable for long-term worker protection", hi: "भुगतान पूल दीर्घकालिक कार्यकर्ता सुरक्षा के लिए टिकाऊ रहता है" },
  { en: "Every blocked or paid decision is transparent on the dashboard", hi: "हर रोका गया या भुगतान किया गया निर्णय डैशबोर्ड पर पारदर्शी है" },
];

const guardSteps = [
  {
    step: { en: "Step 1", hi: "चरण 1" },
    title: { en: "Monitor activity and triggers", hi: "गतिविधि और ट्रिगर की निगरानी करें" },
    detail: { en: "System reads behavior patterns and event context continuously.", hi: "सिस्टम व्यवहार पैटर्न और घटना संदर्भ को लगातार पढ़ता है।" },
  },
  {
    step: { en: "Step 2", hi: "चरण 2" },
    title: { en: "Calculate risk level", hi: "जोखिम स्तर की गणना करें" },
    detail: { en: "Score maps to Low, Medium, or High risk state.", hi: "स्कोर निम्न, मध्यम, या उच्च जोखिम अवस्था को निर्धारित करता है।" },
  },
  {
    step: { en: "Step 3", hi: "चरण 3" },
    title: { en: "Apply safety rule", hi: "सुरक्षा नियम लागू करें" },
    detail: { en: "Low/Medium risk can proceed; High risk requires selfie verification.", hi: "निम्न/मध्यम जोखिम आगे बढ़ सकता है; उच्च जोखिम के लिए सेल्फी सत्यापन की आवश्यकता है।" },
  },
  {
    step: { en: "Step 4", hi: "चरण 4" },
    title: { en: "Allow or block payout", hi: "भुगतान की अनुमति दें या रोकें" },
    detail: { en: "Verified users continue, suspicious users are blocked until checks pass.", hi: "सत्यापित उपयोगकर्ता जारी रहते हैं, संदिग्ध उपयोगकर्ताओं को ब्लॉक किया जाता है जब तक कि जाँच पास न हो जाए।" },
  },
];

function FraudGuardPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();

  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "Fraud Guard keeps payouts fast for genuine workers and blocked for suspicious behavior.",
            "Fraud Guard सही वर्कर्स के लिए भुगतान तेज रखता है और संदिग्ध व्यवहार को रोकता है।",
          )}
        </div>

        <header className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="kicker">{selectLabel(languageMode, "Fraud Protection Layer", "फ्रॉड सुरक्षा लेयर")}</p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                {selectLabel(languageMode, "How Fraud Guard", "Fraud Guard कैसे")}
                <br />
                {selectLabel(languageMode, "protects GigShield.", "GigShield की सुरक्षा करता है।")}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-coal-500 sm:text-base">
                {selectLabel(
                  languageMode,
                  "Fraud Guard is the trust layer in GigShield. It uses risk scoring, verification gates, and decision checks so payouts go to real delivery workers during real disruptions.",
                  "Fraud Guard GigShield की भरोसेमंद लेयर है। यह जोखिम स्कोरिंग, सत्यापन गेट और निर्णय जांच का उपयोग करता है ताकि वास्तविक व्यवधान में भुगतान सही डिलीवरी वर्कर्स तक पहुंचे।",
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LanguageToggle
                languageMode={languageMode}
                setLanguageMode={setLanguageMode}
              />
              <Link to="/" className="secondary-btn">{selectLabel(languageMode, "Back to Landing", "मुखपृष्ठ पर जाएं")}</Link>
              <Link to="/product" className="secondary-btn">{selectLabel(languageMode, "Product", "उत्पाद")}</Link>
              <Link to="/triggers" className="secondary-btn">{selectLabel(languageMode, "Triggers", "ट्रिगर्स")}</Link>
              <Link to="/auth" className="primary-btn">{selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}</Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6">
          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Fraud Guard Signals", "Fraud Guard संकेत")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fraudSignals.map((signal) => (
                <article key={signal.name.en} className="rounded-lg border border-coal-200 bg-white p-3">
                  <p className="text-base font-semibold text-coal-900">{selectLabel(languageMode, signal.name.en, signal.name.hi)}</p>
                  <p className="mt-1 text-sm text-coal-600">{selectLabel(languageMode, signal.detail.en, signal.detail.hi)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Decision Flow", "निर्णय प्रवाह")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {guardSteps.map((item) => (
                <article key={item.step.en} className="rounded-lg border border-coal-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">{selectLabel(languageMode, item.step.en, item.step.hi)}</p>
                  <p className="mt-1 text-base font-semibold text-coal-900">{selectLabel(languageMode, item.title.en, item.title.hi)}</p>
                  <p className="mt-1 text-sm text-coal-600">{selectLabel(languageMode, item.detail.en, item.detail.hi)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Why This Protects Delivery Workers", "यह डिलीवरी वर्कर्स की सुरक्षा कैसे करता है")}</p>
            <ul className="mt-3 grid gap-2 text-sm text-coal-700 sm:grid-cols-2">
              {protectionBenefits.map((benefit) => (
                <li key={benefit.en} className="rounded-lg border border-coal-200 bg-white px-3 py-2">
                  {selectLabel(languageMode, benefit.en, benefit.hi)}
                </li>
              ))}
            </ul>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Try Fraud Guard Demo", "Fraud Guard डेमो आज़माएं")}</p>
            <p className="mt-2 text-sm text-coal-600">
              {selectLabel(languageMode, "Use dashboard personas to test how Fraud Guard responds to safe and suspicious sessions.", "डैशबोर्ड पर्सोना का उपयोग करके देखें कि Fraud Guard सुरक्षित और संदिग्ध सेशन्स पर कैसे प्रतिक्रिया देता है।")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/dashboard" className="secondary-btn">{selectLabel(languageMode, "Open Dashboard", "डैशबोर्ड खोलें")}</Link>
              <Link to="/dashboard?trigger=heavy-rain" className="secondary-btn">{selectLabel(languageMode, "Open with Rain Trigger", "बारिश ट्रिगर के साथ खोलें")}</Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default FraudGuardPage;
