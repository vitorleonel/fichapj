/** Raw values as the Receita publishes them, written the way people read them. */

/** `20201027` -> `27/10/2020`. Anything else is left alone. */
export const formatDate = (value: string) =>
  value.length === 8
    ? `${value.slice(6, 8)}/${value.slice(4, 6)}/${value.slice(0, 4)}`
    : value;

/** `14606366` -> `14606-366`. */
export const formatPostalCode = (value: string) =>
  value.length === 8 ? `${value.slice(0, 5)}-${value.slice(5)}` : value;

/** `4761001` -> `4761-0/01`, the CNAE's own shape. */
export const formatCnae = (value: string) =>
  value.length === 7
    ? `${value.slice(0, 4)}-${value.slice(4, 5)}/${value.slice(5)}`
    : value;

/** `11` and `912345678` -> `(11) 91234-5678`. A landline keeps its 4-digit prefix.
 *  Anything shorter than a full number is a missing one, so it reads as empty. */
export const formatPhone = (ddd: string, number: string) => {
  const digits = `${ddd ?? ""}${number ?? ""}`.replace(/\D/g, "");
  if (digits.length < 10) return "";

  const local = digits.slice(2);
  return `(${digits.slice(0, 2)}) ${local.slice(0, -4)}-${local.slice(-4)}`;
};

/** The words that stay down when they land inside a name, as Portuguese writes them. */
const CONNECTIVES = new Set([
  "a",
  "as",
  "ao",
  "aos",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
]);

/**
 * `STEPY TECNOLOGIA LTDA` -> `Stepy Tecnologia Ltda`.
 *
 * The Receita stores every name and every street in capitals, which reads as shouting
 * once it is on a page. A name that is genuinely an acronym comes out wrong — `IBM` is
 * not recoverable from `IBM` — but that is rarer than the shouting.
 */
export const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && CONNECTIVES.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");

/**
 * The country, unless it is the one the dump leaves implicit — an empty `pais` is Brazil,
 * so printing it next to a Brazilian address says nothing.
 */
export const foreignCountry = (descricao?: string | null) =>
  (descricao ?? "").toUpperCase() === "BRASIL" ? "" : (descricao ?? "");

/** `ZENIRA DA SILVA MACEDO` -> `ZM`. A one-word name keeps its first two letters. */
export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * `STEPY TECNOLOGIA LTDA` -> `ST`. A company name ends in its legal form, so taking the
 * last word would make the mark `SL` on nearly every Limitada.
 */
export const companyMark = (name: string) =>
  initials(name.trim().split(/\s+/)[0] ?? "");

/** `20100805` -> `16 anos`. Empty when there is no whole date to count from. */
export const yearsSince = (value: string, now = new Date()) => {
  if (value.length !== 8) return "";

  // MMDD as one number orders the same as the calendar, so a birthday still ahead this
  // year is a year not yet lived.
  const today = (now.getMonth() + 1) * 100 + now.getDate();
  const years =
    now.getFullYear() -
    Number(value.slice(0, 4)) -
    (today < Number(value.slice(4, 8)) ? 1 : 0);

  if (years < 1) return "";
  return years === 1 ? "1 ano" : `${years} anos`;
};

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** `1000,00` -> `R$ 1.000,00`. Anything that is not a number is left alone. */
export const formatCurrency = (value: string) => {
  // The dump writes thousands with a dot and decimals with a comma, which
  // Number() reads as NaN.
  const amount = Number(value.replace(/\./g, "").replace(",", "."));

  return value.trim() !== "" && Number.isFinite(amount)
    ? BRL.format(amount)
    : value;
};
