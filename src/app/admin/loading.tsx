export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <p className="sr-only">Chargement de l&apos;administration…</p>
      <div className="h-4 w-36 rounded-full bg-cloud-200" />
      <div className="mt-4 h-9 w-full max-w-lg rounded-xl bg-cloud-200" />
      <div className="mt-3 h-5 w-full max-w-2xl rounded-lg bg-cloud-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-28 rounded-2xl bg-cloud-100" />
        <div className="h-28 rounded-2xl bg-cloud-100" />
        <div className="h-28 rounded-2xl bg-cloud-100" />
        <div className="h-28 rounded-2xl bg-cloud-100" />
      </div>
      <div className="mt-8 space-y-4">
        <div className="h-32 rounded-2xl bg-cloud-100" />
        <div className="h-32 rounded-2xl bg-cloud-100" />
        <div className="h-32 rounded-2xl bg-cloud-100" />
      </div>
    </div>
  );
}