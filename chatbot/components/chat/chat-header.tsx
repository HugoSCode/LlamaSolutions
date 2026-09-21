"use client";

import { PanelLeftIcon } from "lucide-react";
import Image from "next/image";
import { memo } from "react";
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
    <header className="app-chat-header sticky top-0 flex h-16 min-h-16 items-center gap-3 bg-sidebar px-4 text-sidebar-foreground">
      <button
        aria-label="Open navigation"
        className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
        onClick={toggleSidebar}
        type="button"
      >
        <PanelLeftIcon className="size-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
        <Image
          alt="Otago Polytechnic"
          className="app-brand-logo h-12 w-auto shrink-0 rounded-sm object-contain"
          height={48}
          src="/images/oplogo.png"
          width={160}
        />
        <div className="min-w-0 leading-none">
          <p className="truncate font-semibold text-sm">
            Otago Polytechnic Assistant
          </p>
        </div>
      </div>

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
