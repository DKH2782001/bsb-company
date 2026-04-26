"use client";

import { StorageUploadDropzone } from "@/components/storage/StorageUploadDropzone";

const uploadTargets = [
  {
    bucket: "documents" as const,
    title: "Ho so ca nhan",
    description: "CCCD, bang cap, chung chi, so yeu ly lich.",
  },
  {
    bucket: "contracts" as const,
    title: "Hop dong",
    description: "Hop dong lao dong va phu luc da ky.",
  },
  {
    bucket: "payslips" as const,
    title: "Payslip",
    description: "Phieu luong PDF hoac anh scan.",
  },
];

export function ProfileDocumentUploads() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {uploadTargets.map((target) => (
        <StorageUploadDropzone
          key={target.bucket}
          bucket={target.bucket}
          title={target.title}
          description={target.description}
        />
      ))}
    </div>
  );
}
