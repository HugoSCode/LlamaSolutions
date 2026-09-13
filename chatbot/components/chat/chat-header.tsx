"use client";

import { PanelLeftIcon } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useSyncMode } from "@/hooks/use-sync-mode";
import { ExportChatButton } from "./export-chat-button";
import { SyncModeToggle } from "./sync-mode-toggle";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { toggleSidebar } = useSidebar();
  const { isLocal } = useSyncMode();
  const { chatTitle, messages } = useActiveChat();

  return (
    <header className="sticky top-0 flex h-14 items-center gap-2 bg-sidebar px-3">
      <h1 className="shrink-0 text-white text-2xl font-bold">
        🦙LLAMA solutions
      </h1>
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
      </Button>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        {!isReadonly && !isLocal && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        )}
        <ExportChatButton
          chatId={chatId}
          fallback={{
            id: chatId,
            messages,
            title: chatTitle,
          }}
        />
        <SyncModeToggle chatId={chatId} messages={messages} title={chatTitle} />
      </div>
    </header>
  );
}

export const ChatHeader = memo(
  PureChatHeader,
  (prevProps, nextProps) =>
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
);
