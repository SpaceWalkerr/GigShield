import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useSiteLanguage } from "../utils/siteLanguage";
import { selectLabel } from "../utils/i18n";
import { formatCurrency } from "../utils/format";
import { getFailureReasonLabel, getPayoutHistory } from "../utils/payoutReceipt";
import { AppPageShell, AppSurface } from "@/components/ui/app-page-shell";

function PayoutHistoryPage() {
  const { languageMode } = useSiteLanguage();
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
    <AppPageShell
      badge="Ledger"
      title={selectLabel(languageMode, "Payout ledger", "भुगतान लेखा")}
      description={selectLabel(languageMode, "Track every support payout, filter by trigger or lifecycle status, and review which events were automatically approved or blocked.", "हर भुगतान को ट्रैक करें, ट्रिगर या स्थिति के आधार पर फ़िल्टर करें, और देखें क्या मंजूर हुआ और क्या रोका गया।")}
    >
        <AppSurface className="mb-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectLabel(languageMode, "From date", "शुरू तारीख")}</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:border-gray-900 focus:outline-none transition-colors"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectLabel(languageMode, "To date", "अंत तारीख")}</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:border-gray-900 focus:outline-none transition-colors"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectLabel(languageMode, "Trigger type", "ट्रिगर प्रकार")}</span>
              <select
                value={triggerFilter}
                onChange={(event) => setTriggerFilter(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:border-gray-900 focus:outline-none appearance-none transition-colors"
              >
                {triggerOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectLabel(languageMode, "Status", "स्थिति")}</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:border-gray-900 focus:outline-none appearance-none transition-colors"
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </AppSurface>

        <section className="space-y-4">
          {filtered.length === 0 ? (
            <AppSurface className="border-dashed text-center">
              <p className="text-sm font-bold text-zinc-500 italic">
                {selectLabel(languageMode, "No records found.", "कोई रिकॉर्ड नहीं मिला।")}
              </p>
            </AppSurface>
          ) : (
            filtered.map((item) => (
              <AppSurface key={item.payoutId}>
                <div className="flex flex-wrap items-center justify-between gap-6 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/8 flex items-center justify-center text-cyan-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{formatCurrency(item.payoutAmount || 0)}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{item.triggerLabel || item.triggerId || "-"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      item.lifecycleStatus === 'settled' ? 'bg-green-500/10 border-green-400/20 text-green-300' : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}>
                      {item.lifecycleStatus}
                    </span>
                    {item.failureReasonCode?.startsWith("POLICY_") && (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-400/20 text-[9px] font-black uppercase tracking-widest text-red-300">
                        Exclusion
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-white/8">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Created</p>
                    <p className="text-[10px] font-bold text-zinc-300 italic">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">ID</p>
                    <p className="text-[10px] font-bold text-zinc-300 font-mono tracking-tighter">{item.payoutId || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Analysis Result</p>
                    <p className="text-[10px] font-bold text-zinc-300">{item.failureReasonCode ? getFailureReasonLabel(item.failureReasonCode) : "Automatic approval"}</p>
                  </div>
                </div>
              </AppSurface>
            ))
          )}
        </section>
    </AppPageShell>
  );
}

export default PayoutHistoryPage;
