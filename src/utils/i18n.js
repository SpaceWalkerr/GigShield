export const languageModes = {
  ENGLISH: "english",
  HINDI: "hindi",
  HINGLISH: "hinglish",
};

const devanagariIndependentVowels = {
  अ: "a",
  आ: "aa",
  इ: "i",
  ई: "ee",
  उ: "u",
  ऊ: "oo",
  ऋ: "ri",
  ए: "e",
  ऐ: "ai",
  ओ: "o",
  औ: "au",
};

const devanagariConsonants = {
  क: "k",
  ख: "kh",
  ग: "g",
  घ: "gh",
  ङ: "ng",
  च: "ch",
  छ: "chh",
  ज: "j",
  झ: "jh",
  ञ: "ny",
  ट: "t",
  ठ: "th",
  ड: "d",
  ढ: "dh",
  ण: "n",
  त: "t",
  थ: "th",
  द: "d",
  ध: "dh",
  न: "n",
  प: "p",
  फ: "ph",
  ब: "b",
  भ: "bh",
  म: "m",
  य: "y",
  र: "r",
  ल: "l",
  व: "v",
  श: "sh",
  ष: "sh",
  स: "s",
  ह: "h",
  क़: "q",
  ख़: "kh",
  ग़: "gh",
  ज़: "z",
  फ़: "f",
  ड़: "r",
  ढ़: "rh",
  ऱ: "r",
};

const devanagariMatras = {
  "ा": "aa",
  "ि": "i",
  "ी": "ee",
  "ु": "u",
  "ू": "oo",
  "ृ": "ri",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
};

const devanagariSigns = {
  "ं": "n",
  "ँ": "n",
  "ः": "h",
  ऽ: "'",
  "।": ".",
  "॥": ".",
};

const devanagariDigitToLatin = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

const virama = "्";

function transliterateHindiToHinglish(text) {
  if (typeof text !== "string" || text.length === 0) {
    return text;
  }

  let output = "";

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (devanagariIndependentVowels[char]) {
      output += devanagariIndependentVowels[char];
      continue;
    }

    if (devanagariConsonants[char]) {
      const base = devanagariConsonants[char];

      if (nextChar && devanagariMatras[nextChar]) {
        output += base + devanagariMatras[nextChar];
        i += 1;
        continue;
      }

      if (nextChar === virama) {
        output += base;
        i += 1;
        continue;
      }

      output += `${base}a`;
      continue;
    }

    if (devanagariMatras[char]) {
      output += devanagariMatras[char];
      continue;
    }

    if (devanagariSigns[char]) {
      output += devanagariSigns[char];
      continue;
    }

    if (devanagariDigitToLatin[char]) {
      output += devanagariDigitToLatin[char];
      continue;
    }

    output += char;
  }

  return output;
}

function toCamelCaseHinglish(text) {
  if (typeof text !== "string" || text.length === 0) {
    return text;
  }

  return text.replace(/[A-Za-z]+/g, (word) => {
    if (word.length <= 1) {
      return word.toUpperCase();
    }
    return word[0].toUpperCase() + word.slice(1).toLowerCase();
  });
}

export function selectLabel(languageMode, english, hindi, hinglish) {
  if (languageMode === languageModes.HINDI) {
    return hindi ?? english;
  }

  if (languageMode === languageModes.HINGLISH) {
    if (hinglish) {
      return hinglish;
    }
    if (hindi) {
      const transliterated = transliterateHindiToHinglish(hindi);
      if (typeof transliterated === "string") {
        return toCamelCaseHinglish(transliterated);
      }
      return transliterated;
    }
    // If neither Hindi nor Hinglish is provided, return English directly.
    return english;
  }

  return english;
}

