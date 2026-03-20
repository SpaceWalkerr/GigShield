import { Link } from "react-router-dom";
import { useState } from "react";
import LanguageToggle from "../components/LanguageToggle";
import planDetails from "../data/planDetails.json";
import { formatCurrency } from "../utils/format";
import { calculateWeeklyPremium, supportedRiskLevels } from "../utils/pricing";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

const planHighlights = {
  basic: [
    { en: "Rain and AQI trigger payouts", hi: "बारिश और AQI ट्रिगर भुगतान" },
    { en: "Daily payout cap: INR 300", hi: "दैनिक भुगतान सीमा: INR 300" },
    { en: "Email support", hi: "ईमेल सहायता" },
  ],
  standard: [
    { en: "All weather and outage triggers", hi: "सभी मौसम और आउटेज ट्रिगर्स" },
    { en: "Daily payout cap: INR 650", hi: "दैनिक भुगतान सीमा: INR 650" },
    { en: "Priority support", hi: "प्राथमिक सहायता" },
  ],
  pro: [
    { en: "24x7 trigger coverage", hi: "24x7 ट्रिगर कवरेज" },
    { en: "Daily payout cap: INR 1,000", hi: "दैनिक भुगतान सीमा: INR 1,000" },
    { en: "Fast-track verification", hi: "फास्ट-ट्रैक सत्यापन" },
    { en: "Dedicated claims concierge", hi: "समर्पित क्लेम सहायता" },
  ],
};

