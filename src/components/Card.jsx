import { Activity, ShieldCheck, Wallet, Zap, Camera, AlertTriangle } from "lucide-react";

function HeaderIcon({ icon }) {
  const baseClasses = "h-5 w-5 text-zinc-900";

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
    <section className={`animate-enter rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl ${className}`}>
      <header className="mb-6 border-b border-white/10 pb-5">
        {eyebrow ? <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{eyebrow}</p> : null}
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/20">
              <HeaderIcon icon={icon} />
            </div>
          ) : null}
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-sm font-medium text-zinc-400">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="relative">{children}</div>
    </section>
  );
}

export default Card;

