import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatCnae,
  formatCurrency,
  formatDate,
  formatPhone,
  formatPostalCode,
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
