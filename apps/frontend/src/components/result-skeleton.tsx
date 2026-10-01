import { Panel } from "@/components/ui";

/**
 * Stands in for the answer while the lookup runs, which takes seconds. The headings are
 * the real ones, so the page that arrives moves nothing on its way in.
 */

function Bar({ className }: { className: string }) {
  return (
    <span
      className={`block animate-pulse rounded bg-zinc-200/70 motion-reduce:animate-none ${className}`}
    />
  );
}

function Field({
  labelWidth,
  valueWidth,
}: {
  labelWidth: string;
  valueWidth: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Bar className={`h-3 ${labelWidth}`} />
      <Bar className={`h-4 ${valueWidth}`} />
    </div>
  );
}

export function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <section className="rounded-3xl border border-zinc-200/70 bg-white p-7 shadow-lift sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-7">
          <Bar className="size-16 shrink-0 rounded-2xl" />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              <Bar className="h-6 w-24 rounded-full" />
              <Bar className="h-6 w-20 rounded-full" />
              <Bar className="h-6 w-32 rounded-full" />
            </div>
            <Bar className="h-9 w-3/5 sm:h-11" />
            <Bar className="h-5 w-32" />
            <Bar className="mt-3 h-5 w-44" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Empresa">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Bar className="h-3 w-20" />
              <Bar className="h-4 w-3/4" />
            </div>
            <Field labelWidth="w-28" valueWidth="w-4/5" />
            <Field labelWidth="w-32" valueWidth="w-3/5" />
            <Field labelWidth="w-10" valueWidth="w-2/5" />
            <Field labelWidth="w-24" valueWidth="w-1/2" />
          </div>
        </Panel>

        <Panel title="Estabelecimento">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field labelWidth="w-10" valueWidth="w-40" />
            <Field labelWidth="w-8" valueWidth="w-16" />
            <Field labelWidth="w-28" valueWidth="w-20" />
            <Field labelWidth="w-24" valueWidth="w-24" />
            <Field labelWidth="w-32" valueWidth="w-3/5" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Endereço">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Bar className="h-3 w-20" />
              <Bar className="h-4 w-2/3" />
            </div>
            <Field labelWidth="w-14" valueWidth="w-24" />
            <Field labelWidth="w-28" valueWidth="w-28" />
            <Field labelWidth="w-8" valueWidth="w-16" />
            <Field labelWidth="w-10" valueWidth="w-24" />
          </div>
        </Panel>

        <Panel title="Contato">
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((line) => (
              <div key={line} className="flex items-center gap-3">
                <Bar className="size-9 shrink-0 rounded-lg" />
                <Bar className={line === 0 ? "h-4 w-2/3" : "h-4 w-1/2"} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
