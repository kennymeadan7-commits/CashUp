import type { Metadata } from "next";
import { requirePayer } from "@/lib/payer-guard";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payer",
  robots: { index: false, follow: false },
};

export default async function PayerLayout({ children }: { children: React.ReactNode }) {
  await requirePayer();

  return (
    <div className="container-page py-8 sm:py-10">
      <DashboardNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
