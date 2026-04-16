import Card from "./Card";
import { selectLabel } from "../utils/i18n";
import {
  getRiskBadgeClasses,
  getRiskLevelFromScore,
  requiresVerification,
} from "../utils/fraud";

/*
 * Simulates fraud scoring from user behavior profiles.
 * The high-risk state exposes a verification gate to represent payout protection controls.
 */
function FraudDetectionIndicator({
  fraudProfiles,
  activePersonaKey,
  onPersonaChange,
  languageMode,
}) {
  const activeProfile = fraudProfiles[activePersonaKey];
  const riskLevel = getRiskLevelFromScore(activeProfile.score);
  const showVerification = requiresVerification(riskLevel);

  return (
    <Card
      icon="risk"
      languageMode={languageMode}
      title={
        selectLabel(languageMode, "Trust Check", "ट्रस्ट जांच")
      }
      subtitle={
        selectLabel(
          languageMode,
          "Keeps support safe for real workers",
          "यह असली वर्कर्स के लिए सहायता को सुरक्षित रखता है",
        )
      }
    >
      <div className="space-y-8">
        <div>
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {selectLabel(languageMode, "Demo: Choose Worker Profile", "डेमो: वर्कर प्रोफ़ाइल चुनें")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(fraudProfiles).map(([personaKey]) => {
              const isSelected = personaKey === activePersonaKey;
              return (
                <button
                  key={personaKey}
                  type="button"
                  onClick={() => onPersonaChange(personaKey)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-cyan-300/30 bg-white/[0.08] text-white shadow-lg shadow-cyan-950/20"
                      : "border-white/10 bg-white/[0.03] text-zinc-100 hover:border-white/20"
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-widest">
                    {personaKey === "normal"
                      ? selectLabel(languageMode, "Verified Worker", "सत्यापित वर्कर")
                      : selectLabel(languageMode, "Needs Extra Check", "अतिरिक्त जांच आवश्यक")}
                  </p>
                  <p className={`mt-1 text-[10px] font-bold opacity-70 ${isSelected ? "text-white" : "text-zinc-500"}`}>
                    {personaKey === "normal" ? selectLabel(languageMode, "Fast payout path", "तेज़ भुगतान मार्ग") : selectLabel(languageMode, "Verification needed", "सत्यापन आवश्यक")}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {selectLabel(languageMode, "Trust Score", "ट्रस्ट स्कोर")}
            </p>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter ring-1 ${getRiskBadgeClasses(riskLevel)}`}
            >
              {riskLevel}
            </span>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-5xl font-black tracking-tighter text-white">
              {activeProfile.score}<span className="ml-1 text-xl text-zinc-600">/100</span>
            </span>
          </div>

          {showVerification ? (
            <div className="animate-enter flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
              <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 animate-pulse" />
              <p className="text-xs font-bold leading-relaxed text-red-200">
                {selectLabel(languageMode, "Selfie check needed before payment. This protects genuine workers.", "भुगतान से पहले सेल्फी जांच जरूरी है। यह असली वर्कर्स की सुरक्षा करता है।")}
              </p>
            </div>
          ) : (
            <div className="animate-enter flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
              <p className="text-xs font-bold leading-relaxed text-emerald-200">
                {selectLabel(languageMode, "Profile verified. Payment can be sent instantly.", "प्रोफ़ाइल सत्यापित। भुगतान तुरंत भेजा जा सकता है।")}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default FraudDetectionIndicator;
