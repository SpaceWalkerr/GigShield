import { languageModes, selectLabel } from "../utils/i18n";

function LanguageToggle({ languageMode, setLanguageMode }) {
  return (
    <div className="board-soft flex items-center gap-1 p-1">
      <button
        type="button"
        onClick={() => setLanguageMode(languageModes.ENGLISH)}
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          languageMode === languageModes.ENGLISH
            ? "bg-coal-900 text-white"
            : "text-coal-700"
        }`}
      >
        {selectLabel(languageMode, "English", "अंग्रेजी")}
      </button>
      <button
        type="button"
        onClick={() => setLanguageMode(languageModes.HINDI)}
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          languageMode === languageModes.HINDI
            ? "bg-coal-900 text-white"
            : "text-coal-700"
        }`}
      >
        {selectLabel(languageMode, "Hindi", "हिंदी")}
      </button>
    </div>
  );
}

export default LanguageToggle;
