"use client";

import { useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  FileImage,
  FolderUp,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "psd",
  "zip",
  "rar",
  "7z",
  "mp4",
  "mov",
  "pdf",
]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);
const ARCHIVE_EXTENSIONS = new Set(["zip", "rar", "7z"]);
const KNOWN_SPECS: Record<string, [string, string[]]> = {
  "1080x450": ["Banner", ["biubiu", "首页banner"]],
  "672x378": ["Banner", ["九游", "首页信息流banner"]],
  "660x370": ["Banner", ["九游", "找游戏焦点banner"]],
  "1080x604": ["Banner", ["豌豆荚", "首页信息流banner"]],
  "1080x906": ["商店图", ["商店图"]],
  "1280x720": ["宣传图", ["横版宣传图"]],
  "720x1280": ["宣传图", ["竖版宣传图"]],
  "1080x1920": ["宣传图", ["竖版宣传图"]],
  "1080x2340": ["闪屏", ["闪屏"]],
  "751x1500": ["闪屏", ["loading图"]],
  "512x512": ["Icon", ["游戏icon"]],
  "1024x1024": ["Icon", ["游戏icon"]],
  "50x50": ["Icon", ["表情聊天页图标"]],
  "750x560": ["其他", ["表情崇拜引导图"]],
  "720x405": ["宣传图", ["素材广告图"]],
  "2952x960": ["Banner", ["时下热门资源位"]],
};

export type Asset = {
  id: string;
  key?: string;
  publicUrl?: string;
  originalName: string;
  displayName: string;
  gameName: string;
  channelName: string;
  category: string;
  tags: string[];
  note: string;
  extension: string;
  kind: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  orientation: string;
  uploadedAt: string;
};

type UploadMeta = {
  gameName: string;
  channelName: string;
  category: string;
  tags: string;
  note: string;
  isPublic: boolean;
};

const emptyMeta: UploadMeta = {
  gameName: "",
  channelName: "",
  category: "",
  tags: "",
  note: "",
  isPublic: true,
};

