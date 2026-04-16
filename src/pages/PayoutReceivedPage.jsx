import { Link } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { useSiteLanguage } from "../utils/siteLanguage";
import { selectLabel } from "../utils/i18n";
import { formatCurrency } from "../utils/format";
import {
  downloadReceiptJson,
  downloadReceiptPdf,
  getPayoutReceipt,
} from "../utils/payoutReceipt";
import { AppPageShell, AppSurface } from "../components/ui/app-page-shell";

function PayoutReceivedPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const receipt = getPayoutReceipt();

  return (
    <AppPageShell
      badge="Success"
      backTo="/dashboard"
      backLabel={selectLabel(languageMode, "Dashboard", "डैशबोर्ड")}
      actions={<LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />}
    >
      <div className="mx-auto max-w-2xl px-0 py-4 text-center sm:py-10">
        {!receipt || !receipt.receivedAt ? (
           <div className="space-y-6">
             <h1 className="text-4xl font-black tracking-tighter text-white">No Payment Found</h1>
             <p className="text-sm font-medium italic text-zinc-400">Please initiate a payout from the dashboard first.</p>
             <Link to="/dashboard" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-950 transition hover:bg-zinc-200">Go to Dashboard</Link>
           </div>
        ) : (
          <>
            <header className="mb-12">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                {selectLabel(languageMode, "Funds Settled", "धनराशि सेटलमेंट")}
              </p>
              <h1 className="mb-6 text-5xl font-black leading-none tracking-tighter text-white sm:text-6xl">
                {formatCurrency(receipt.payoutAmount ?? 0)}
              </h1>
              <p className="text-sm font-extrabold text-zinc-100">
                {selectLabel(languageMode, "Receipt sent to your registered email.", "रसीद आपके पंजीकृत ईमेल पर भेज दी गई है।")}
              </p>
            </header>

            <AppSurface className="mb-12 space-y-6 p-8 text-left">
               <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{selectLabel(languageMode, "Trigger Event", "ट्रिगर इवेंट")}</p>
                  <p className="text-sm font-black text-white">{receipt.triggerLabel || receipt.triggerId}</p>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{selectLabel(languageMode, "Payout ID", "भुगतान आईडी")}</p>
                    <p className="font-mono text-xs font-bold text-zinc-300">{receipt.payoutId || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{selectLabel(languageMode, "Received At", "प्राप्त समय")}</p>
                    <p className="text-xs font-bold text-zinc-300">{new Date(receipt.receivedAt).toLocaleTimeString()}</p>
                  </div>
               </div>
            </AppSurface>

            <div className="flex flex-col gap-3">
              <Link to="/dashboard" className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-950 transition hover:bg-zinc-200">
                {selectLabel(languageMode, "Back to dashboard", "डैशबोर्ड पर वापस")}
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.06]" onClick={() => downloadReceiptPdf(receipt)}>
                  PDF Receipt
                </button>
                <button type="button" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.06]" onClick={() => downloadReceiptJson(receipt)}>
                  JSON Data
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppPageShell>
  );
}

export default PayoutReceivedPage;
