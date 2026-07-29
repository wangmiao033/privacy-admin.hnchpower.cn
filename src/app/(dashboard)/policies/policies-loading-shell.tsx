import { AdminHeader } from "@/components/admin-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  email: string | null;
};

export function PoliciesLoadingShell({ email }: Props) {
  return (
    <>
      <AdminHeader
        title="隐私协议管理"
        email={email}
        description="用审核链接或文档编号快速定位，并直接修改已发布内容"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1480px] space-y-6">
          <section className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Card key={item} className="rounded-2xl shadow-none">
                <CardContent className="flex items-center gap-4 p-5">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-14" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className="overflow-hidden rounded-2xl shadow-none">
            <CardHeader className="border-b border-zinc-100 px-5 py-5 sm:px-6">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-2 h-4 w-full max-w-xl" />
            </CardHeader>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full" />
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
