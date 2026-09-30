import type { LookupResult } from "../services/company.ts";

/**
 * 400 alongside 404: the API rejects anything that is not twelve alphanumeric positions and
 * two digits, so an impossible address is length-complete and comes back 400 — rendered as a
 * 200 it would be indexable. 403 is our own token being wrong, and reading that as "no such
 * company" would 404 every page in the site.
 */
export function isMissing(result: LookupResult): boolean {
  return !result.ok && (result.status === 404 || result.status === 400);
}