function PricingPage() {
  const [platformCount, setPlatformCount] = useState(2);
  const [riskLevel, setRiskLevel] = useState("Medium");
  const { languageMode, setLanguageMode } = useSiteLanguage();

  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "Transparent weekly pricing for multi-platform riders across Zomato, Swiggy, Blinkit, and more.",
            "Zomato, Swiggy, Blinkit और अन्य प्लेटफॉर्म राइडर्स के लिए पारदर्शी साप्ताहिक कीमत।",
          )}
        </div>

        <header className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="kicker">{selectLabel(languageMode, "Plans and Pricing", "योजनाएं और कीमत")}</p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                {selectLabel(languageMode, "Pick your", "चुनें अपनी")}
                <br />
                {selectLabel(languageMode, "protection level.", "सुरक्षा योजना।")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-coal-500 sm:text-base">
                {selectLabel(
                  languageMode,
                  "Every plan includes parametric payouts for major disruptions. Scale coverage based on work hours, risk appetite, and number of linked platform accounts.",
                  "हर योजना में बड़े व्यवधानों के लिए पैरामीट्रिक भुगतान शामिल है। कवरेज को काम के घंटे, जोखिम स्तर और जुड़े प्लेटफॉर्म खातों के आधार पर चुनें।",
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LanguageToggle
                languageMode={languageMode}
                setLanguageMode={setLanguageMode}
              />
              <Link to="/" className="secondary-btn">
                {selectLabel(languageMode, "Back to Landing", "मुखपृष्ठ पर जाएं")}
              </Link>
              <Link
                to={`/auth?plan=standard&risk=${riskLevel}&platforms=${platformCount}`}
                className="primary-btn"
              >
                {selectLabel(languageMode, "Sign Up", "साइन अप")}
              </Link>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6">
          <section className="board-soft mb-4 p-4">
            <p className="kicker">{selectLabel(languageMode, "Premium Assumptions", "प्रीमियम मानदंड")}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-coal-800">
                {selectLabel(languageMode, "Linked platforms", "जुड़े प्लेटफॉर्म")}: {platformCount}
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={platformCount}
                  onChange={(event) => setPlatformCount(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>

              <div>
                <p className="text-sm font-semibold text-coal-800">{selectLabel(languageMode, "Risk level", "जोखिम स्तर")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {supportedRiskLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRiskLevel(level)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        riskLevel === level
                          ? "bg-coal-900 text-white"
                          : "border border-coal-300 bg-white text-coal-700 hover:bg-coal-100"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            {planDetails.map((plan) => {
              const isRecommended = plan.id === "standard";
              const highlights = planHighlights[plan.id] ?? [];
              const premium = calculateWeeklyPremium({
                basePremium: plan.weeklyPremium,
                platformCount,
                riskLevel,
              });

              return (
                <article
                  key={plan.id}
                  className={`relative rounded-2xl border p-5 shadow-edge ${
                    isRecommended
                      ? "border-electric-500 bg-electric-500 text-white"
                      : "border-coal-200 bg-white text-coal-900"
                  }`}
                >
                  {isRecommended ? (
                    <span className="absolute right-4 top-4 rounded-full bg-signal-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-coal-900">
                      {selectLabel(languageMode, "Recommended", "सुझाई गई")}
                    </span>
                  ) : null}

                  <p className={`kicker ${isRecommended ? "text-electric-100" : ""}`}>
                    {selectLabel(languageMode, "Weekly Plan", "साप्ताहिक योजना")}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight">{plan.name}</h2>
                  <p className={`mt-4 text-sm ${isRecommended ? "text-electric-100" : "text-coal-500"}`}>
                    {selectLabel(languageMode, "Premium", "प्रीमियम")}
                  </p>
                  <p className="text-4xl font-extrabold tracking-tight">
                    {formatCurrency(premium.adjustedPremium)}
                  </p>
                  <p className={`mt-1 text-xs ${isRecommended ? "text-electric-100" : "text-coal-600"}`}>
                    {selectLabel(languageMode, "Base", "मूल")} {formatCurrency(premium.basePremium)} +
                    {" "}{selectLabel(languageMode, "platform load", "प्लेटफॉर्म लोड")}{" "}{formatCurrency(premium.platformLoadFee)}
                    , {selectLabel(languageMode, "risk", "जोखिम")} x{premium.riskMultiplier.toFixed(2)}
                  </p>
                  <p className={`mt-1 text-sm ${isRecommended ? "text-electric-100" : "text-coal-600"}`}>
                    {selectLabel(languageMode, "Coverage window", "कवरेज समय")}: {plan.coverageHours}
                  </p>

                  <ul className="mt-5 space-y-2 text-sm">
                    {highlights.map((item) => (
                      <li
                        key={item.en}
                        className={`rounded-lg border px-3 py-2 ${
                          isRecommended
                            ? "border-electric-300/60 bg-electric-400/40"
                            : "border-coal-200 bg-coal-50"
                        }`}
                      >
                        {selectLabel(languageMode, item.en, item.hi)}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/auth?plan=${plan.id}&risk=${riskLevel}&platforms=${platformCount}`}
                    className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      isRecommended
                        ? "bg-white text-coal-900 hover:bg-coal-100"
                        : "bg-coal-900 text-white hover:bg-coal-700"
                    }`}
                  >
                    {selectLabel(languageMode, "Choose", "चुनें")} {plan.name}
                  </Link>
                </article>
              );
            })}
          </div>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="board-soft p-4">
              <p className="kicker">{selectLabel(languageMode, "Billing", "बिलिंग")}</p>
              <p className="mt-2 font-semibold text-coal-900">
                {selectLabel(languageMode, "Weekly, auto-renewable, cancel anytime", "साप्ताहिक, स्वतः नवीनीकरण, कभी भी रद्द करें")}
              </p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">{selectLabel(languageMode, "Trigger Types", "ट्रिगर प्रकार")}</p>
              <p className="mt-2 font-semibold text-coal-900">
                {selectLabel(languageMode, "Rain, heatwave, AQI spike, and outage", "बारिश, भीषण गर्मी, AQI बढ़ना और आउटेज")}
              </p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">{selectLabel(languageMode, "Payout Speed", "भुगतान गति")}</p>
              <p className="mt-2 font-semibold text-coal-900">
                {selectLabel(languageMode, "Instant after trigger verification", "ट्रिगर सत्यापन के बाद तुरंत")}
              </p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">{selectLabel(languageMode, "Supported Platforms", "समर्थित प्लेटफॉर्म")}</p>
              <p className="mt-2 font-semibold text-coal-900">Zomato, Swiggy, Blinkit, Zepto</p>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}

export default PricingPage;
