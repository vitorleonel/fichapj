import assert from "node:assert/strict";
import { test } from "node:test";

import {
  companyMark,
  foreignCountry,
  formatCnae,
  formatCurrency,
  formatDate,
  formatPhone,
  formatPostalCode,
  initials,
  titleCase,
  yearsSince,
} from "./format.ts";

test("cnae takes the 4-1-2 shape", () => {
  assert.equal(formatCnae("4761001"), "4761-0/01");
  assert.equal(formatCnae("6201501"), "6201-5/01");
  assert.equal(formatCnae("5811500"), "5811-5/00");
});

test("date goes to dd/mm/yyyy", () => {
  assert.equal(formatDate("20201027"), "27/10/2020");
  assert.equal(formatDate("19700101"), "01/01/1970");
});

test("postal code takes its hyphen", () => {
  assert.equal(formatPostalCode("14606366"), "14606-366");
});

test("phone keeps the landline and the mobile shape apart", () => {
  assert.equal(formatPhone("11", "912345678"), "(11) 91234-5678");
  assert.equal(formatPhone("11", "34567890"), "(11) 3456-7890");
});

test("currency takes the brazilian shape", () => {
  // Intl joins the symbol with a no-break space, invisible in a source file.
  assert.equal(formatCurrency("1000,00"), "R$ 1.000,00");
  assert.equal(formatCurrency("1234567,89"), "R$ 1.234.567,89");
  assert.equal(formatCurrency("0,00"), "R$ 0,00");
  assert.equal(formatCurrency("1000"), "R$ 1.000,00");
});

test("initials take the first and last word", () => {
  assert.equal(initials("ZENIRA DA SILVA MACEDO"), "ZM");
  assert.equal(initials("VITOR LEONEL FELIX"), "VF");
  assert.equal(initials("MARIA"), "MA");
  assert.equal(initials("  "), "?");
});

test("a company mark ignores the legal form at the end", () => {
  assert.equal(companyMark("STEPY TECNOLOGIA LTDA"), "ST");
  assert.equal(companyMark("PADARIA DO ZE LTDA"), "PA");
  assert.equal(companyMark("ACME"), "AC");
});

test("age counts whole years, and stops at the birthday", () => {
  const today = new Date("2026-09-30T12:00:00Z");

  assert.equal(yearsSince("20100805", today), "16 anos");
  assert.equal(yearsSince("20150805", today), "11 anos");
  // The birthday is still ahead this year, so the year does not count yet.
  assert.equal(yearsSince("20151231", today), "10 anos");
  assert.equal(yearsSince("20250930", today), "1 ano");
  assert.equal(yearsSince("20260101", today), "");
  assert.equal(yearsSince("", today), "");
});

test("a shouted name comes back as a written one", () => {
  assert.equal(titleCase("STEPY TECNOLOGIA LTDA"), "Stepy Tecnologia Ltda");
  assert.equal(titleCase("PADARIA DO ZE LTDA"), "Padaria do Ze Ltda");
  assert.equal(
    titleCase("RUA THEREZA SCANAVEZ LAMBERTI"),
    "Rua Thereza Scanavez Lamberti",
  );
  assert.equal(titleCase("PARQUE DA BARRA I"), "Parque da Barra I");
  assert.equal(titleCase("VITOR LEONEL FELIX"), "Vitor Leonel Felix");
  // The first word is capitalised even when it is a connective on its own.
  assert.equal(titleCase("DE ALMEIDA E FILHOS"), "De Almeida e Filhos");
  assert.equal(titleCase(""), "");
});

test("a brazilian country is the one the dump leaves out", () => {
  assert.equal(foreignCountry("BRASIL"), "");
  assert.equal(foreignCountry("brasil"), "");
  assert.equal(foreignCountry(""), "");
  assert.equal(foreignCountry(null), "");
  assert.equal(foreignCountry("AFEGANISTAO"), "AFEGANISTAO");
});

test("a value of the wrong length is passed through untouched", () => {
  assert.equal(formatDate(""), "");
  assert.equal(formatDate("2020"), "2020");
  assert.equal(formatCnae("4761"), "4761");
  assert.equal(formatPostalCode(""), "");
  assert.equal(formatCurrency(""), "");
  assert.equal(formatCurrency("não informado"), "não informado");
  assert.equal(formatPhone("", ""), "");
  assert.equal(formatPhone("11", ""), "");
});
