export default function CatalogLoading() {
  return (
    <div className="container-page animate-pulse py-10" aria-hidden="true">
      <p className="sr-only">Chargement du catalogue…</p>
      <div className="h-4 w-40 rounded-full bg-cloud-200" />
      <div className="mt-4 h-10 w-full max-w-xl rounded-xl bg-cloud-200" />
      <div className="mt-3 h-5 w-full max-w-2xl rounded-lg bg-cloud-100" />
      <div className="mt-8 flex flex-wrap gap-2">
        <div className="h-9 w-28 rounded-full bg-cloud-100" />
        <div className="h-9 w-28 rounded-full bg-cloud-100" />
        <div className="h-9 w-28 rounded-full bg-cloud-100" />
        <div className="h-9 w-28 rounded-full bg-cloud-100" />
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-52 rounded-2xl bg-cloud-100" />
        <div className="h-52 rounded-2xl bg-cloud-100" />
        <div className="h-52 rounded-2xl bg-cloud-100" />
        <div className="h-52 rounded-2xl bg-cloud-100" />
        <div className="h-52 rounded-2xl bg-cloud-100" />
        <div className="h-52 rounded-2xl bg-cloud-100" />
      </div>
    </div>
  );
}