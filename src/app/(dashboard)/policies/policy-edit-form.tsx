"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const toolbarItems = [
  { label: "撤销", command: "undo" },
  { label: "重做", command: "redo" },
  { label: "加粗", command: "bold" },
  { label: "标题", command: "formatBlock", value: "h2" },
  { label: "正文", command: "formatBlock", value: "p" },
  { label: "项目符号", command: "insertUnorderedList" },
  { label: "编号列表", command: "insertOrderedList" },
] as const;

type Props = {
  shortCode: string;
  initialTitle: string;
  initialHtml: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function PolicyEditForm({
  shortCode,
  initialTitle,
  initialHtml,
  action,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [contentHtml, setContentHtml] = useState(initialHtml);
  const [dirty, setDirty] = useState(false);

  function syncEditor() {
    const next = editorRef.current?.innerHTML || "";
    setContentHtml(next);
    setDirty(true);
  }

  function applyCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditor();
  }

  function createLink() {
    const href = window.prompt("请输入完整链接（https://...）");
    if (!href) return;
    if (!/^https?:\/\//i.test(href.trim())) {
      window.alert("仅支持 http:// 或 https:// 链接");
      return;
    }
    applyCommand("createLink", href.trim());
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="short_code" value={shortCode} />
      <input type="hidden" name="content_html" value={contentHtml} />

      <div className="space-y-2">
        <Label htmlFor="policy-title">协议标题</Label>
        <Input
          id="policy-title"
          name="title"
          defaultValue={initialTitle}
          maxLength={160}
          required
          onChange={() => setDirty(true)}
        />
        <p className="text-xs text-zinc-500">
          修改标题后，公开链接地址不会变化。
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>协议正文</Label>
          <span className="text-xs text-zinc-500">
            {dirty ? "有未保存修改" : "内容已加载"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 rounded-t-lg border border-b-0 border-zinc-200 bg-zinc-50 p-2">
          {toolbarItems.map((item) => (
            <Button
              key={item.label}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyCommand(item.command, "value" in item ? item.value : undefined)}
            >
              {item.label}
            </Button>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={createLink}>
            添加链接
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => applyCommand("unlink")}
          >
            移除链接
          </Button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncEditor}
          onBlur={syncEditor}
          dangerouslySetInnerHTML={{ __html: initialHtml }}
          className="min-h-[560px] overflow-auto rounded-b-lg border border-zinc-200 bg-white p-6 text-[15px] leading-7 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-zinc-300 [&_td]:p-2 [&_th]:border [&_th]:border-zinc-300 [&_th]:bg-zinc-50 [&_th]:p-2 [&_ul]:list-disc"
          aria-label="隐私协议正文编辑器"
        />
        <p className="text-xs leading-5 text-zinc-500">
          可直接点击正文修改。表格、标题、段落和链接会保留；保存时会自动移除脚本等危险内容。
        </p>
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-zinc-200 bg-white/95 py-4 backdrop-blur">
        <Button type="submit" size="lg">
          保存修改
        </Button>
      </div>
    </form>
  );
}
