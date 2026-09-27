import { countActive } from "@/services/company";

/** Streams in behind a Suspense boundary: the API scans a table for this. */
export async function ActiveCount() {
  const active = await countActive();
  if (active === null) return null;

  return (
    <p className="text-base text-zinc-500">
      <span className="font-medium text-zinc-900 tabular-nums">
        {active.toLocaleString("pt-BR")}
      </span>{" "}
      {active === 1 ? "empresa ativa" : "empresas ativas"}
    </p>
  );
}
