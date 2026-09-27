import type { OpenNextConfig } from "@opennextjs/aws/types/open-next";

const config = {
  default: {
    override: {
      // The Suspense boundary streams to the browser through the function URL.
      wrapper: "aws-lambda-streaming",
      // Nothing here is ISR and nothing calls revalidateTag, so the SQS queue and the
      // DynamoDB table the defaults ask for would sit empty.
      queue: "dummy",
      tagCache: "dummy",
    },
  },
} satisfies OpenNextConfig;

export default config;
