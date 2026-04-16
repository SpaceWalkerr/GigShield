import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Marquee from "react-fast-marquee";
import { ArrowRight, Menu, X } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";
import { supabase } from "../utils/supabase";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const isHomePage = location.pathname === "/";
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Product", path: "/product" },
    { label: "Pricing", path: "/pricing" },
    { label: "Triggers", path: "/triggers" },
    { label: "Fraud Guard", path: "/fraud-guard" },
    { label: "Get Protected", path: "/get-protected" },
    { label: "Sign In", path: "/signin" },
    { label: "Sign Up", path: "/signup" },
    { label: "Auth Hub", path: "/auth" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Payout", path: "/payout" },
    { label: "Receipt", path: "/payout-received" },
    { label: "History", path: "/payout-history" },
    { label: "Predictive", path: "/predictive-history" },
    { label: "Heatmap", path: "/community-heatmap" },
    { label: "Team", path: "/team-protection" },
    { label: "Trust", path: "/trust-center" },
    { label: "Support", path: "/support" },
    { label: "Admin Hub", path: "/admin" },
    { label: "Admin", path: "/admin-ops" },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const navigateTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleNavClick = (key) => {
    setMenuOpen(false);
    if (key === "about") {
      if (isHomePage) {
        const element = document.getElementById("about-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        } else {
          // If not found yet, navigate with hash as fallback
          navigateTo("/#about-section");
        }
      } else {
        navigateTo("/#about-section");
      }
    } else {
      navigateTo(`/${key}`);
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
      <div className="relative z-20 flex w-full items-center overflow-hidden border-b border-white/8 bg-black/55 py-2 shadow-md backdrop-blur-xl">
        <Marquee
          speed={40}
          direction="left"
          gradient={false}
          className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-200/80"
        >
          {selectLabel(
            languageMode,
            "Heavy rain protected this week’s earnings • AQI spike auto-triggered support • Platform outage payout settled instantly • Weekly protection built for gig workers",
            "भारी बारिश पर इस सप्ताह की कमाई सुरक्षित • AQI बढ़ने पर सहायता शुरू • प्लेटफॉर्म आउटेज पर तुरंत भुगतान • गिग वर्कर्स के लिए साप्ताहिक सुरक्षा",
          )}
        </Marquee>
      </div>

      <nav className="mx-auto mt-2 w-[min(96%,92rem)] flex-none rounded-[1.75rem] border border-white/10 bg-black/25 px-3 py-3 backdrop-blur-xl transition-all duration-300 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <button
            className="cursor-pointer rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-lg font-bold tracking-tight text-white sm:text-xl md:text-2xl"
            onClick={() => navigateTo("/")}
          >
            GIGSHIELD.
          </button>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              onClick={() => handleNavClick("about")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                location.hash === "#about-section"
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {selectLabel(languageMode, "About", "बारे में")}
            </button>
            <LanguageToggle
              languageMode={languageMode}
              setLanguageMode={setLanguageMode}
            />
            {user ? (
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigateTo("/signin");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08]"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo("/signin")}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg transition-all hover:bg-zinc-200 hover:shadow-xl"
              >
                {selectLabel(
                  languageMode,
                  "Sign in with Google",
                  "Google से साइन इन",
                )}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageToggle
              languageMode={languageMode}
              setLanguageMode={setLanguageMode}
            />
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="mt-3 hidden lg:block">
          <div className="flex items-center gap-2 overflow-x-auto rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigateTo(item.path)}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                    active
                      ? "bg-white text-zinc-950"
                      : "bg-transparent text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {menuOpen ? (
          <div className="mt-3 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-3 lg:hidden">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleNavClick("about")}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-xs font-black uppercase tracking-[0.18em] text-zinc-100"
              >
                About
              </button>
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigateTo(item.path)}
                    className={`rounded-2xl border px-4 py-3 text-left text-xs font-black uppercase tracking-[0.18em] transition ${
                      active
                        ? "border-white bg-white text-zinc-950"
                        : "border-white/10 bg-white/[0.03] text-zinc-100"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              {user ? (
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigateTo("/signin");
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-100"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo("/signin")}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950"
                >
                  {selectLabel(languageMode, "Sign in with Google", "Google से साइन इन")}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </nav>
    </div>
  );
}
