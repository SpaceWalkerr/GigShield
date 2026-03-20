import { useNavigate } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

const protectionSituations = [
  {
    trigger: { en: "Heavy Rain", hi: "तेज़ बारिश" },
    issue: { en: "Orders drop and riders lose active earning hours", hi: "ऑर्डर कम हो जाते हैं और राइडर्स काम के घंटे खो देते हैं" },
    response: { en: "GigShield detects the rain trigger and releases payout automatically.", hi: "GigShield बारिश को डिटेक्ट करता है और अपने आप भुगतान कर देता है।" },
  },
  {
    trigger: { en: "Heatwave", hi: "लू / तेज़ गर्मी" },
    issue: { en: "Unsafe working conditions reduce delivery efficiency", hi: "असुरक्षित काम करने की स्थितियां डिलीवरी की गति कम करती हैं" },
    response: { en: "Riders receive support payout so income loss is reduced.", hi: "राइडर्स को सहायता भुगतान मिलता है जिससे आय का नुकसान कम होता है।" },
  },
  {
    trigger: { en: "AQI Spike", hi: "खतरनाक घनी हवा (AQI)" },
    issue: { en: "Pollution risk forces shorter shifts or slow movement", hi: "प्रदूषण का जोखिम कम शिफ्ट या धीमी गति को मजबूर करता है" },
    response: { en: "Trigger payout protects daily earning consistency.", hi: "ट्रिगर भुगतान दैनिक कमाई की स्थिरता को बचाता है।" },
  },
  {
    trigger: { en: "Platform Outage", hi: "प्लेटफ़ॉर्म डाउन होना" },
    issue: { en: "Order flow stops even when riders are ready to work", hi: "राइडर्स तैयार होने पर भी ऑर्डर आना बंद हो जाता है" },
    response: { en: "Outage trigger starts payout without claim paperwork.", hi: "आउटेज होने पर बिना कागजी कार्रवाई के भुगतान शुरू हो जाता है।" },
  },
];

const featureHighlights = [
  {
    title: { en: "Automatic Trigger Payouts", hi: "स्वचालित ट्रिगर भुगतान" },
    detail: { en: "No manual claim process. If trigger conditions match, payout is calculated instantly.", hi: "कोई मैन्युअल क्लेम प्रक्रिया नहीं। अगर ट्रिगर शर्तें मेल खाती हैं, तो भुगतान तुरंत गिना जाता है।" },
  },
  {
    title: { en: "Plan-Based Protection", hi: "योजना-आधारित सुरक्षा" },
    detail: { en: "Basic, Standard, and Pro plans define payout amount, coverage window, and daily cap.", hi: "बेसिक, स्टैंडर्ड, और प्रो योजनाएं भुगतान राशि, कवरेज विंडो और दैनिक सीमा तय करती हैं।" },
  },
  {
    title: { en: "Fraud Guard Layer", hi: "धोखाधड़ी सुरक्षा परत" },
    detail: { en: "Risk scoring detects suspicious behavior and can require verification before payout.", hi: "जोखिम स्कोरिंग संदिग्ध व्यवहार का पता लगाता है और भुगतान से पहले सत्यापन की आवश्यकता हो सकती है।" },
  },
  {
    title: { en: "Selfie Verification Gate", hi: "सेल्फी सत्यापन द्वार" },
    detail: { en: "High-risk sessions are verified through a random selfie gesture challenge.", hi: "उच्च-जोखिम वाले सत्रों को यादृच्छिक सेल्फी जेस्चर चुनौती के माध्यम से जाँचा जाता है।" },
  },
  {
    title: { en: "Transparent Dashboard", hi: "पारदर्शी डैशबोर्ड" },
    detail: { en: "Workers can see payouts, active plan, risk state, and premium history in one place.", hi: "वर्कर्स एक ही जगह पर भुगतान, सक्रिय योजना, जोखिम स्थिति और प्रीमियम का इतिहास देख सकते हैं।" },
  },
  {
    title: { en: "Fast Demo-to-Real Flow", hi: "तेज़ डेमो-से-वास्तविक प्रवाह" },
    detail: { en: "The same dashboard flow demonstrates practical worker protection decisions end to end.", hi: "यही डैशबोर्ड प्रवाह अंत से अंत तक व्यावहारिक वर्कर सुरक्षा निर्णयों को प्रदर्शित करता है।" },
  },
];

