import { selectLabel, languageModes } from "../utils/i18n";

function LanguageToggle({ languageMode, setLanguageMode }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-gray-100/80 p-1 backdrop-blur-md border border-gray-200 shadow-sm">
      <button
        type="button"
        onClick={() => setLanguageMode(languageModes.ENGLISH)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider transition-all ${
          languageMode === languageModes.ENGLISH
            ? "bg-gray-900 text-white shadow-md"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        <span className="opacity-70">A</span>
        ENG
      </button>
      <button
        type="button"
        onClick={() => setLanguageMode(languageModes.HINDI)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider transition-all ${
          languageMode === languageModes.HINDI
            ? "bg-gray-900 text-white shadow-md"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        <span className="opacity-70 text-xs">अ</span>
        HIN
      </button>
      <button
        type="button"
        onClick={() => setLanguageMode(languageModes.HINGLISH)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider transition-all ${
          languageMode === languageModes.HINGLISH
            ? "bg-gray-900 text-white shadow-md"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        <span className="opacity-70">Aअ</span>
        HING
      </button>
    </div>
  );
}

export default LanguageToggle;
