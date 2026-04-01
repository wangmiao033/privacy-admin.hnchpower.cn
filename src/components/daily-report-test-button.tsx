"use client";

import { useState, useTransition } from "react";
import { testSendDailyReportAction } from "@/app/actions/daily-report";
import { Button } from "@/components/ui/button";

export function DailyReportTestButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          startTransition(async () => {
            const r = await testSendDailyReportAction();
            setMsg(`${r.ok ? "✓" : "✗"} ${r.message}`);
          });
        }}
      >
        {pending ? "发送中…" : "测试发送日报"}
      </Button>
      {msg ? (
        <p className="text-sm text-zinc-600 whitespace-pre-wrap">{msg}</p>
      ) : null}
    </div>
  );
}
