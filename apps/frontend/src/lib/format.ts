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
