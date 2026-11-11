import { requireUser } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="container-page py-8 sm:py-10">
      <DashboardNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
