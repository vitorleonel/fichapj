import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { isComplete, onlyAlnum } from "@/lib/cnpj";
import { lookupCompany } from "@/services/company";

/**
 * A fresh server per request — nothing is kept between calls, so any isolate can answer
 * any of them and no session has to survive one request to the next.
 */
const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "fichapj", version: "1.0.0" });

  server.registerTool(
    "lookup_cnpj",
    {
      description:
        "Consulta uma empresa brasileira pelo CNPJ (14 posições, com ou sem pontuação), na base aberta da Receita Federal.",
      inputSchema: z.object({
        cnpj: z
          .string()
          .describe(
            "Aceita com ou sem pontuação: 19.131.243/0001-97 ou 19131243000197.",
          ),
      }),
    },
    async ({ cnpj }) => {
      // The same tolerance as the site's form: punctuation is dropped.
      const digits = onlyAlnum(cnpj);

      if (!isComplete(digits)) {
        return {
          content: [{ type: "text", text: "O CNPJ precisa de 14 posições." }],
          isError: true,
        };
      }

      const result = await lookupCompany(digits);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              result.ok ? result.company : { message: `erro ${result.status}` },
              null,
              2,
            ),
          },
        ],
        isError: !result.ok,
      };
    },
  );

  return server;
});

// No GET: without a session there is no server-to-client stream to open.
export async function POST(request: Request) {
  return handler.fetch(request);
}
