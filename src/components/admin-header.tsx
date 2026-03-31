import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = {
  title: string;
  email?: string | null;
};

export function AdminHeader({ title, email }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <h1 className="text-base font-semibold text-zinc-900">{title}</h1>
      <div className="flex items-center gap-3">
        {email ? (
          <span className="hidden max-w-[220px] truncate text-sm text-zinc-500 sm:inline">
            {email}
          </span>
        ) : null}
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            退出登录
          </Button>
        </form>
      </div>
    </header>
  );
}
