import { Link } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import triggerEvents from "../data/triggerEvents.json";
import { formatCurrency } from "../utils/format";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

const triggerSources = [
  {
    name: { en: "Weather signals", hi: "मौसम के संकेत" },
    detail: { en: "Heavy rain and heatwave alerts from external weather feeds.", hi: "बाहरी मौसम फ़ीड से भारी बारिश और लू के अलर्ट।" },
  },
  {
    name: { en: "Air quality signals", hi: "वायु गुणवत्ता (AQI) संकेत" },
    detail: { en: "AQI spike conditions that reduce safe outdoor work.", hi: "AQI बढ़ने की स्थिति जो सुरक्षित बाहरी काम को कम करती है।" },
  },
  {
    name: { en: "Platform status", hi: "प्लेटफ़ॉर्म की स्थिति" },
    detail: { en: "Outage or downtime events that stop order flow.", hi: "आउटेज या डाउनटाइम घटनाएँ जो ऑर्डर के प्रवाह को रोकती हैं।" },
  },
];

const payoutRules = [
  { en: "Trigger must be valid for selected plan", hi: "ट्रिगर चयनित योजना के लिए मान्य होना चाहिए" },
  { en: "Coverage time window must be active", hi: "कवरेज समय विंडो सक्रिय होनी चाहिए" },
  { en: "Daily payout cap must have remaining balance", hi: "दैनिक भुगतान सीमा में शेष राशि होनी चाहिए" },
  { en: "If risk is high, selfie verification may be required", hi: "यदि जोखिम अधिक है, तो सेल्फी सत्यापन की आवश्यकता हो सकती है" },
];

function TriggerPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();

  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "Triggers power automatic payout decisions so workers get support during real disruptions.",
            "ट्रिगर्स स्वतः भुगतान निर्णय चलाते हैं ताकि असली व्यवधान में वर्कर्स को सहायता मिले।",
          )}
        </div>

        <header className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="kicker">{selectLabel(languageMode, "Trigger System", "ट्रिगर सिस्टम")}</p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                {selectLabel(languageMode, "How trigger payouts", "ट्रिगर भुगतान कैसे")}
                <br />
                {selectLabel(languageMode, "work in GigShield.", "GigShield में काम करते हैं।")}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-coal-500 sm:text-base">
                {selectLabel(
                  languageMode,
                  "A trigger is a verified disruption event. When one happens, GigShield checks plan rules and risk controls, then applies payout instantly if conditions match.",
                  "ट्रिगर एक सत्यापित व्यवधान घटना है। घटना होने पर GigShield योजना नियम और जोखिम नियंत्रण जांचता है, और शर्तें मिलने पर तुरंत भुगतान लागू करता है।",
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
              <Link to="/pricing" className="secondary-btn">{selectLabel(languageMode, "Pricing", "कीमत")}</Link>
              <Link to="/auth" className="primary-btn">{selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}</Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6">
          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Where Triggers Come From", "ट्रिगर्स कहां से आते हैं")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {triggerSources.map((source) => (
                <article key={source.name.en} className="rounded-lg border border-coal-200 bg-white p-3">
                  <p className="text-base font-semibold text-coal-900">{selectLabel(languageMode, source.name.en, source.name.hi)}</p>
                  <p className="mt-1 text-sm text-coal-600">{selectLabel(languageMode, source.detail.en, source.detail.hi)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Available Trigger Events", "उपलब्ध ट्रिगर इवेंट्स")}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-coal-200 text-coal-600">
                    <th className="py-2 pr-3 font-semibold">{selectLabel(languageMode, "Trigger", "ट्रिगर")}</th>
                    <th className="py-2 pr-3 font-semibold">Basic</th>
                    <th className="py-2 pr-3 font-semibold">Standard</th>
                    <th className="py-2 pr-3 font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {triggerEvents.map((event) => (
                    <tr key={event.id} className="border-b border-coal-100">
                      <td className="py-2 pr-3 font-semibold text-coal-900">{event.label}</td>
                      <td className="py-2 pr-3 text-coal-700">{formatCurrency(event.payoutByPlan.basic)}</td>
                      <td className="py-2 pr-3 text-coal-700">{formatCurrency(event.payoutByPlan.standard)}</td>
                      <td className="py-2 pr-3 text-coal-700">{formatCurrency(event.payoutByPlan.pro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Payout Decision Rules", "भुगतान निर्णय नियम")}</p>
            <ul className="mt-3 grid gap-2 text-sm text-coal-700 sm:grid-cols-2">
              {payoutRules.map((rule) => (
                <li key={rule.en} className="rounded-lg border border-coal-200 bg-white px-3 py-2">
                  {selectLabel(languageMode, rule.en, rule.hi)}
                </li>
              ))}
            </ul>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Try Trigger Demo", "ट्रिगर डेमो आज़माएं")}</p>
            <p className="mt-2 text-sm text-coal-600">
              {selectLabel(languageMode, "Open dashboard with a preselected trigger event to test the live payout flow instantly.", "लाइव भुगतान फ्लो को तुरंत टेस्ट करने के लिए प्री-सेलेक्टेड ट्रिगर इवेंट के साथ डैशबोर्ड खोलें।")}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {triggerEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/dashboard?plan=standard&trigger=${event.id}`}
                  className="rounded-lg border border-coal-200 bg-white px-3 py-2 text-sm font-semibold text-coal-900 transition hover:bg-coal-100"
                >
                  {selectLabel(languageMode, `Run ${event.label} Demo`, `${event.label} डेमो चलाएं`)}
                </Link>
              ))}
            </div>
          </section>

          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Worker Protection Outcome", "वर्कर सुरक्षा परिणाम")}</p>
            <p className="mt-2 text-sm text-coal-700">
              {selectLabel(
                languageMode,
                "Instead of waiting for manual claim approvals, workers receive support when disruption events are verified. This reduces income shock, keeps payout logic transparent, and uses fraud checks so honest workers are protected consistently.",
                "मैनुअल क्लेम अनुमोदन का इंतज़ार करने के बजाय, व्यवधान इवेंट सत्यापित होते ही वर्कर्स को सहायता मिलती है। इससे आय का झटका कम होता है, भुगतान नियम पारदर्शी रहते हैं और फ्रॉड जांच से ईमानदार वर्कर्स की लगातार सुरक्षा होती है।",
              )}
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

export default TriggerPage;
