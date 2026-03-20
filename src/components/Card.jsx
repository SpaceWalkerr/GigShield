/*
 * Shared card wrapper used by each dashboard module to keep visual hierarchy consistent.
 */
function HeaderIcon({ icon }) {
  const baseClasses = "h-5 w-5 text-coal-700";

  if (icon === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClasses}>
        <path d="M12 3l7 3v6c0 5-3.3 8.5-7 9.9C8.3 20.5 5 17 5 12V6l7-3z" />
        <path d="M9.5 12.5l1.8 1.8 3.2-3.2" />
      </svg>
    );
  }

  if (icon === "money") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClasses}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M7 10h.01M17 14h.01" />
      </svg>
    );
  }

  if (icon === "trigger") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClasses}>
        <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
      </svg>
    );
  }

  if (icon === "risk") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClasses}>
        <path d="M12 3l9 16H3L12 3z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (icon === "activity") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClasses}>
        <path d="M3 12h4l2-4 4 8 2-4h6" />
      </svg>
    );
  }

  if (icon === "camera") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClasses}>
        <path d="M4 8h3l1.5-2h7L17 8h3v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
    );
  }

  return null;
}

function Card({ title, subtitle, children, className = "", eyebrow = "", icon = "" }) {
  return (
    <section className={`board animate-enter p-5 sm:p-6 ${className}`}>
      <header className="mb-5 border-b border-coal-100 pb-4">
        {eyebrow ? <p className="kicker">{eyebrow}</p> : null}
        <div className="flex items-center gap-2.5">
          {icon ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-coal-200 bg-coal-50">
              <HeaderIcon icon={icon} />
            </span>
          ) : null}
          <h2 className="text-xl font-bold tracking-tight text-coal-900 sm:text-2xl">
            {title}
          </h2>
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm text-coal-600">{subtitle}</p>
        ) : null}
      </header>
      <div>{children}</div>
    </section>
  );
}

export default Card;
