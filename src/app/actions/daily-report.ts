"use server";

import { runDailyReport } from "@/lib/daily-report-runner";
import { requireAdmin } from "@/lib/guards";

export async function testSendDailyReportAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  await requireAdmin();
  return runDailyReport({ test: true });
}
