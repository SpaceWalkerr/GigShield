export const languageModes = {
  ENGLISH: "english",
  HINDI: "hindi",
  BOTH: "both",
};

export function selectLabel(languageMode, english, hindi) {
  if (languageMode === languageModes.HINDI) {
    return hindi;
  }

  if (languageMode === languageModes.BOTH) {
    return `${english} | ${hindi}`;
  }

  return english;
}