export function AssetsManagerClient({
  initialAssets,
  initialError,
}: {
  initialAssets: Asset[];
  initialError?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<Asset[]>(initialAssets.map(normalizeAsset));
  const [uploadMeta, setUploadMeta] = useState<UploadMeta>(emptyMeta);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [orientationFilter, setOrientationFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [status, setStatus] = useState(initialError ? "素材清单读取失败。" : `已读取 ${initialAssets.length} 个素材。`);
  const [error, setError] = useState(initialError || "");
  const [isUploading, setIsUploading] = useState(false);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = normalize(query);
    return assets.filter((asset) => {
      const haystack = normalize(
        [
          asset.originalName,
          asset.displayName,
          asset.gameName,
          asset.channelName,
          asset.category,
          asset.kind,
          asset.tags.join(","),
          asset.note,
          dimensionLabel(asset),
        ].join(" ")
      );
      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (categoryFilter === "all" || asset.category === categoryFilter) &&
        (channelFilter === "all" || asset.channelName === channelFilter) &&
        (orientationFilter === "all" || asset.orientation === orientationFilter) &&
        (formatFilter === "all" || asset.extension === formatFilter)
      );
    });
  }, [assets, categoryFilter, channelFilter, formatFilter, orientationFilter, query]);

  const stats = useMemo(() => {
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    return {
      total: assets.length,
      images: assets.filter((asset) => asset.width && asset.height).length,
      videos: assets.filter((asset) => VIDEO_EXTENSIONS.has(asset.extension)).length,
      archives: assets.filter((asset) => ARCHIVE_EXTENSIONS.has(asset.extension)).length,
      totalSize,
      landscape: assets.filter((asset) => asset.orientation === "横图").length,
      portrait: assets.filter((asset) => asset.orientation === "竖图").length,
      square: assets.filter((asset) => asset.orientation === "方图").length,
    };
  }, [assets]);

  const categoryOptions = useMemo(() => unique(assets.map((asset) => asset.category)), [assets]);
  const channelOptions = useMemo(() => unique(assets.map((asset) => asset.channelName)), [assets]);
  const formatOptions = useMemo(() => unique(assets.map((asset) => asset.extension)), [assets]);

  async function loadAssets() {
    setError("");
    try {
      const data = await fetchJson<{ items: Asset[] }>("/api/assets?limit=500");
      setAssets((data.items || []).map(normalizeAsset));
      setStatus(`已读取 ${data.items?.length || 0} 个素材。`);
    } catch (err) {
      setError(errorMessage(err));
      setStatus("素材清单读取失败。");
    }
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList || []).filter((file) => SUPPORTED_EXTENSIONS.has(extensionOf(file.name)));
    const validFiles = files.filter((file) => file.size <= MAX_FILE_SIZE);
    const skipped = files.length - validFiles.length;
    if (!validFiles.length) {
      setError("没有发现支持的素材文件，或文件超过 50MB。");
      return;
    }

    setError("");
    setIsUploading(true);
    setStatus(`正在上传 ${validFiles.length} 个素材...`);
    const uploaded: Asset[] = [];
    const failed: string[] = [];

    for (const file of validFiles) {
      try {
        const local = await analyzeFile(file, uploadMeta);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("gameName", local.gameName);
        formData.append("channelName", local.channelName);
        formData.append("category", local.category);
        formData.append("tags", local.tags.join(","));
        formData.append("note", local.note);
        formData.append("width", local.width ? String(local.width) : "");
        formData.append("height", local.height ? String(local.height) : "");
        formData.append("orientation", local.orientation);
        formData.append("detectedType", local.category);
        formData.append("isPublic", uploadMeta.isPublic ? "true" : "false");
        const data = await fetchJson<{ asset: Asset }>("/api/assets/upload", {
          method: "POST",
          body: formData,
        });
        uploaded.push(normalizeAsset(data.asset));
      } catch (err) {
        failed.push(`${file.name}: ${errorMessage(err)}`);
      }
    }

    setAssets((current) => mergeAssets(current, uploaded));
    setStatus(`上传完成：成功 ${uploaded.length} 个${skipped ? `，跳过 ${skipped} 个超限文件` : ""}。`);
    setError(failed.length ? failed.slice(0, 3).join("；") : "");
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  }

  async function copyLink(asset: Asset) {
    await navigator.clipboard.writeText(asset.publicUrl || "");
    setStatus("公开链接已复制。");
  }

  async function editAsset(asset: Asset) {
    const gameName = window.prompt("游戏名", asset.gameName) ?? asset.gameName;
    const channelName = window.prompt("渠道名", asset.channelName) ?? asset.channelName;
    const category = window.prompt("分类", asset.category) ?? asset.category;
    const tags = parseTags(window.prompt("标签，逗号分隔", asset.tags.join(", ")) ?? asset.tags.join(", "));
    const note = window.prompt("备注", asset.note) ?? asset.note;
    const data = await fetchJson<{ asset: Asset }>(`/api/assets/${encodeURIComponent(asset.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameName, channelName, category, tags, note }),
    });
    setAssets((current) => current.map((item) => (item.id === asset.id ? normalizeAsset(data.asset) : item)));
  }

  async function deleteAsset(asset: Asset) {
    if (!window.confirm("确定删除这个素材吗？删除后无法恢复。")) return;
    await fetchJson(`/api/assets/${encodeURIComponent(asset.id)}`, { method: "DELETE" });
    setAssets((current) => current.filter((item) => item.id !== asset.id));
    setStatus("素材已删除。");
  }

  function exportCsv() {
    const rows = filteredAssets;
    const csv = [
      ["文件名", "公开链接", "游戏名", "渠道名", "分类", "宽度", "高度", "方向", "文件大小", "格式", "标签", "备注", "上传时间"],
      ...rows.map((asset) => [
        asset.originalName,
        asset.publicUrl || "",
        asset.gameName,
        asset.channelName,
        asset.category,
        asset.width || "",
        asset.height || "",
        asset.orientation,
        formatBytes(asset.size),
        asset.extension.toUpperCase(),
        asset.tags.join("|"),
        asset.note,
        formatDate(asset.uploadedAt),
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `asset_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  return (
    <main className="flex-1 space-y-6 p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="素材总数" value={stats.total} />
        <Metric label="图片素材" value={stats.images} />
        <Metric label="视频数量" value={stats.videos} />
        <Metric label="总占用" value={formatBytes(stats.totalSize)} />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>上传素材</CardTitle>
          <CardDescription>
            素材会通过后台服务写入 Cloudflare R2，管理 Token 不会暴露到浏览器。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-center transition hover:bg-zinc-100"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void handleFiles(event.dataTransfer.files);
            }}
          >
            <FolderUp className="mb-3 h-6 w-6 text-zinc-500" />
            <span className="font-medium text-zinc-900">点击上传 / 拖拽上传</span>
            <span className="mt-1 text-xs text-zinc-500">
              PNG、JPG、WEBP、GIF、SVG、PSD、ZIP、RAR、7Z、MP4、MOV、PDF，单文件不超过 50MB
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => void handleFiles(event.target.files)}
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="游戏名">
              <Input value={uploadMeta.gameName} placeholder="例如：仙帝神兵" onChange={(event) => setUploadMeta({ ...uploadMeta, gameName: event.target.value })} />
            </Field>
            <Field label="渠道名">
              <Input value={uploadMeta.channelName} placeholder="九游 / TapTap / Google Play" onChange={(event) => setUploadMeta({ ...uploadMeta, channelName: event.target.value })} />
            </Field>
            <Field label="默认分类">
              <select className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm" value={uploadMeta.category} onChange={(event) => setUploadMeta({ ...uploadMeta, category: event.target.value })}>
                <option value="">自动识别</option>
                {["未分类", "Logo", "Icon", "Banner", "闪屏", "宣传图", "商店图", "截图", "视频", "PSD源文件", "压缩包", "其他"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="标签">
              <Input value={uploadMeta.tags} placeholder="1080x450, 九游, 首页banner" onChange={(event) => setUploadMeta({ ...uploadMeta, tags: event.target.value })} />
            </Field>
            <Field label="备注">
              <Input value={uploadMeta.note} placeholder="素材用途、投放位置、版本说明" onChange={(event) => setUploadMeta({ ...uploadMeta, note: event.target.value })} />
            </Field>
            <div className="flex items-end gap-2">
              <input
                id="asset-public"
                type="checkbox"
                checked={uploadMeta.isPublic}
                onChange={(event) => setUploadMeta({ ...uploadMeta, isPublic: event.target.checked })}
              />
              <Label htmlFor="asset-public" className="pb-2 text-sm text-zinc-700">
                公开访问
              </Label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={folderInputRef}
              type="file"
              multiple
              // @ts-expect-error webkitdirectory is supported by Chromium-based browsers.
              webkitdirectory=""
              className="sr-only"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <Button type="button" variant="outline" onClick={() => folderInputRef.current?.click()} disabled={isUploading}>
              <FolderUp />
              上传文件夹
            </Button>
            <Button type="button" variant="outline" onClick={exportCsv} disabled={!filteredAssets.length}>
              导出 CSV
            </Button>
            <Button type="button" variant="ghost" onClick={() => void loadAssets()}>
              <RefreshCw />
              刷新列表
            </Button>
            <span className="text-sm text-zinc-500">{status}</span>
          </div>
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>素材清单</CardTitle>
          <CardDescription>默认列表视图，适合内部检索、复制链接和批量核对。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input className="pl-9" value={query} placeholder="名称、渠道、分类、尺寸" onChange={(event) => setQuery(event.target.value)} />
            </div>
            <Select value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} allLabel="全部分类" />
            <Select value={channelFilter} onChange={setChannelFilter} options={channelOptions} allLabel="全部渠道" />
            <Select value={orientationFilter} onChange={setOrientationFilter} options={["横图", "竖图", "方图", "未知"]} allLabel="全部方向" />
            <Select value={formatFilter} onChange={setFormatFilter} options={formatOptions} allLabel="全部格式" />
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>预览</TableHead>
                  <TableHead>文件名</TableHead>
                  <TableHead>游戏名</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>尺寸</TableHead>
                  <TableHead>方向</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>种类</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead className="min-w-56">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length ? (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>{preview(asset)}</TableCell>
                      <TableCell className="max-w-56">
                        <div className="truncate font-medium">{asset.displayName}</div>
                        <div className="truncate text-xs text-zinc-500">{asset.originalName}</div>
                      </TableCell>
                      <TableCell>{asset.gameName || "-"}</TableCell>
                      <TableCell>{asset.channelName || "-"}</TableCell>
                      <TableCell>{asset.category}</TableCell>
                      <TableCell className="font-mono text-xs">{dimensionLabel(asset)}</TableCell>
                      <TableCell>{asset.orientation}</TableCell>
                      <TableCell>{formatBytes(asset.size)}</TableCell>
                      <TableCell>{asset.kind}</TableCell>
                      <TableCell className="font-mono text-xs">{formatDate(asset.uploadedAt)}</TableCell>
                      <TableCell className="max-w-48 truncate">{asset.tags.join(", ")}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {asset.publicUrl ? (
                            <Button asChild size="sm" variant="outline">
                              <a href={asset.publicUrl} target="_blank" rel="noreferrer">
                                <ExternalLink />
                                预览
                              </a>
                            </Button>
                          ) : null}
                          <Button size="sm" variant="outline" onClick={() => void copyLink(asset)} disabled={!asset.publicUrl}>
                            <Copy />
                            复制
                          </Button>
                          {asset.publicUrl ? (
                            <Button asChild size="sm" variant="outline">
                              <a href={asset.publicUrl} download={asset.originalName}>
                                <Download />
                                下载
                              </a>
                            </Button>
                          ) : null}
                          <Button size="sm" variant="outline" onClick={() => void editAsset(asset)}>
                            编辑
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => void deleteAsset(asset)}>
                            <Trash2 />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-32 text-center text-zinc-500">
                      暂无素材或没有匹配结果
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <div className="mt-1 text-sm text-zinc-500">{label}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm text-zinc-700">{label}</Label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  allLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <select
      className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="all">{allLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function preview(asset: Asset) {
  if (asset.publicUrl && IMAGE_EXTENSIONS.has(asset.extension) && asset.extension !== "svg") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.publicUrl} alt="" className="h-12 w-16 rounded-md object-cover" />
    );
  }
  const Icon = ARCHIVE_EXTENSIONS.has(asset.extension) ? FileArchive : FileImage;
  return (
    <div className="flex h-12 w-16 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-500">
      <Icon className="h-4 w-4" />
    </div>
  );
}

