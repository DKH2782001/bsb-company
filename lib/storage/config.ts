export const STORAGE_BUCKETS = {
  avatars: {
    label: "Avatar",
    description: "Anh dai dien cong khai.",
    public: true,
    maxSizeBytes: 5 * 1024 * 1024,
    accept: "image/png,image/jpeg,image/webp",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    pathPrefix: "avatars",
  },
  documents: {
    label: "Tai lieu",
    description: "Tai lieu noi bo rieng tu.",
    public: false,
    maxSizeBytes: 20 * 1024 * 1024,
    accept: ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt",
    allowedMimeTypes: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "text/plain",
    ],
    pathPrefix: "documents",
  },
  payslips: {
    label: "Payslip",
    description: "Phieu luong rieng tu.",
    public: false,
    maxSizeBytes: 10 * 1024 * 1024,
    accept: ".pdf,.png,.jpg,.jpeg,.webp",
    allowedMimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
    pathPrefix: "payslips",
  },
  contracts: {
    label: "Hop dong",
    description: "Hop dong va phu luc rieng tu.",
    public: false,
    maxSizeBytes: 20 * 1024 * 1024,
    accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp",
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/webp",
    ],
    pathPrefix: "contracts",
  },
} as const;

export type StorageBucketId = keyof typeof STORAGE_BUCKETS;

export type StoredFile = {
  bucket: StorageBucketId;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  url: string | null;
  signedUrl: string | null;
  publicUrl: string | null;
};

export function isStorageBucketId(value: string): value is StorageBucketId {
  return value in STORAGE_BUCKETS;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function sanitizeFileName(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
