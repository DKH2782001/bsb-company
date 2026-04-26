import { NextResponse } from "next/server";
import { appEnv, hasSupabaseEnv } from "@/lib/env";
import { getAuthenticatedUser, getServiceClient, getUserContext } from "@/lib/repositories/shared";
import {
  STORAGE_BUCKETS,
  isStorageBucketId,
  sanitizeFileName,
  type StoredFile,
} from "@/lib/storage/config";

export const runtime = "nodejs";

type UploadError = {
  ok: false;
  message: string;
  requirements?: string[];
};

function jsonError(status: number, body: UploadError) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv() || !appEnv.supabaseServiceRoleKey) {
    return jsonError(503, {
      ok: false,
      message: "Storage upload chua duoc cau hinh Supabase.",
      requirements: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "Apply migration tao buckets: avatars, documents, payslips, contracts",
      ],
    });
  }

  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!user || !context.companyId) {
    return jsonError(401, { ok: false, message: "Ban can dang nhap de upload file." });
  }

  const formData = await request.formData();
  const bucket = String(formData.get("bucket") ?? "");
  const rawFile = formData.get("file");

  if (!isStorageBucketId(bucket)) {
    return jsonError(400, { ok: false, message: "Bucket upload khong hop le." });
  }
  if (!(rawFile instanceof File)) {
    return jsonError(400, { ok: false, message: "Khong tim thay file upload." });
  }

  const config = STORAGE_BUCKETS[bucket];
  const allowedMimeTypes: readonly string[] = config.allowedMimeTypes;
  const mimeType = rawFile.type || "application/octet-stream";
  if (rawFile.size <= 0) {
    return jsonError(400, { ok: false, message: "File rong." });
  }
  if (rawFile.size > config.maxSizeBytes) {
    return jsonError(413, { ok: false, message: `File vuot qua gioi han ${Math.round(config.maxSizeBytes / 1024 / 1024)}MB.` });
  }
  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
    return jsonError(415, { ok: false, message: "Dinh dang file khong duoc ho tro cho bucket nay." });
  }

  const safeName = sanitizeFileName(rawFile.name || "upload");
  const fileName = `${Date.now()}-${safeName || "file"}`;
  const path = `${context.companyId}/${user.id}/${config.pathPrefix}/${fileName}`;

  const service = await getServiceClient();
  const { error } = await service.storage.from(bucket).upload(path, rawFile, {
    contentType: mimeType,
    upsert: bucket === "avatars",
  });

  if (error) {
    return jsonError(500, { ok: false, message: error.message });
  }

  let publicUrl: string | null = null;
  let signedUrl: string | null = null;
  if (config.public) {
    publicUrl = service.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  } else {
    const { data, error: signedError } = await service.storage.from(bucket).createSignedUrl(path, 60 * 60);
    if (signedError) {
      return jsonError(500, { ok: false, message: signedError.message });
    }
    signedUrl = data.signedUrl;
  }

  const file: StoredFile = {
    bucket,
    path,
    name: rawFile.name,
    size: rawFile.size,
    mimeType,
    url: publicUrl ?? signedUrl,
    signedUrl,
    publicUrl,
  };

  return NextResponse.json({ ok: true, file });
}
