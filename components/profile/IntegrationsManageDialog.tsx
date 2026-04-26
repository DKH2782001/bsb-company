"use client";

import { useState } from "react";
import { Plug, ExternalLink, RefreshCw, Settings2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

type Integration = {
  provider: string;
  active: boolean;
  config: Record<string, unknown>;
};

const integrationIcons: Record<string, string> = {
  "Google Workspace": "🟢",
  "Slack": "💬",
  "Notion": "📝",
  "CRM System": "📊",
};

export function IntegrationsManageDialog({
  integrations,
}: {
  integrations: Integration[];
}) {
  const [open, setOpen] = useState(false);
  const [localIntegrations, setLocalIntegrations] = useState(integrations);
  const { toast } = useToast();

  function toggleIntegration(provider: string) {
    setLocalIntegrations((prev) =>
      prev.map((i) =>
        i.provider === provider ? { ...i, active: !i.active } : i
      )
    );
    const integration = localIntegrations.find((i) => i.provider === provider);
    toast({
      variant: "success",
      title: integration?.active ? "Đã ngắt kết nối" : "Đã kết nối",
      description: provider,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--brand-600)] cursor-pointer hover:text-[var(--brand-700)] transition-colors"
      >
        Quản lý
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-[var(--brand-600)]" />
            Ứng dụng kết nối
          </div>
        }
        description="Quản lý các ứng dụng bên thứ 3 được kết nối với tài khoản của bạn."
        size="md"
        footer={
          <Button onClick={() => setOpen(false)}>Đóng</Button>
        }
      >
        <div className="space-y-3">
          {localIntegrations.map((integration) => (
            <div
              key={integration.provider}
              className="rounded-2xl border border-[var(--line-soft)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-lg">
                    {integrationIcons[integration.provider] ?? "🔗"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[var(--text-strong)]">
                      {integration.provider}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--text-soft)]">
                      {typeof integration.config === "object" && integration.config && "workspace" in integration.config
                        ? String(integration.config.workspace)
                        : "—"}
                    </div>
                  </div>
                </div>
                <Badge variant={integration.active ? "success" : "outline"}>
                  {integration.active ? "Đã kết nối" : "Chưa kết nối"}
                </Badge>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-[var(--line-soft)] pt-3">
                <Button
                  size="sm"
                  variant={integration.active ? "outline" : "default"}
                  onClick={() => toggleIntegration(integration.provider)}
                >
                  {integration.active ? (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Ngắt kết nối
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3 w-3" />
                      Kết nối
                    </>
                  )}
                </Button>
                {integration.active && (
                  <Button size="sm" variant="ghost">
                    <Settings2 className="h-3 w-3" />
                    Cấu hình
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
}
