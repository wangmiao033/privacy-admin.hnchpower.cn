import { AdminSidebar } from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/guards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-zinc-100/40">
      <AdminSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