function ProductPage() {
  const navigate = useNavigate();
  const { languageMode, setLanguageMode } = useSiteLanguage();

  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "GigShield protects delivery income during disruption events through trigger-based payouts.",
            "GigShield व्यवधान की स्थिति में ट्रिगर-आधारित भुगतान के जरिए डिलीवरी आय की सुरक्षा करता है।",
          )}
        </div>

        <header className="border-b border-coal-200 px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="bg-coal-900 px-3 py-1">
              <p className="hero-title text-2xl leading-none text-white sm:text-3xl">
                GIGSHIELD.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LanguageToggle
                languageMode={languageMode}
                setLanguageMode={setLanguageMode}
              />
              <button
                type="button"
                onClick={() => navigate("/")}
                className="secondary-btn"
              >
                {selectLabel(languageMode, "Back to Landing", "मुखपृष्ठ पर जाएं")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className="secondary-btn"
              >
                {selectLabel(languageMode, "View Pricing", "कीमत देखें")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="primary-btn"
              >
                {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}
              </button>
            </div>
          </div>

          <p className="kicker mt-6">{selectLabel(languageMode, "Product Overview", "उत्पाद अवलोकन")}</p>
          <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl lg:text-6xl">
            {selectLabel(languageMode, "How GigShield works", "GigShield कैसे काम करता है")}
            <br />
            {selectLabel(languageMode, "for delivery workers.", "डिलीवरी वर्कर्स के लिए।")}
          </h1>
          <p className="mt-4 max-w-3xl text-base text-coal-600 sm:text-lg">
            {selectLabel(
              languageMode,
              "GigShield is built to protect gig worker earnings when real-world events interrupt normal delivery flow. It does this by watching verified triggers and releasing support payout quickly, with fraud controls to keep the system fair.",
              "GigShield गिग वर्कर्स की कमाई की सुरक्षा के लिए बनाया गया है, जब वास्तविक घटनाएं सामान्य डिलीवरी को प्रभावित करती हैं। यह सत्यापित ट्रिगर्स देखकर जल्दी सहायता भुगतान जारी करता है और निष्पक्षता के लिए फ्रॉड नियंत्रण लागू करता है।",
            )}
          </p>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6">
          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "How To Use", "कैसे उपयोग करें")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-lg border border-coal-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">{selectLabel(languageMode, "Step 1", "चरण 1")}</p>
                <p className="mt-1 text-sm font-semibold text-coal-900">{selectLabel(languageMode, "Choose your plan", "अपनी योजना चुनें")}</p>
                <p className="mt-1 text-sm text-coal-600">{selectLabel(languageMode, "Select Basic, Standard, or Pro based on your work hours and risk coverage needs.", "काम के घंटों और जोखिम कवरेज की जरूरतों के आधार पर बेसिक, स्टैंडर्ड, या प्रो चुनें।")}</p>
              </article>
              <article className="rounded-lg border border-coal-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">{selectLabel(languageMode, "Step 2", "चरण 2")}</p>
                <p className="mt-1 text-sm font-semibold text-coal-900">{selectLabel(languageMode, "Keep coverage active", "कवरेज सक्रिय रखें")}</p>
                <p className="mt-1 text-sm text-coal-600">{selectLabel(languageMode, "When coverage is active, trigger events are evaluated for payout eligibility.", "जब कवरेज सक्रिय होता है, तो पेआउट के लिए ट्रिगर इवेंट का मूल्यांकन किया जाता है।")}</p>
              </article>
              <article className="rounded-lg border border-coal-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">{selectLabel(languageMode, "Step 3", "चरण 3")}</p>
                <p className="mt-1 text-sm font-semibold text-coal-900">{selectLabel(languageMode, "Trigger event occurs", "ट्रिगर इवेंट होता है")}</p>
                <p className="mt-1 text-sm text-coal-600">{selectLabel(languageMode, "Rain, heat, AQI, or outage triggers are checked against your plan and daily cap.", "बारिश, गर्मी, AQI, या आउटेज ट्रिगर की जाँच आपकी योजना और दैनिक सीमा के आधार पर की जाती है।")}</p>
              </article>
              <article className="rounded-lg border border-coal-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">{selectLabel(languageMode, "Step 4", "चरण 4")}</p>
                <p className="mt-1 text-sm font-semibold text-coal-900">{selectLabel(languageMode, "Receive payout", "भुगतान प्राप्त करें")}</p>
                <p className="mt-1 text-sm text-coal-600">{selectLabel(languageMode, "If rules match, payout is applied instantly. High-risk sessions may require selfie verification.", "अगर नियम मेल खाते हैं, तो भुगतान तुरंत लागू होता है। उच्च-जोखिम सत्रों के लिए सेल्फी सत्यापन की आवश्यकता हो सकती है।")}</p>
              </article>
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Key Features", "मुख्य विशेषताएं")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featureHighlights.map((feature) => (
                <article key={feature.title.en} className="rounded-lg border border-coal-200 bg-white p-3">
                  <p className="text-base font-semibold text-coal-900">{selectLabel(languageMode, feature.title.en, feature.title.hi)}</p>
                  <p className="mt-1 text-sm text-coal-600">{selectLabel(languageMode, feature.detail.en, feature.detail.hi)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Protection In Real Situations", "वास्तविक स्थितियों में सुरक्षा")}</p>
            <div className="mt-3 grid gap-3">
              {protectionSituations.map((situation) => (
                <article key={situation.trigger.en} className="rounded-lg border border-coal-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-coal-900">{selectLabel(languageMode, situation.trigger.en, situation.trigger.hi)}</p>
                    <span className="rounded-full bg-coal-100 px-3 py-1 text-xs font-semibold text-coal-700">
                      {selectLabel(languageMode, "Worker protection event", "वर्कर सुरक्षा इवेंट")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-coal-600">
                    <strong className="text-coal-900">{selectLabel(languageMode, "Situation:", "स्थिति:")}</strong> {selectLabel(languageMode, situation.issue.en, situation.issue.hi)}
                  </p>
                  <p className="mt-1 text-sm text-coal-600">
                    <strong className="text-coal-900">{selectLabel(languageMode, "GigShield response:", "GigShield प्रतिक्रिया:")}</strong> {selectLabel(languageMode, situation.response.en, situation.response.hi)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Why It Helps Workers", "यह वर्कर्स की कैसे मदद करता है")}</p>
            <ul className="mt-3 grid gap-2 text-sm text-coal-700 sm:grid-cols-2">
              <li className="rounded-lg border border-coal-200 bg-white px-3 py-2">{selectLabel(languageMode, "Less income shock on bad weather or outage days", "खराब मौसम या आउटेज के दिनों में आय का कम नुकसान")}</li>
              <li className="rounded-lg border border-coal-200 bg-white px-3 py-2">{selectLabel(languageMode, "No complex paperwork for every event", "हर मामले के लिए कोई जटिल कागजी कार्रवाई नहीं")}</li>
              <li className="rounded-lg border border-coal-200 bg-white px-3 py-2">{selectLabel(languageMode, "Fast visibility of payout decisions and history", "भुगतान के फैसलों और इतिहास की स्पष्ट जानकारी")}</li>
              <li className="rounded-lg border border-coal-200 bg-white px-3 py-2">{selectLabel(languageMode, "Fraud controls keep honest worker payouts sustainable", "धोखाधड़ी नियंत्रण ईमानदार वर्कर्स के भुगतान को सुरक्षित रखता है")}</li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}

export default ProductPage;
