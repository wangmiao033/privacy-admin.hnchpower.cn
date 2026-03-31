"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import {
  updateUserActive,
  updateUserPdfDownload,
  updateUserRole,
} from "@/app/actions/users";

export type UserRow = {
  id: string;
  email: string | null;
  role: string;
  is_active: boolean;
  can_download_pdf: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

type Props = {
  rows: UserRow[];
};

export function UsersTable({ rows }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>邮箱</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>PDF 下载</TableHead>
            <TableHead>注册时间</TableHead>
            <TableHead>最近登录</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-zinc-500">
                暂无用户
              </TableCell>
            </TableRow>
          ) : (
            rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-zinc-900">
                  {u.email ?? "—"}
                </TableCell>
                <TableCell>
                  <Select
                    disabled={pending}
                    value={u.role}
                    onValueChange={(v) => {
                      startTransition(async () => {
                        await updateUserRole(
                          u.id,
                          v as "user" | "admin"
                        );
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    disabled={pending}
                    value={u.is_active ? "on" : "off"}
                    onValueChange={(v) => {
                      startTransition(async () => {
                        await updateUserActive(u.id, v === "on");
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on">启用</SelectItem>
                      <SelectItem value="off">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    disabled={pending}
                    value={u.can_download_pdf ? "yes" : "no"}
                    onValueChange={(v) => {
                      startTransition(async () => {
                        await updateUserPdfDownload(u.id, v === "yes");
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">允许</SelectItem>
                      <SelectItem value="no">禁止</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-zinc-600">
                  {formatDateTime(u.created_at)}
                </TableCell>
                <TableCell className="text-zinc-600">
                  {u.last_sign_in_at ? formatDateTime(u.last_sign_in_at) : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pending ? (
        <p className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-500">
          正在保存…
        </p>
      ) : null}
    </div>
  );
}
