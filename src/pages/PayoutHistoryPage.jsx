import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import LanguageToggle from "../components/LanguageToggle";
import { useSiteLanguage } from "../utils/siteLanguage";
import { selectLabel } from "../utils/i18n";
import { formatCurrency } from "../utils/format";
import { getFailureReasonLabel, getPayoutHistory } from "../utils/payoutReceipt";

function PayoutHistoryPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const [history] = useState(() => getPayoutHistory());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const triggerOptions = useMemo(() => {
    const set = new Set(history.map((item) => item.triggerId).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [history]);

  const statusOptions = useMemo(() => {
    const set = new Set(history.map((item) => item.lifecycleStatus).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [history]);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
      if (!createdAt) {
        return false;
      }

      if (dateFrom) {
        const fromDate = new Date(`${dateFrom}T00:00:00`);
        if (createdAt < fromDate) {
          return false;
        }
      }

      if (dateTo) {
        const toDate = new Date(`${dateTo}T23:59:59`);
        if (createdAt > toDate) {
          return false;
        }
      }

      if (triggerFilter !== "all" && item.triggerId !== triggerFilter) {
        return false;
      }

      if (statusFilter !== "all" && item.lifecycleStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [dateFrom, dateTo, history, statusFilter, triggerFilter]);

  return (
    <main className="frame-shell min-h-screen py-6 sm:py-8">
      <section className="board animate-enter overflow-hidden">
        <div className="top-strip">
          {selectLabel(
            languageMode,
            "Track every payout with date, trigger, and lifecycle filters.",
            "तारीख, ट्रिगर और जीवनचक्र फ़िल्टर के साथ हर भुगतान ट्रैक करें।",
          )}
        </div>

        <header className="border-b border-coal-200 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="kicker">{selectLabel(languageMode, "Payout History", "भुगतान इतिहास")}</p>
              <h1 className="hero-title mt-3 text-4xl leading-[0.9] sm:text-5xl">
                {selectLabel(languageMode, "Payout ledger", "भुगतान लेखा")}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
              <Link to="/payout" className="secondary-btn">
                {selectLabel(languageMode, "Back to payout", "भुगतान पेज पर वापस")}
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 px-4 py-6 sm:px-6">
          <section className="board-soft p-4 sm:p-5">
            <p className="kicker">{selectLabel(languageMode, "Filters", "फ़िल्टर")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-semibold text-coal-600">
                {selectLabel(languageMode, "From date", "शुरू तारीख")}
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-coal-200 bg-white px-2 py-2 text-sm text-coal-900"
                />
              </label>
              <label className="text-xs font-semibold text-coal-600">
                {selectLabel(languageMode, "To date", "अंत तारीख")}
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-coal-200 bg-white px-2 py-2 text-sm text-coal-900"
                />
              </label>
              <label className="text-xs font-semibold text-coal-600">
                {selectLabel(languageMode, "Trigger type", "ट्रिगर प्रकार")}
                <select
                  value={triggerFilter}
                  onChange={(event) => setTriggerFilter(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-coal-200 bg-white px-2 py-2 text-sm text-coal-900"
                >
                  {triggerOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-coal-600">
                {selectLabel(languageMode, "Status", "स्थिति")}
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-coal-200 bg-white px-2 py-2 text-sm text-coal-900"
                >
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="grid gap-3">
            {filtered.length === 0 ? (
              <article className="board-soft p-4 text-sm text-coal-600">
                {selectLabel(languageMode, "No payout history for selected filters.", "चुने गए फ़िल्टर के लिए कोई भुगतान इतिहास नहीं मिला।")}
              </article>
            ) : (
              filtered.map((item) => (
                <article key={item.payoutId} className="rounded-xl border border-coal-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="kicker">{item.payoutId || "-"}</p>
                      <p className="mt-1 text-lg font-semibold text-coal-900">{formatCurrency(item.payoutAmount || 0)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-coal-200 bg-coal-50 px-3 py-1 text-xs font-semibold text-coal-700">
                        {item.lifecycleStatus || "-"}
                      </span>
                      {item.failureReasonCode?.startsWith("POLICY_") ? (
                        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          {selectLabel(languageMode, "Policy exclusion", "पॉलिसी अपवाद")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-coal-700 sm:grid-cols-2">
                    <p><span className="font-semibold">{selectLabel(languageMode, "Trigger", "ट्रिगर")}</span>: {item.triggerLabel || item.triggerId || "-"}</p>
                    <p><span className="font-semibold">{selectLabel(languageMode, "Status", "स्थिति")}</span>: {item.status || "-"}</p>
                    <p><span className="font-semibold">{selectLabel(languageMode, "Created", "बनाया गया")}</span>: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</p>
                    <p><span className="font-semibold">{selectLabel(languageMode, "Received", "प्राप्त")}</span>: {item.receivedAt ? new Date(item.receivedAt).toLocaleString() : "-"}</p>
                    <p><span className="font-semibold">{selectLabel(languageMode, "Failure code", "विफलता कोड")}</span>: {item.failureReasonCode || "-"}</p>
                    <p><span className="font-semibold">{selectLabel(languageMode, "Failure reason", "विफलता कारण")}</span>: {item.failureReasonCode ? getFailureReasonLabel(item.failureReasonCode) : "-"}</p>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default PayoutHistoryPage;
