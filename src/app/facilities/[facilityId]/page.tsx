import Link from "next/link";

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const { facilityId } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Facility details
            </p>
            <h1 className="mt-2 text-4xl font-bold">No facility selected</h1>
          </div>
          <Link
            href="/facilities"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Back to facilities
          </Link>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Blank tenant state</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">This workspace is waiting for real organization data.</h2>
          <p className="mt-3 text-slate-600">
            {facilityId
              ? "A real facility record will appear here after the organization is created and assigned."
              : "Create a new organization and facility to populate this view with real tenant information."}
          </p>
        </div>
      </div>
    </main>
  );
}
