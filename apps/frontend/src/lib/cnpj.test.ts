import assert from "node:assert/strict";
import { test } from "node:test";

import { formatCnpj, isComplete, onlyDigits } from "./cnpj.ts";

test("mask fills in as the digits arrive", () => {
  assert.equal(formatCnpj(""), "");
  assert.equal(formatCnpj("39"), "39");
  assert.equal(formatCnpj("395"), "39.5");
  assert.equal(formatCnpj("395814"), "39.581.4");
  assert.equal(formatCnpj("39581412"), "39.581.412");
  assert.equal(formatCnpj("395814120001"), "39.581.412/0001");
  assert.equal(formatCnpj("39581412000106"), "39.581.412/0001-06");
});

test("punctuation already there is not doubled", () => {
  assert.equal(formatCnpj("39.581.412/0001-06"), "39.581.412/0001-06");
  assert.equal(formatCnpj("3958141200010"), "39.581.412/0001-0");
});

test("letters are dropped and nothing past a full cnpj is kept", () => {
  assert.equal(onlyDigits("39.581.412/0001-06"), "39581412000106");
  assert.equal(formatCnpj("39a58b14c12d0001e06"), "39.581.412/0001-06");
  assert.equal(formatCnpj("3958141200010699999"), "39.581.412/0001-06");
});

test("only 14 digits counts as complete", () => {
  assert.equal(isComplete(""), false);
  assert.equal(isComplete("3958141200010"), false);
  assert.equal(isComplete("39581412000106"), true);
  assert.equal(isComplete("39.581.412/0001-06"), true);

  // Truncating first would cap this at 14 and call it complete.
  assert.equal(isComplete("395814120001069"), false);
});
