import { Activity, ShieldCheck, Wallet, Zap, Camera, AlertTriangle } from "lucide-react";

function HeaderIcon({ icon }) {
  const baseClasses = "h-5 w-5 text-gray-700";

  switch (icon) {
    case "shield": return <ShieldCheck className={baseClasses} />;
    case "money": return <Wallet className={baseClasses} />;
    case "trigger": return <Zap className={baseClasses} />;
    case "risk": return <AlertTriangle className={baseClasses} />;
    case "activity": return <Activity className={baseClasses} />;
    case "camera": return <Camera className={baseClasses} />;
    default: return null;
  }
}

function Card({ title, subtitle, children, className = "", eyebrow = "", icon = "" }) {
  return (
    <section className={`animate-enter py-6 ${className}`}>
      <header className="mb-6 border-b border-gray-200 pb-5">
        {eyebrow ? <p className="kicker mb-2">{eyebrow}</p> : null}
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 border border-white/60 shadow-sm">
              <HeaderIcon icon={icon} />
            </div>
          ) : null}
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-gray-500 font-medium">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="relative">{children}</div>
    </section>
  );
}

export default Card;
