import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";
import { supabase } from "../utils/supabase";
import { signOutSession } from "../services/backend/sessionService";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Product", path: "/product" },
    { label: "Income Radar", path: "/income-radar" },
    { label: "Pricing", path: "/pricing" },
    { label: "Protection", path: "/triggers" },
    { label: "Demo Story", path: "/judge-demo" },
    { label: "Get Protected", path: "/get-protected" },
  ];

  const isNavItemActive = (path) => {
    if (path === "/judge-demo") {
      return [
        "/judge-demo",
        "/dashboard",
        "/payout",
        "/payout-received",
        "/payout-history",
        "/predictive-history",
        "/community-heatmap",
        "/team-protection",
        "/support",
      ].includes(location.pathname);
    }

    if (path === "/triggers") {
      return ["/triggers", "/fraud-guard", "/trust-center", "/admin", "/admin-ops"].includes(location.pathname);
    }

    if (path === "/income-radar") {
      return location.pathname === "/income-radar";
    }

    return location.pathname === path;
  };

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

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] w-full">
      <nav className="mx-3 mt-4 rounded-[1.35rem] border border-white/10 bg-[rgba(7,10,15,0.78)] px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:mx-4 sm:px-6 lg:mx-6 xl:mx-8">
        <div className="flex items-center justify-between gap-3">
          <button
            className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-base font-black tracking-[0.18em] text-white sm:text-lg"
            onClick={() => navigateTo("/")}
          >
            GIGSHIELD
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
              {navItems.map((item) => {
                const active = isNavItemActive(item.path);
                const isPrimary = item.path === "/get-protected";
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigateTo(item.path)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition ${
                      isPrimary
                        ? "bg-cyan-300 text-zinc-950 shadow-[0_10px_30px_rgba(103,232,249,0.22)] hover:bg-cyan-200"
                        : active
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <LanguageToggle
              languageMode={languageMode}
              setLanguageMode={setLanguageMode}
            />
            {user ? (
              <button
                type="button"
                onClick={async () => {
                  await signOutSession();
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
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg transition-all hover:bg-zinc-200 hover:shadow-xl"
              >
                {selectLabel(
                  languageMode,
                  "Access",
                  "डेमो एक्सेस",
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

        {menuOpen ? (
          <div className="mt-3 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-3 lg:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => {
                const active = isNavItemActive(item.path);
                const isPrimary = item.path === "/get-protected";
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigateTo(item.path)}
                    className={`rounded-2xl border px-4 py-3 text-left text-xs font-black uppercase tracking-[0.18em] transition ${
                      isPrimary
                        ? "border-cyan-200 bg-cyan-300 text-zinc-950"
                        : active
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
                    await signOutSession();
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
                  {selectLabel(languageMode, "Judge Demo Access", "डेमो एक्सेस")}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </nav>
    </div>
  );
}
