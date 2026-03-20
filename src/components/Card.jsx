import { selectLabel } from "../utils/i18n";

/*
 * Shared card wrapper used by each dashboard module to keep visual hierarchy consistent.
 */
function Card({ title, subtitle, children, className = "", languageMode = "both" }) {
  return (
    <section className={`board animate-enter p-5 sm:p-6 ${className}`}>
      <header className="mb-5 border-b border-coal-100 pb-4">
        <p className="kicker">
          {selectLabel(languageMode, "Dashboard Module", "Dashboard Section")}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-coal-900">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-sm text-coal-500">{subtitle}</p>
        ) : null}
      </header>
      <div>{children}</div>
    </section>
  );
}

export default Card;
