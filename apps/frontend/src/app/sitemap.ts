import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/**
 * The pages that need no lookup, so the Sitemap line in robots.txt resolves. The company
 * pages arrive in a later pass.
 *
 * No changeFrequency or priority — Google ignores both. lastmod is omitted rather than
 * stamped with the build date, which teaches it to distrust the field.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE },
    { url: `${SITE}/api` },
    { url: `${SITE}/politica-de-privacidade` },
    { url: `${SITE}/termos-de-uso` },
  ];
}
