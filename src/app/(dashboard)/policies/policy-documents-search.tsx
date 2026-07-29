"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Search, X } from "lucide-react";
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

  const results = useMemo(() => {
    const term = extractSearchTerm(query).toLowerCase();
    if (!term) return documents;

    return documents.filter((row) => {
      const code = String(row.short_code || "").toLowerCase();
      const title = String(row.title || "").toLowerCase();
      const publicUrl = `https://privacy.hnchpower.cn/document-policy.html?id=${code}`;
      return code === term || code.includes(term) || title.includes(term) || publicUrl.includes(term);
    });
  }, [documents, query]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(input);
  }

  function clearSearch() {
    setInput("");
    setQuery("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴完整隐私协议链接，或输入编号，例如 j5P89AyT"
            aria-label="搜索隐私协议"
            className="h-10 flex-1 bg-white"
          />
          <div className="flex gap-2">
            <Button type="submit" className="h-10 min-w-24">
              <Search className="h-4 w-4" />
              搜索
            </Button>
            {query ? (
              <Button type="button" variant="outline" className="h-10" onClick={clearSearch}>
                <X className="h-4 w-4" />
                清空
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          支持完整链接、文档编号和协议标题。粘贴链接后会自动识别 id 参数。
        </p>
      </form>

      {query ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-600">
            搜索结果：<strong className="text-zinc-900">{results.length}</strong> 条
          </p>
          <code className="max-w-[60%] truncate rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
            {extractSearchTerm(query)}
          </code>
        </div>
      ) : null}

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-14 text-center">
          <p className="text-sm font-medium text-zinc-700">没有找到对应的隐私协议</p>
          <p className="mt-2 text-xs text-zinc-500">
            请确认链接中的 id 编号正确，或直接输入类似 j5P89AyT 的文档编号。
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>文档编号</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>公开页面</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row) => {
                const publicUrl = `https://privacy.hnchpower.cn/document-policy.html?id=${encodeURIComponent(row.short_code)}`;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[300px] font-medium">
                      <span className="block truncate" title={row.title || ""}>
                        {row.title || "未命名隐私协议"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
                        {row.short_code}
                      </code>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600">
                      {formatDateTime(row.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          打开
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/policies/${encodeURIComponent(row.short_code)}/edit`}>
                          <Pencil className="h-4 w-4" />
                          编辑内容
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
