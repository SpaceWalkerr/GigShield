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
        selectLabel(languageMode, "Safety Check", "सुरक्षा जांच")
      }
      subtitle={
        selectLabel(
          languageMode,
          "Choose Normal or Suspicious to test payout safety lock",
          "सामान्य या संदिग्ध चुनकर भुगतान लॉक टेस्ट करें",
        )
      }
    >
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {Object.entries(fraudProfiles).map(([personaKey]) => {
          const isSelected = personaKey === activePersonaKey;
          return (
            <button
              key={personaKey}
              type="button"
              onClick={() => onPersonaChange(personaKey)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "border-coal-900 bg-coal-900 text-white"
                  : "border-coal-200 bg-coal-50 text-coal-600 hover:bg-coal-100"
              }`}
            >
              {personaKey === "normal"
                ? selectLabel(languageMode, "Normal (Safe)", "सामान्य (सुरक्षित)")
                : selectLabel(languageMode, "Suspicious (Check Needed)", "संदिग्ध (जांच ज़रूरी)")}
            </button>
          );
        })}
      </div>

      <div className="board-soft p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-coal-500">
            {selectLabel(languageMode, "Safety score", "सुरक्षा स्कोर")}
          </p>
          <span className="text-3xl font-bold text-coal-900">
            {activeProfile.score}/100
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getRiskBadgeClasses(riskLevel)}`}
          >
            {riskLevel}
          </span>
        </div>

        {showVerification ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {selectLabel(languageMode, "Selfie check required before payout", "भुगतान से पहले सेल्फी जांच ज़रूरी")}
          </p>
        ) : (
          <p className="mt-3 text-sm text-coal-500">
            {selectLabel(languageMode, "All good. Instant payout is allowed.", "सब ठीक है। तुरंत भुगतान मिलेगा।")}
          </p>
        )}
      </div>
    </Card>
  );
}

export default FraudDetectionIndicator;
