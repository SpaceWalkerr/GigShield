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

function PayoutReceivedPage() {
  const { languageMode, setLanguageMode } = useSiteLanguage();
  const receipt = getPayoutReceipt();

  return (
    <main className="min-h-screen bg-[#f4f5f7] pb-24 text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">GIGSHIELD.</Link>
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200">
            Success
          </span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle languageMode={languageMode} setLanguageMode={setLanguageMode} />
          <Link to="/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
            {selectLabel(languageMode, "Dashboard", "डैशबोर्ड")}
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20 text-center">
        {!receipt || !receipt.receivedAt ? (
           <div className="space-y-6">
             <h1 className="text-4xl font-black tracking-tighter">No Payment Found</h1>
             <p className="text-sm font-bold text-gray-500 italic">Please initiate a payout from the dashboard first.</p>
             <Link to="/dashboard" className="primary-btn">Go to Dashboard</Link>
           </div>
        ) : (
          <>
            <header className="mb-12">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">
                {selectLabel(languageMode, "Funds Settled", "धनराशि सेटलमेंट")}
              </p>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none mb-6">
                {formatCurrency(receipt.payoutAmount ?? 0)}
              </h1>
              <p className="text-sm font-extrabold text-gray-900">
                {selectLabel(languageMode, "Receipt sent to your registered email.", "रसीद आपके पंजीकृत ईमेल पर भेज दी गई है।")}
              </p>
            </header>

            <div className="bg-white border-2 border-gray-900 rounded-3xl p-8 shadow-2xl text-left space-y-6 mb-12">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{selectLabel(languageMode, "Trigger Event", "ट्रिगर इवेंट")}</p>
                  <p className="text-sm font-black">{receipt.triggerLabel || receipt.triggerId}</p>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{selectLabel(languageMode, "Payout ID", "भुगतान आईडी")}</p>
                    <p className="text-xs font-bold text-gray-500 font-mono">{receipt.payoutId || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{selectLabel(languageMode, "Received At", "प्राप्त समय")}</p>
                    <p className="text-xs font-bold text-gray-500">{new Date(receipt.receivedAt).toLocaleTimeString()}</p>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/dashboard" className="primary-btn py-4">
                {selectLabel(languageMode, "Back to dashboard", "डैशबोर्ड पर वापस")}
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="secondary-btn" onClick={() => downloadReceiptPdf(receipt)}>
                  PDF Receipt
                </button>
                <button type="button" className="secondary-btn" onClick={() => downloadReceiptJson(receipt)}>
                  JSON Data
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default PayoutReceivedPage;
