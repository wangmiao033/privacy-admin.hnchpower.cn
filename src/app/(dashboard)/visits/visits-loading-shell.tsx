import { AdminHeader } from "@/components/admin-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function VisitsLoadingShell({ email }: { email: string | null }) {
  return (
    <>
      <AdminHeader title="访问日志" email={email} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-full max-w-xl" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
