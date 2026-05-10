"use client";

import { useState } from "react";
import { X } from "lucide-react";

type PreviewFile = {
  name: string;
  type: string;
  dataUrl?: string;
};

export function ApprovalAttachmentPreview({ files }: { files: PreviewFile[] }) {
  const [activeImage, setActiveImage] = useState<PreviewFile | null>(null);

  return (
    <>
      {files.map((file) => {
        if (file.dataUrl && file.type.startsWith("image/")) {
          return (
            <button
              key={file.name}
              type="button"
              onClick={() => setActiveImage(file)}
              className="mt-3 block w-fit rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)]"
              title="Bam de xem anh lon"
            >
              <img
                src={file.dataUrl}
                alt={file.name}
                className="max-h-64 cursor-zoom-in rounded-xl border border-[var(--line-soft)] object-contain transition hover:brightness-95"
              />
              <span className="mt-1 block text-[11px] font-medium text-[var(--brand-600)]">
                Bam vao anh de xem lon
              </span>
            </button>
          );
        }

        if (file.dataUrl) {
          return (
            <a
              key={file.name}
              href={file.dataUrl}
              download={file.name}
              className="mt-2 inline-flex text-xs font-semibold text-[var(--brand-600)]"
            >
              Tai file minh chung
            </a>
          );
        }

        return null;
      })}

      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative max-h-[92vh] max-w-[92vw]" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg"
              aria-label="Dong anh"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={activeImage.dataUrl}
              alt={activeImage.name}
              className="max-h-[92vh] max-w-[92vw] rounded-2xl bg-white object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
