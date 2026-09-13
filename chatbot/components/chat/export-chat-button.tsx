"use client";

import { DownloadIcon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useSyncMode } from "@/hooks/use-sync-mode";
import { exportChatById } from "@/lib/chat-client";
import type { ExportableChat } from "@/lib/export-chat";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function ExportChatButton({
  chatId,
  fallback,
}: {
  chatId: string;
  fallback?: ExportableChat;
}) {
  const { isLocal } = useSyncMode();

  const handleExport = useCallback(
    async (format: "markdown" | "json") => {
      try {
        await exportChatById({
          chatId,
          fallback,
          format,
          isLocal,
        });
        toast.success(format === "json" ? "已导出 JSON" : "已导出 Markdown");
      } catch {
        toast.error("导出失败");
      }
    },
    [chatId, fallback, isLocal]
  );

  const handleMarkdown = useCallback(() => {
    handleExport("markdown");
  }, [handleExport]);

  const handleJson = useCallback(() => {
    handleExport("json");
  }, [handleExport]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-8 rounded-lg px-2.5 text-[13px] text-sidebar-foreground/70 hover:text-sidebar-foreground"
          data-testid="export-chat-button"
          type="button"
          variant="ghost"
        >
          <DownloadIcon className="size-3.5" />
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer" onSelect={handleMarkdown}>
          导出 Markdown
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onSelect={handleJson}>
          导出 JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
