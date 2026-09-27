import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// No ISR and nothing calls revalidateTag, so the queue and tag cache the defaults
// ask for would sit empty. The R2 binding is the one piece the app needs.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
