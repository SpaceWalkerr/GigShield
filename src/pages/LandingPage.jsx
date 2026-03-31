import { useNavigate } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

/*
 * Public-facing entry page for the hackathon demo.
 * It explains the parametric insurance concept and routes users to the worker dashboard.
 */
function LandingPage() {
  const navigate = useNavigate();
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const navItems = [
    { key: "product", label: selectLabel(languageMode, "Product", "उत्पाद") },
    { key: "triggers", label: selectLabel(languageMode, "Triggers", "ट्रिगर्स") },
    { key: "fraud", label: selectLabel(languageMode, "Fraud Guard", "फ्रॉड गार्ड") },
    { key: "pricing", label: selectLabel(languageMode, "Pricing", "कीमत") },
  ];

  return (
    <main className="frame-shell flex min-h-screen items-center py-6 sm:py-8">
      <section className="board animate-enter w-full overflow-hidden">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "Heavy rain, heatwave, AQI spike, or outage: GigShield pays by trigger, not paperwork.",
            "तेज बारिश, भीषण गर्मी, AQI बढ़ने या आउटेज में GigShield ट्रिगर से भुगतान करता है, कागज़ी प्रक्रिया से नहीं।",
          )}
        </div>

        <header className="flex items-center justify-between border-b border-coal-200 px-4 py-4 sm:px-6">
          <div className="bg-coal-900 px-3 py-1">
            <p className="hero-title text-2xl leading-none text-white sm:text-3xl">
              GIGSHIELD.
            </p>
          </div>

          <nav className="hidden items-center gap-5 text-sm font-medium text-coal-500 lg:flex">
            {navItems.map((item) =>
              item.key === "pricing" ||
              item.key === "product" ||
              item.key === "triggers" ||
              item.key === "fraud" ? (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    navigate(
                      item.key === "pricing"
                        ? "/pricing"
                        : item.key === "product"
                          ? "/product"
                          : item.key === "triggers"
                            ? "/triggers"
                            : "/fraud-guard",
                    )
                  }
                  className="underline-offset-4 transition hover:text-coal-900 hover:underline"
                >
                  {item.label}
                </button>
              ) : (
                <span key={item.key}>{item.label}</span>
              ),
            )}
          </nav>

          <LanguageToggle
            languageMode={languageMode}
            setLanguageMode={setLanguageMode}
          />

          <button
            type="button"
            onClick={() => navigate("/get-protected")}
            className="primary-btn"
          >
            {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="secondary-btn"
          >
            {selectLabel(languageMode, "Sign In", "साइन इन")}
          </button>
        </header>

        <div className="px-4 pb-8 pt-8 sm:px-6 sm:pt-10 lg:pb-10">
          <p className="kicker">{selectLabel(languageMode, "Parametric Income Insurance", "पैरामेट्रिक आय बीमा")}</p>
          <h1 className="hero-title mt-4 max-w-5xl text-[3rem] leading-[0.9] sm:text-[4.4rem] lg:text-[5.7rem]">
            {selectLabel(languageMode, "Protect income.", "आय सुरक्षित रखें।")}
            <br />
            <span className="inline-block bg-electric-500 px-3 py-0.5 text-white">
              {selectLabel(languageMode, "Ride", "चलें")}
            </span>{" "}
            {selectLabel(languageMode, "through every disruption.", "हर व्यवधान के बीच।")}
          </h1>
          <p className="mt-5 max-w-3xl text-base text-coal-500 sm:text-lg">
            {selectLabel(
              languageMode,
              "GigShield protects delivery workers across Zomato and Swiggy with automatic payouts triggered by environmental and platform events.",
              "GigShield Zomato और Swiggy जैसे प्लेटफॉर्म पर काम करने वाले डिलीवरी वर्कर्स की सुरक्षा करता है और पर्यावरण/प्लेटफॉर्म इवेंट पर स्वतः भुगतान देता है।",
            )}
          </p>

          <div className="mt-9 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <article className="board-soft p-4">
              <p className="kicker">{selectLabel(languageMode, "Trigger Engine", "ट्रिगर इंजन")}</p>
              <p className="mt-2 font-semibold text-coal-900">
                {selectLabel(languageMode, "Heavy Rain, Heatwave, AQI Spike, Outage", "तेज बारिश, लू, AQI बढ़ना, आउटेज")}
              </p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">{selectLabel(languageMode, "Decisioning", "निर्णय प्रणाली")}</p>
              <p className="mt-2 font-semibold text-coal-900">
                {selectLabel(languageMode, "AI signal fusion and payout thresholds", "AI संकेत संयोजन और भुगतान सीमा")}
              </p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">{selectLabel(languageMode, "Fraud Control", "फ्रॉड नियंत्रण")}</p>
              <p className="mt-2 font-semibold text-coal-900">
                {selectLabel(languageMode, "Risk scoring with verification gates", "सत्यापन गेट के साथ जोखिम स्कोरिंग")}
              </p>
            </article>
            <article className="board-soft p-4">
              <p className="kicker">{selectLabel(languageMode, "Demo Promise", "डेमो वादा")}</p>
              <p className="mt-2 font-semibold text-coal-900">
                {selectLabel(languageMode, "End-to-end flow in under 2 minutes", "2 मिनट से कम में पूरा एंड-टू-एंड फ्लो")}
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
