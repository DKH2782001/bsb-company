"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, ImageIcon, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  STORAGE_BUCKETS,
  formatFileSize,
  type StorageBucketId,
  type StoredFile,
} from "@/lib/storage/config";

type Props = {
  bucket: StorageBucketId;
  title?: string;
  description?: string;
  compact?: boolean;
  onUploaded?: (file: StoredFile) => void | Promise<void>;
};

type UploadState = "idle" | "ready" | "uploading" | "done" | "error";

export function StorageUploadDropzone({ bucket, title, description, compact = false, onUploaded }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const config = STORAGE_BUCKETS[bucket];
  const allowedMimeTypes: readonly string[] = config.allowedMimeTypes;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<StoredFile | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function selectFile(next: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setError(null);
    setUploaded(null);
    setProgress(0);
    if (!next) {
      setFile(null);
      setState("idle");
      return;
    }
    if (next.size > config.maxSizeBytes) {
      setFile(null);
      setState("error");
      setError(`File vuot qua gioi han ${formatFileSize(config.maxSizeBytes)}.`);
      return;
    }
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(next.type)) {
      setFile(null);
      setState("error");
      setError("Dinh dang file khong duoc ho tro.");
      return;
    }
    setFile(next);
    if (next.type.startsWith("image/")) {
      const nextPreviewUrl = URL.createObjectURL(next);
      previewUrlRef.current = nextPreviewUrl;
      setPreviewUrl(nextPreviewUrl);
    }
    setState("ready");
  }

  async function upload() {
    if (!file || state === "uploading") return;
    setState("uploading");
    setError(null);
    setProgress(1);

    try {
      const result = await uploadWithProgress(bucket, file, setProgress);
      setUploaded(result);
      setState("done");
      setProgress(100);
      await onUploaded?.(result);
      toast({ variant: "success", title: "Da upload file", description: result.name });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload that bai.";
      setState("error");
      setError(message);
      toast({ variant: "error", title: "Upload that bai", description: message });
    }
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {!compact && (
        <div>
          <div className="text-sm font-semibold text-[var(--text-strong)]">{title ?? config.label}</div>
          <div className="mt-1 text-xs text-[var(--text-soft)]">
            {description ?? config.description} Toi da {formatFileSize(config.maxSizeBytes)}.
          </div>
        </div>
      )}

      <label
        htmlFor={id}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          selectFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-4 text-center transition-colors",
          dragging ? "border-[var(--brand-600)] bg-indigo-50" : "border-[var(--line-soft)] hover:bg-[var(--surface-alt)]",
          compact && "p-3",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={config.accept}
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="" className="mb-3 h-24 w-24 rounded-2xl object-cover ring-1 ring-[var(--line-soft)]" />
        ) : file?.type.startsWith("image/") ? (
          <ImageIcon className="mb-2 h-6 w-6 text-[var(--brand-600)]" />
        ) : (
          <UploadCloud className="mb-2 h-6 w-6 text-[var(--brand-600)]" />
        )}
        <div className="text-sm font-medium text-[var(--text-strong)]">
          {file ? file.name : "Keo tha file hoac bam de chon"}
        </div>
        <div className="mt-1 text-xs text-[var(--text-soft)]">
          {file ? formatFileSize(file.size) : config.accept}
        </div>
      </label>

      {state === "uploading" && (
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-[var(--brand-600)] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploaded && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{uploaded.name}</span>
          {uploaded.url && (
            <a className="font-semibold hover:underline" href={uploaded.url} target="_blank" rel="noreferrer">
              Mo
            </a>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={upload} disabled={!file || state === "uploading"}>
          <FileText className="h-3.5 w-3.5" />
          Upload
        </Button>
        {file && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              selectFile(null);
            }}
          >
            <X className="h-3.5 w-3.5" />
            Xoa
          </Button>
        )}
      </div>
    </div>
  );
}

function uploadWithProgress(
  bucket: StorageBucketId,
  file: File,
  onProgress: (progress: number) => void,
): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.set("bucket", bucket);
    formData.set("file", file);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100))));
    };
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Server tra ve response khong hop le."));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && isUploadSuccess(body)) {
        resolve(body.file);
        return;
      }

      const message = isUploadError(body) ? body.message : `Upload that bai (${xhr.status}).`;
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Khong ket noi duoc upload endpoint."));
    xhr.open("POST", "/api/storage/upload");
    xhr.send(formData);
  });
}

function isUploadSuccess(value: unknown): value is { ok: true; file: StoredFile } {
  return Boolean(value && typeof value === "object" && "ok" in value && (value as { ok: unknown }).ok === true && "file" in value);
}

function isUploadError(value: unknown): value is { ok: false; message: string } {
  return Boolean(value && typeof value === "object" && "message" in value && typeof (value as { message: unknown }).message === "string");
}
