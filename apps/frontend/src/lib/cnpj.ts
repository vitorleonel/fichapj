const LENGTH = 14;

/** Where the separators fall: after 2, 5 and 8 characters, and before the last two. */
const GROUPS = [2, 3, 3, 4, 2];
const SEPARATORS = [".", ".", "/", "-"];

/**
 * The characters a cnpj can hold, uppercased; everything else the user typed is dropped.
 *
 * The first twelve positions take letters as well as digits — the Receita's alphanumeric
 * format, in force since July 2026. Only the two check digits stay numeric, and a letter
 * typed in one of those does nothing worse than a lookup that comes back empty.
 */
function chars(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

/** The characters above, capped at a full cnpj. */
export function onlyAlnum(value: string): string {
  return chars(value).slice(0, LENGTH);
}

/** The characters above, written as 00.000.000/0000-00 while they are typed. */
export function formatCnpj(value: string): string {
  const chars = onlyAlnum(value);
  let out = "";
  let at = 0;

  for (const [index, size] of GROUPS.entries()) {
    if (at >= chars.length) break;

    out +=
      (index === 0 ? "" : SEPARATORS[index - 1]) + chars.slice(at, at + size);
    at += size;
  }

  return out;
}

/** Whether the string holds a whole cnpj, however it is punctuated. */
export function isComplete(value: string): boolean {
  return chars(value).length === LENGTH;
}
