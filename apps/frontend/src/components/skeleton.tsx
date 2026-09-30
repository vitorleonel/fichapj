/** Stands where the lookup will be, so the header paints at once and nothing jumps. */
export function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* `output` carries the live-region role on its own. */}
      <output className="sr-only">Consultando o CNPJ…</output>

      <div className="skeleton h-44 rounded-2xl sm:h-40" aria-hidden="true" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-80 rounded-2xl" aria-hidden="true" />
        <div className="skeleton h-80 rounded-2xl" aria-hidden="true" />
      </div>

      <div className="skeleton h-64 rounded-2xl" aria-hidden="true" />
    </div>
  );
}
