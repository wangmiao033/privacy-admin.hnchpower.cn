import { AdminHeader } from "@/components/admin-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  email: string | null;
};

export function PoliciesLoadingShell({ email }: Props) {
  return (
    <>
      <AdminHeader title="隐私政策发布记录" email={email} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-full max-w-xl" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
