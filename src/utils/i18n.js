export const languageModes = {
  ENGLISH: "english",
  HINDI: "hindi",
};

export function selectLabel(languageMode, english, hindi) {
  if (languageMode === languageModes.HINDI) {
    return hindi;
  }

  return english;
}
