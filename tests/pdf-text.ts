/**
 * Les textes d'un PDF écrit par jsPDF (non compressé, polices standard en WinAnsi), dans l'ordre où
 * ils sont posés sur la page. Un texte que la police ne sait pas écrire ressort illisible.
 */
export function pdfTexts(pdf: string | Uint8Array): string[] {
  const raw = typeof pdf === 'string' ? pdf : Array.from(pdf, (byte) => String.fromCharCode(byte)).join('');
  return Array.from(raw.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g), ([, text]) =>
    Array.from(text.replace(/\\(.)/g, '$1'), winAnsiChar).join('')
  );
}

// Le TextDecoder de Node lit windows-1252 comme du latin-1 : les octets 0x80 à 0x9F sont décodés ici.
const WIN_ANSI_80_9F = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ';
const winAnsiChar = (char: string) => {
  const code = char.charCodeAt(0);
  return code >= 0x80 && code <= 0x9f ? WIN_ANSI_80_9F[code - 0x80] : char;
};

/** Le texte qui suit un intitulé : la valeur d'une ligne « Intitulé | valeur ». */
export function textAfter(texts: string[], label: string): string | undefined {
  const index = texts.indexOf(label);
  return index < 0 ? undefined : texts[index + 1];
}