async function analyzeFile(file: File, meta: UploadMeta) {
  const extension = extensionOf(file.name);
  const dimension = await readDimension(file, extension);
  const detected = detectAsset(file, dimension, extension);
  const channelName = meta.channelName.trim() || detected.channelName;
  const category = meta.category || detected.category;
  return {
    gameName: meta.gameName.trim(),
    channelName,
    category,
    tags: unique([...detected.tags, ...parseTags(meta.tags)]),
    note: meta.note.trim(),
    width: dimension.width,
    height: dimension.height,
    orientation: orientationOf(dimension.width, dimension.height),
  };
}

function detectAsset(file: File, dimension: { width: number | null; height: number | null }, extension: string) {
  const name = normalize(file.name);
  const spec = dimension.width && dimension.height ? `${dimension.width}x${dimension.height}` : "";
  let category = "未分类";
  const tags: string[] = [];
  const channelName = inferChannel(file.name);
  if (KNOWN_SPECS[spec]) {
    category = KNOWN_SPECS[spec][0];
    tags.push(...KNOWN_SPECS[spec][1], spec);
  }
  [
    ["Logo", "Logo", ["logo"]],
    ["Icon", "Icon", ["icon", "图标"]],
    ["Banner", "Banner", ["banner"]],
    ["闪屏", "闪屏", ["splash", "闪屏"]],
    ["闪屏", "loading图", ["loading"]],
  ].forEach(([nextCategory, tag, keys]) => {
    if ((keys as string[]).some((key) => name.includes(normalize(key)))) {
      category = String(nextCategory);
      tags.push(String(tag));
    }
  });
  if (extension === "psd") category = "PSD源文件";
  if (ARCHIVE_EXTENSIONS.has(extension)) category = "压缩包";
  if (VIDEO_EXTENSIONS.has(extension)) category = "视频";
  if (category === "未分类") category = inferByRatio(dimension.width, dimension.height, extension);
  if (channelName !== "未识别") tags.push(channelName);
  return { category, channelName, tags: unique(tags) };
}

