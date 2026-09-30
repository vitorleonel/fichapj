import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/** Cloudflare prepends its managed file to this one at the edge, so verify the Sitemap
 *  line survives a deploy. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
