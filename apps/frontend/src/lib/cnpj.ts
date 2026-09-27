const DIGITS = 14;

/** Everything the user typed that is actually a digit, capped at a full CNPJ. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, DIGITS);
}

/** The digits above, written as 00.000.000/0000-00 while they are typed. */
export function formatCnpj(value: string): string {
  return onlyDigits(value)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Whether the string holds a whole CNPJ, however it is punctuated. */
export function isComplete(value: string): boolean {
  return value.replace(/\D/g, "").length === DIGITS;
}
