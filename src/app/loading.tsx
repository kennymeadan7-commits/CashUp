export default function RootLoading() {
  return (
    <div className="container-page animate-pulse py-12 sm:py-16" aria-hidden="true">
      <p className="sr-only">Chargement de la page…</p>
      <div className="h-4 w-36 rounded-full bg-cloud-200" />
      <div className="mt-5 h-11 w-full max-w-2xl rounded-xl bg-cloud-200" />
      <div className="mt-3 h-11 w-4/5 max-w-xl rounded-xl bg-cloud-200" />
      <div className="mt-5 h-5 w-full max-w-lg rounded-lg bg-cloud-100" />
      <div className="mt-2 h-5 w-3/5 max-w-md rounded-lg bg-cloud-100" />
      <div className="mt-10 flex gap-3">
        <div className="h-11 w-44 rounded-full bg-cloud-200" />
        <div className="h-11 w-36 rounded-full bg-cloud-100" />
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <div className="h-48 rounded-2xl bg-cloud-100" />
        <div className="h-48 rounded-2xl bg-cloud-100" />
        <div className="h-48 rounded-2xl bg-cloud-100" />
      </div>
    </div>
  );
}