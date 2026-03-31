import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export function KpiCard({ title, value, hint, className }: Props) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums text-zinc-900">
          {value}
        </div>
        {hint ? (
          <p className="mt-1 text-xs text-zinc-500">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
