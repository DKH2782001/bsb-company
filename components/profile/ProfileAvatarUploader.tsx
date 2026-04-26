"use client";

import { useState, useTransition } from "react";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
import { StorageUploadDropzone } from "@/components/storage/StorageUploadDropzone";
import { useToast } from "@/components/ui/toast";
import { updateAvatarAction } from "@/app/(app)/profile/actions";
import type { StoredFile } from "@/lib/storage/config";

export function ProfileAvatarUploader({
  name,
  initialAvatarUrl,
}: {
  name: string;
  initialAvatarUrl?: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? null);
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  function persistAvatar(file: StoredFile) {
    if (!file.url) return;
    setAvatarUrl(file.url);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("avatarUrl", file.url ?? "");
      formData.set("storagePath", file.path);
      try {
        await updateAvatarAction(formData);
      } catch (err) {
        toast({
          variant: "error",
          title: "Chua luu duoc avatar",
          description: err instanceof Error ? err.message : "Vui long thu lai.",
        });
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <EntityAvatar name={name} size="lg" imageUrl={avatarUrl} />
      <div className="w-full">
        <StorageUploadDropzone
          bucket="avatars"
          compact
          onUploaded={persistAvatar}
        />
      </div>
    </div>
  );
}
