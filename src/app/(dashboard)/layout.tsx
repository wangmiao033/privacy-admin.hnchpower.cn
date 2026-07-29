import { AdminSidebar } from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/guards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-zinc-950 lg:flex">
      <AdminSidebar />
      <div className="min-h-screen min-w-0 flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
