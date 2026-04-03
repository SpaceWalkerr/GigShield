import { useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Marquee from "react-fast-marquee";
import { Zap, Menu, X, ArrowUp, CloudRain, Wind, WifiOff, MapPinOff, Activity, ScanFace, Lock, CheckCircle2 } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const isHomePage = location.pathname === "/";

  const handleNavClick = (key) => {
    if (key === "about") {
      if (isHomePage) {
        const element = document.getElementById("about-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        } else {
          // If not found yet, navigate with hash as fallback
          navigate("/#about-section");
        }
      } else {
        navigate("/#about-section");
      }
    } else {
      navigate(`/${key}`);
    }
  };

  // Handle hash scrolling on page load/navigation
  useEffect(() => {
    if (location.hash === "#about-section") {
      // Small timeout to allow the LandingPage to mount and render
      const timer = setTimeout(() => {
        const element = document.getElementById("about-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        } else if (!isHomePage) {
          // If we're not on home but have the hash, something is wrong, redirect
          navigate("/", { replace: true });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.pathname, isHomePage, navigate]);


  return (
    <div className="fixed top-0 left-0 right-0 z-[100] w-full flex flex-col">
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

      {/* Navigation Bar */}
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-8 flex-none transition-all duration-300">
        <div 
          className="cursor-pointer rounded bg-[#f4f5f7]/90 px-3 py-1 text-xl md:text-2xl font-bold tracking-tight text-gray-900 backdrop-blur-sm shadow-sm border border-white/60" 
          onClick={() => navigate("/")}
        >
          GIGSHIELD.
        </div>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-6 rounded-full bg-[#f4f5f7]/80 px-6 py-2 font-medium shadow-sm backdrop-blur-md lg:flex border border-white/40">
          <button
            onClick={() => handleNavClick("product")}
            className="text-gray-900 transition-colors hover:text-gray-600 text-sm"
          >
            {selectLabel(languageMode, "Product", "उत्पाद")}
          </button>
          <button
            onClick={() => handleNavClick("about")}
            className="text-gray-900 transition-colors hover:text-gray-600 text-sm"
          >
            {selectLabel(languageMode, "About", "बारे में")}
          </button>
          <button
            onClick={() => handleNavClick("pricing")}
            className="text-gray-900 transition-colors hover:text-gray-600 text-sm"
          >
            {selectLabel(languageMode, "Pricing", "कीमत")}
          </button>
          
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
            className="rounded-full bg-[#202A36] px-6 py-2.5 font-medium text-white shadow-lg transition-all hover:bg-[#1a2229] hover:shadow-xl text-sm"
          >
            {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/signin")}
            className="rounded-full bg-white px-6 py-2.5 font-medium text-gray-900 shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl border border-gray-200 text-sm"
          >
            {selectLabel(languageMode, "Sign In", "साइन इन")}
          </button>
        </div>
      </nav>
    </div>
  );
}
