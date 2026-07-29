"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

type PolicyDocument = {
  id: number | string;
  short_code: string;
  title: string | null;
  created_at: string;
};

type Props = {
  documents: PolicyDocument[];
};

const PAGE_SIZE = 12;

function extractSearchTerm(raw: string) {
  const value = raw.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const code = (url.searchParams.get("id") || url.searchParams.get("code") || "").trim();
    if (code) return code;
  } catch {
    // 不是完整 URL 时继续按编号或标题搜索。
  }

  const queryMatch = value.match(/[?&](?:id|code)=([A-Za-z0-9]{4,16})/i);
  if (queryMatch?.[1]) return queryMatch[1];

  return value;
}

export function PolicyDocumentsSearch({ documents }: Props) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const normalizedTerm = extractSearchTerm(query).toLowerCase();

  const results = useMemo(() => {
    if (!normalizedTerm) return documents;

    return documents.filter((row) => {
      const code = String(row.short_code || "").toLowerCase();
      const title = String(row.title || "").toLowerCase();
      const publicUrl = `https://privacy.hnchpower.cn/document-policy.html?id=${code}`;
      return (
        code === normalizedTerm ||
        code.includes(normalizedTerm) ||
        title.includes(normalizedTerm) ||
        publicUrl.includes(normalizedTerm)
      );
    });
  }, [documents, normalizedTerm]);

  const exactMatch =
    normalizedTerm &&
    results.length === 1 &&
    results[0].short_code.toLowerCase() === normalizedTerm
      ? results[0]
      : null;

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleResults = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = results.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, results.length);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(input);
    setPage(1);
  }

  function clearSearch() {
    setInput("");
    setQuery("");
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-3">
          <p className="text-sm font-semibold text-zinc-900">快速定位协议</p>
          <p className="mt-1 text-xs text-zinc-500">
            直接粘贴审核链接，或输入文档编号、协议标题。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="https://privacy.hnchpower.cn/document-policy.html?id=j5P89AyT"
              aria-label="搜索隐私协议"
              className="h-11 bg-white pl-10 text-sm shadow-none"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="h-11 min-w-24 rounded-lg">
              <Search className="h-4 w-4" />
              搜索
            </Button>
            {query ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg bg-white"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
                清空
              </Button>
            ) : null}
          </div>
        </div>
      </form>

      {exactMatch ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-800">
                <FileCheck2 className="h-4 w-4" />
                已精确定位
              </div>
              <h3 className="truncate text-base font-semibold text-zinc-950">
                {exactMatch.title || "未命名隐私协议"}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <code className="rounded-md border border-emerald-200 bg-white px-2 py-1 font-mono text-emerald-800">
                  {exactMatch.short_code}
                </code>
                <span>创建于 {formatDateTime(exactMatch.created_at)}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" className="bg-white">
                <Link
                  href={`https://privacy.hnchpower.cn/document-policy.html?id=${encodeURIComponent(exactMatch.short_code)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  查看页面
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/policies/${encodeURIComponent(exactMatch.short_code)}/edit`}>
                  <Pencil className="h-4 w-4" />
                  编辑内容
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!exactMatch && query ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-zinc-600">
            找到 <strong className="text-zinc-950">{results.length}</strong> 条结果
          </p>
          <code className="max-w-[70%] truncate rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
            {extractSearchTerm(query)}
          </code>
        </div>
      ) : null}

      {!exactMatch && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 py-16 text-center">
          <Search className="h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-medium text-zinc-700">没有找到对应的隐私协议</p>
          <p className="mt-1 text-xs text-zinc-500">
            请检查链接中的 id，或直接输入类似 j5P89AyT 的文档编号。
          </p>
        </div>
      ) : null}

      {!exactMatch && results.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11">标题</TableHead>
                  <TableHead className="h-11">文档编号</TableHead>
                  <TableHead className="h-11">创建时间</TableHead>
                  <TableHead className="h-11">公开页面</TableHead>
                  <TableHead className="h-11 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleResults.map((row) => {
                  const publicUrl = `https://privacy.hnchpower.cn/document-policy.html?id=${encodeURIComponent(row.short_code)}`;
                  return (
                    <TableRow key={row.id} className="group hover:bg-zinc-50/70">
                      <TableCell className="max-w-[340px] py-3.5 font-medium">
                        <span className="block truncate text-zinc-900" title={row.title || ""}>
                          {row.title || "未命名隐私协议"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <code className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700">
                          {row.short_code}
                        </code>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-3.5 text-sm text-zinc-500">
                        {formatDateTime(row.created_at)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Button asChild size="sm" variant="ghost" className="text-zinc-600">
                          <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            打开
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <Button asChild size="sm">
                          <Link href={`/policies/${encodeURIComponent(row.short_code)}/edit`}>
                            <Pencil className="h-4 w-4" />
                            编辑
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              显示 {rangeStart}–{rangeEnd} 条，共 {results.length} 条
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <span className="min-w-16 text-center text-xs font-medium text-zinc-600">
                {safePage} / {totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white"
                disabled={safePage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
