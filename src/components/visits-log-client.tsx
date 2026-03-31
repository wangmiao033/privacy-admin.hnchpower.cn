"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, summarizeUserAgent } from "@/lib/format";

export type VisitRow = {
  id: string;
  created_at: string;
  path: string;
  url: string | null;
  page_type: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_masked: string | null;
  visitor_key: string | null;
  is_logged_in: boolean;
  user_email: string | null;
};

type Props = {
  rows: VisitRow[];
};

export function VisitsLogClient({ rows }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<VisitRow | null>(null);

  return (
    <>
      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>时间</TableHead>
              <TableHead>路径</TableHead>
              <TableHead>visitor_key</TableHead>
              <TableHead>登录</TableHead>
              <TableHead>用户邮箱</TableHead>
              <TableHead>脱敏 IP</TableHead>
              <TableHead>UA 摘要</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-500">
                  暂无访问记录
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-zinc-600">
                    {formatDateTime(r.created_at)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-xs">
                    {r.path}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate font-mono text-xs text-zinc-600">
                    {r.visitor_key ?? "—"}
                  </TableCell>
                  <TableCell>{r.is_logged_in ? "已登录" : "访客"}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm">
                    {r.user_email ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-600">
                    {r.ip_masked ?? "—"}
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate text-xs text-zinc-500"
                    title={r.user_agent ?? undefined}
                  >
                    {summarizeUserAgent(r.user_agent)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrent(r);
                        setOpen(true);
                      }}
                    >
                      详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>访问详情</DialogTitle>
            <DialogDescription>仅展示已存储字段；IP 为脱敏值</DialogDescription>
          </DialogHeader>
          {current ? (
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-zinc-500">时间</dt>
                <dd>{formatDateTime(current.created_at)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">路径</dt>
                <dd className="break-all font-mono text-xs">{current.path}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">完整 URL</dt>
                <dd className="break-all text-xs">{current.url ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">page_type</dt>
                <dd>{current.page_type ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Referer</dt>
                <dd className="break-all text-xs">{current.referrer ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">visitor_key</dt>
                <dd className="break-all font-mono text-xs">
                  {current.visitor_key ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">登录状态</dt>
                <dd>{current.is_logged_in ? "已登录" : "访客"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">用户邮箱</dt>
                <dd>{current.user_email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">脱敏 IP（ip_masked）</dt>
                <dd className="font-mono text-xs">{current.ip_masked ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">User-Agent</dt>
                <dd className="break-all text-xs text-zinc-700">
                  {current.user_agent ?? "—"}
                </dd>
              </div>
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