function inferChannel(name: string) {
  const text = normalize(name);
  const rules: Array<[string, string[]]> = [
    ["九游", ["九游", "9you", "jiuyou"]],
    ["豌豆荚", ["豌豆荚", "wandoujia"]],
    ["TapTap", ["taptap", "tap"]],
    ["biubiu", ["biubiu"]],
    ["应用宝", ["yingyongbao", "应用宝"]],
    ["华为", ["huawei", "华为"]],
    ["OPPO", ["oppo"]],
    ["vivo", ["vivo"]],
    ["Apple", ["apple", "appstore", "ios"]],
    ["Google Play", ["googleplay", "google play", "gp"]],
  ];
  return rules.find(([, keys]) => keys.some((key) => text.includes(normalize(key))))?.[0] || "未识别";
}

function inferByRatio(width: number | null, height: number | null, extension: string) {
  if (ARCHIVE_EXTENSIONS.has(extension)) return "压缩包";
  if (VIDEO_EXTENSIONS.has(extension)) return "视频";
  if (!width || !height) return "其他";
  if (width === height) return width <= 1200 ? "Icon" : "商店图";
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.08) return "宣传图";
  if (Math.abs(ratio - 9 / 16) < 0.08) return "宣传图";
  if (height > width * 2) return "闪屏";
  if (width > height * 2) return "Banner";
  return ratio > 1 ? "横版宣传图" : "竖版宣传图";
}

