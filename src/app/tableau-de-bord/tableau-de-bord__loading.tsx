export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <p className="sr-only">Chargement de votre espace…</p>
      <div className="h-4 w-32 rounded-full bg-cloud-200" />
      <div className="mt-4 h-9 w-full max-w-md rounded-xl bg-cloud-200" />
      <div className="mt-3 h-5 w-full max-w-lg rounded-lg bg-cloud-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-28 rounded-2xl bg-cloud-100" />
        <div className="h-28 rounded-2xl bg-cloud-100" />
        <div className="h-28 rounded-2xl bg-cloud-100" />
        <div className="h-28 rounded-2xl bg-cloud-100" />
      </div>
      <div className="mt-8 space-y-3">
        <div className="h-24 rounded-2xl bg-cloud-100" />
        <div className="h-24 rounded-2xl bg-cloud-100" />
        <div className="h-24 rounded-2xl bg-cloud-100" />
      </div>
    </div>
  );
}