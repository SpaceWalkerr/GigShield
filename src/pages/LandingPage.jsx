import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Menu, X, Zap, ShieldCheck, Wallet, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Marquee from "react-fast-marquee";
import LanguageToggle from "../components/LanguageToggle";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const container = useRef();

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Hero text stagger
      gsap.from(".hero-text", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.2
      });
      
      // Floating icons loop animation
      gsap.to(".floating-icon", {
        y: -8,
        yoyo: true,
        repeat: -1,
        duration: 2,
        ease: "sine.inOut"
      });
      // Feature text stagger
      gsap.from(".feature-text", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        delay: 0.8
      });
      // Bottom cards stagger
      gsap.from(".info-card", {
        scrollTrigger: {
          trigger: ".cards-container",
          start: "top 90%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out"
      });
    }, container);
    
    return () => ctx.revert();
  }, []);

  const navItems = [
    { key: "product", label: selectLabel(languageMode, "Product", "उत्पाद") },
    { key: "triggers", label: selectLabel(languageMode, "Triggers", "ट्रिगर्स") },
    { key: "fraud", label: selectLabel(languageMode, "Fraud Guard", "फ्रॉड गार्ड") },
    { key: "pricing", label: selectLabel(languageMode, "Pricing", "कीमत") },
  ];

  const handleNavClick = (key) => {
    navigate(
      key === "pricing"
        ? "/pricing"
        : key === "product"
          ? "/product"
          : key === "triggers"
            ? "/triggers"
            : "/fraud-guard"
    );
    setIsMobileMenuOpen(false);
  };

  const toggleMenu = () => setIsMobileMenuOpen((prev) => !prev);

  return (
    <div ref={container} className="min-h-screen bg-[#f4f5f7] font-sans flex flex-col">
      {/* Marquee Top Strip */}
      <div className="relative z-20 w-full bg-[#1a2229] py-2 overflow-hidden flex items-center shadow-md">
        <Marquee speed={40} direction="left" gradient={false} className="text-sm font-semibold tracking-widest text-[#f4cf3f]">
          {selectLabel(
            languageMode,
            "⚡ Ramesh Kumar received ₹30 payback for Heavy Rain   •   ⚡ Suresh triggered ₹50 payout for Heatwave   •   ⚡ Amit got ₹40 for AQI spike   •   ⚡ Vikram received ₹60 for Delhi Outage   •   ⚡ GigShield pays by trigger, not paperwork!",
            "⚡ रमेश कुमार को भारी बारिश के लिए ₹30 मिले   •   ⚡ सुरेश को लू के लिए ₹50 मिले   •   ⚡ अमित को AQI के लिए ₹40 मिले   •   ⚡ GigShield ट्रिगर से भुगतान करता है!"
          )}
        </Marquee>
      </div>

      {/* Hero section */}
      <div className="relative flex-1 flex flex-col min-h-[calc(100vh-36px)]">
        <img
          src="/rider.png"
          alt="Delivery Rider Minimal 3D"
          className="absolute inset-0 h-full w-full object-cover opacity-30 z-0 mix-blend-multiply"
        />

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-1 flex-col">
          {/* Navigation Bar */}
          <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-8 flex-none">
            <div className="cursor-pointer rounded bg-[#f4f5f7]/90 px-3 py-1 text-xl md:text-2xl font-bold tracking-tight text-gray-900 backdrop-blur-sm shadow-sm" onClick={() => navigate("/")}>
              GIGSHIELD.
            </div>

            {/* Desktop Menu */}
            <div className="hidden items-center gap-6 rounded-full bg-[#f4f5f7]/80 px-6 py-2 font-medium shadow-sm backdrop-blur-md lg:flex border border-white/40">
              <button
                onClick={() => handleNavClick("product")}
                className="text-gray-900 transition-colors hover:text-gray-600"
              >
                {selectLabel(languageMode, "Product", "उत्पाद")}
              </button>
              <button
                onClick={() => handleNavClick("pricing")}
                className="text-gray-900 transition-colors hover:text-gray-600"
              >
                {selectLabel(languageMode, "Pricing", "कीमत")}
              </button>
              
              <div className="mx-2 h-5 border-l border-gray-300" />
              
              {/* Desktop Hamburger for hidden items */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-900 hover:text-gray-600 transition-colors">
                  <Menu size={20} />
                </button>
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-white/60 bg-white/95 p-2 shadow-xl backdrop-blur-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => handleNavClick("triggers")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    {selectLabel(languageMode, "Triggers", "ट्रिगर्स")}
                  </button>
                  <button
                    onClick={() => handleNavClick("fraud")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    {selectLabel(languageMode, "Fraud Guard", "फ्रॉड गार्ड")}
                  </button>
                </div>
              </div>

              <div className="mx-2 h-5 border-l border-gray-300" />
              
              <LanguageToggle
                languageMode={languageMode}
                setLanguageMode={setLanguageMode}
              />
            </div>

            <div className="hidden md:flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/get-protected")}
                className="rounded-full bg-[#202A36] px-6 py-2.5 font-medium text-white shadow-lg transition-all hover:bg-[#1a2229] hover:shadow-xl"
              >
                {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="rounded-full bg-white px-6 py-2.5 font-medium text-gray-900 shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl border border-gray-200"
              >
                {selectLabel(languageMode, "Sign In", "साइन इन")}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="rounded-full bg-[#f4f5f7]/80 p-2 text-gray-900 shadow-sm backdrop-blur-sm focus:outline-none lg:hidden"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </nav>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute left-4 right-4 top-24 z-20 rounded-2xl border border-white/20 bg-white/95 p-6 shadow-xl backdrop-blur-lg lg:hidden">
              <div className="flex flex-col gap-4 text-center font-medium">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.key)}
                    className="border-b border-gray-100 py-2 text-gray-900 transition-colors hover:text-gray-600 last:border-0"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex justify-center pt-2">
                  <LanguageToggle
                    languageMode={languageMode}
                    setLanguageMode={setLanguageMode}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/get-protected")}
                  className="mt-4 rounded-full bg-[#202A36] px-6 py-3 font-medium text-white transition-colors hover:bg-[#1a2229]"
                >
                  {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="rounded-full bg-gray-100 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-200"
                >
                  {selectLabel(languageMode, "Sign In", "साइन इन")}
                </button>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="pointer-events-none flex flex-1 flex-col items-center justify-center py-12 px-4 md:py-20 flex-shrink-0">
            <div className="pointer-events-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
              <span className="mb-6 flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-gray-800 shadow-sm backdrop-blur-md">
                <Zap size={14} className="text-gray-400" />
                {selectLabel(languageMode, "Parametric Income Insurance", "पैरामेट्रिक आय बीमा")}
                <Zap size={14} className="text-gray-400" />
              </span>
              <div className="flex flex-col items-center space-y-2 md:space-y-0 relative">
                <div className="absolute -left-16 top-[-20px] md:-left-28 md:-top-10 hidden sm:block hero-text">
                  <img src="/shield.png" alt="" className="floating-icon h-16 w-16 md:h-32 md:w-32 object-contain mix-blend-multiply opacity-70" />
                </div>
                <h1 className="hero-text text-5xl font-medium leading-none tracking-tight text-gray-800 md:text-7xl lg:text-[5.5rem] drop-shadow-md">
                   {selectLabel(languageMode, "Protect income.", "आय सुरक्षित रखें।")}
                </h1>
                <h1 className="hero-text text-5xl font-extrabold leading-none tracking-tight text-[#1a2229] md:text-7xl lg:text-[5.5rem] drop-shadow-md">
                   {selectLabel(languageMode, "Ride through every disruption.", "हर व्यवधान के बीच।")}
                </h1>
                <div className="absolute -right-16 bottom-[0px] md:-right-24 md:bottom-2 hidden sm:block hero-text">
                  <img src="/lightning.png" alt="" className="floating-icon h-12 w-12 md:h-24 md:w-24 object-contain mix-blend-multiply opacity-70" />
                </div>
              </div>
              <p className="hero-text mb-8 mt-8 max-w-3xl text-sm md:text-xl text-gray-900 bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/40 font-medium leading-relaxed">
                {selectLabel(
                  languageMode,
                  "GigShield protects delivery workers across Zomato and Swiggy with automatic payouts triggered by environmental and platform events.",
                  "GigShield Zomato और Swiggy जैसे प्लेटफॉर्म पर काम करने वाले डिलीवरी वर्कर्स की सुरक्षा करता है और पर्यावरण/प्लेटफॉर्म इवेंट पर स्वतः भुगतान देता है।"
                )}
              </p>
              
              <div className="hero-text flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/get-protected")}
                  className="rounded-full bg-[#1a2229] px-8 py-3.5 text-lg font-semibold text-white shadow-xl transition-all hover:bg-gray-800 hover:-translate-y-1"
                >
                  {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="rounded-full bg-white/90 px-8 py-3.5 text-lg font-semibold text-gray-900 shadow-xl transition-all hover:bg-white hover:-translate-y-1 border border-gray-200 backdrop-blur-md"
                >
                  {selectLabel(languageMode, "Sign In", "साइन इन")}
                </button>
              </div>

              {/* Additional GigShield Info Section */}
              <div className="mt-16 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left pointer-events-auto bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-lg">
                 <div className="feature-text">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0 shadow-sm border border-gray-100">
                      <Zap className="h-5 w-5 text-gray-700" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl tracking-tight">
                       {selectLabel(languageMode, "Zero Paperwork", "शून्य कागजी कार्रवाई")}
                    </h3>
                    <p className="text-gray-700 mt-2 text-sm leading-relaxed font-medium">
                       {selectLabel(languageMode, "No claims to file. Once weather or platform metrics hit the limit, money goes straight to your wallet.", "कोइ क्लेम दर्ज करने की जरूरत नहीं। मानक पूरे होते ही पैसा सीधे आपके वॉलेट में।")}
                    </p>
                 </div>
                 <div className="feature-text">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0 shadow-sm border border-gray-100">
                      <ShieldCheck className="h-5 w-5 text-gray-700" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl tracking-tight">
                       {selectLabel(languageMode, "Full Coverage", "पूर्ण कवरेज")}
                    </h3>
                    <p className="text-gray-700 mt-2 text-sm leading-relaxed font-medium">
                       {selectLabel(languageMode, "Protect your daily goals against App Outages, unrideable AQI, floods, and severe heatwaves.", "ऐप आउटेज, खराब AQI, बाढ़ और भयंकर लू के दौरान अपने दैनिक लक्ष्यों को सुरक्षित रखें।")}
                    </p>
                 </div>
                 <div className="feature-text">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0 shadow-sm border border-gray-100">
                      <Wallet className="h-5 w-5 text-gray-700" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl tracking-tight">
                       {selectLabel(languageMode, "Guaranteed Income", "सुरक्षित आय")}
                    </h3>
                    <p className="text-gray-700 mt-2 text-sm leading-relaxed font-medium">
                       {selectLabel(languageMode, "Maintain financial stability and ride with peace of mind knowing GigShield has your back every day.", "वित्तीय स्थिरता बनाए रखें और निर्बाध रूप से राइड करें, GigShield हमेशा आपके साथ है।")}
                    </p>
                 </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Info Cards */}
          <div className="w-full bg-gradient-to-t from-[#f4f5f7]/95 via-[#f4f5f7]/80 to-transparent pt-24 pb-12 z-10 px-4 md:px-8 mt-auto pointer-events-auto flex-none">
             <div className="cards-container mx-auto max-w-7xl">
                <div className="grid gap-4 sm:gap-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <article className="info-card rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/90">
                    <img src="/lightning.png" alt="" className="floating-icon h-10 w-10 md:h-14 md:w-14 object-contain mb-4 drop-shadow-sm mix-blend-multiply" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{selectLabel(languageMode, "Trigger Engine", "ट्रिगर इंजन")}</p>
                    <p className="mt-3 font-semibold text-gray-900 text-sm md:text-base leading-snug">
                       {selectLabel(languageMode, "Heavy Rain, Heatwave, AQI Spike, Outage", "तेज बारिश, लू, AQI बढ़ना, आउटेज")}
                    </p>
                  </article>
                  <article className="info-card rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/90">
                    <img src="/ai.png" alt="" className="floating-icon h-10 w-10 md:h-14 md:w-14 object-contain mb-4 drop-shadow-sm mix-blend-multiply" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{selectLabel(languageMode, "Decisioning", "निर्णय प्रणाली")}</p>
                    <p className="mt-3 font-semibold text-gray-900 text-sm md:text-base leading-snug">
                       {selectLabel(languageMode, "AI signal fusion & payout thresholds", "AI संकेत संयोजन और भुगतान सीमा")}
                    </p>
                  </article>
                  <article className="info-card rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/90">
                    <img src="/lock.png" alt="" className="floating-icon h-10 w-10 md:h-14 md:w-14 object-contain mb-4 drop-shadow-sm mix-blend-multiply" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{selectLabel(languageMode, "Fraud Control", "फ्रॉड नियंत्रण")}</p>
                    <p className="mt-3 font-semibold text-gray-900 text-sm md:text-base leading-snug">
                       {selectLabel(languageMode, "Risk scoring with verification gates", "सत्यापन गेट के साथ जोखिम स्कोरिंग")}
                    </p>
                  </article>
                  <article className="info-card rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/90">
                    <img src="/shield.png" alt="" className="floating-icon h-10 w-10 md:h-14 md:w-14 object-contain mb-4 drop-shadow-sm mix-blend-multiply" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{selectLabel(languageMode, "Demo Promise", "डेमो वादा")}</p>
                    <p className="mt-3 font-semibold text-gray-900 text-sm md:text-base leading-snug">
                       {selectLabel(languageMode, "End-to-end flow in under 2 minutes", "2 मिनट से कम में पूरा एंड-टू-एंड फ्लो")}
                    </p>
                  </article>
                </div>
             </div>
          </div>

          <div className="w-full pb-8 flex justify-center z-10 pointer-events-auto">
             <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md"
             >
                <ArrowUp className="w-4 h-4" />
                {selectLabel(languageMode, "Back to Top", "शीर्ष पर वापस जाएं")}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
