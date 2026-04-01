import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const DEFAULT_TZ = "Asia/Shanghai";

function shanghaiYmd(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
}

/** 报告用「昨天」：按指定时区的日历日 [start, end) */
export function getYesterdayBoundsUtc(
  now = new Date(),
  timeZone = process.env.REPORT_TIMEZONE || DEFAULT_TZ
): { label: string; start: Date; end: Date } {
  const todayYmd = shanghaiYmd(now, timeZone);
  const todayStart = fromZonedTime(`${todayYmd}T00:00:00`, timeZone);
  const yesterdayStart = addDays(todayStart, -1);
  const label = shanghaiYmd(yesterdayStart, timeZone);
  return { label, start: yesterdayStart, end: todayStart };
}

/** 含昨日在内的连续 7 个日历日：[start, end)，end 为「今日 0 点」该时区 */
export function getLast7DaysBoundsUtc(
  now = new Date(),
  timeZone = process.env.REPORT_TIMEZONE || DEFAULT_TZ
): { start: Date; end: Date } {
  const { start: yesterdayStart, end: todayStart } = getYesterdayBoundsUtc(
    now,
    timeZone
  );
  const start = addDays(yesterdayStart, -6);
  return { start, end: todayStart };
}
