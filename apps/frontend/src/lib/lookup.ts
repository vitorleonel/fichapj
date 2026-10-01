import type { LookupResult } from "../services/company.ts";

/**
 * 400 alongside 404: the API rejects anything that is not twelve alphanumeric positions and
 * two digits, so an impossible address is length-complete and comes back 400 — rendered as a
 * 200 it would be indexable. Anything else is the API refusing or failing, which says nothing
 * about whether the company exists.
 */
export function isMissing(result: LookupResult): boolean {
  return !result.ok && (result.status === 404 || result.status === 400);
}