function readDimension(file: File, extension: string): Promise<{ width: number | null; height: number | null }> {
  if (extension === "psd") return readPsdDimension(file);
  if (!IMAGE_EXTENSIONS.has(extension)) return Promise.resolve({ width: null, height: null });
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth || null, height: image.naturalHeight || null });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

async function readPsdDimension(file: File) {
  try {
    const buffer = await file.slice(0, 26).arrayBuffer();
    const view = new DataView(buffer);
    const signature = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (signature !== "8BPS") return { width: null, height: null };
    return { height: view.getUint32(14, false), width: view.getUint32(18, false) };
  } catch {
    return { width: null, height: null };
  }
}

function normalizeAsset(asset: Asset): Asset {
  const extension = asset.extension || extensionOf(asset.originalName || asset.key || "");
  return {
    ...asset,
    originalName: asset.originalName || "素材",
    displayName: asset.displayName || asset.originalName || "素材",
    channelName: asset.channelName || "未识别",
    category: asset.category || "未分类",
    tags: Array.isArray(asset.tags) ? asset.tags : [],
    extension,
    kind: asset.kind || kindOf(extension),
    mimeType: asset.mimeType || "",
    size: Number(asset.size) || 0,
    width: asset.width ? Number(asset.width) : null,
    height: asset.height ? Number(asset.height) : null,
    orientation: asset.orientation || orientationOf(asset.width, asset.height),
    uploadedAt: asset.uploadedAt || new Date().toISOString(),
  };
}

function mergeAssets(current: Asset[], incoming: Asset[]) {
  const map = new Map(current.map((asset) => [asset.id, asset]));
  incoming.forEach((asset) => map.set(asset.id, asset));
  return Array.from(map.values()).sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
}

async function fetchJson<T = { ok: boolean }>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }
  return data as T;
}

function parseTags(value: string | string[]) {
  if (Array.isArray(value)) return value;
  return value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

function extensionOf(filename: string) {
  return filename.toLowerCase().match(/\.([^.]+)$/)?.[1] || "";
}

function orientationOf(width: number | null, height: number | null) {
  if (!width || !height) return "未知";
  if (width > height) return "横图";
  if (width < height) return "竖图";
  return "方图";
}

function dimensionLabel(asset: Asset) {
  return asset.width && asset.height ? `${asset.width}x${asset.height}` : "-";
}

function kindOf(extension: string) {
  const map: Record<string, string> = {
    png: "PNG 图片",
    jpg: "JPEG 图片",
    jpeg: "JPEG 图片",
    webp: "WEBP 图片",
    gif: "GIF 图片",
    psd: "PSD 源文件",
    svg: "SVG 矢量图",
    pdf: "PDF 文档",
    zip: "ZIP 压缩包",
    rar: "RAR 压缩包",
    "7z": "7Z 压缩包",
    mp4: "MP4 视频",
    mov: "MOV 视频",
  };
  return map[extension] || "未知";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作失败";
}
