import assert from "node:assert/strict";
import { test } from "node:test";

import { isMissing } from "../lib/lookup.ts";

const failed = (status: number) => ({ ok: false as const, status });

test("a cnpj the base does not have", () => {
  assert.equal(isMissing(failed(404)), true);
});

test("a cnpj the API refuses outright", () => {
  assert.equal(isMissing(failed(400)), true);
});

test("a lookup that failed is not a missing company", () => {
  assert.equal(isMissing(failed(503)), false);
  assert.equal(isMissing(failed(502)), false);
});

// The one that matters: true here and a rotated token 404s every page in the site.
test("our own token being wrong is not a missing company", () => {
  assert.equal(isMissing(failed(403)), false);
});

test("a company that resolved is never missing", () => {
  assert.equal(isMissing({ ok: true, company: {} as never }), false);
});
