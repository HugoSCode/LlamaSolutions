"use client";

import { PanelLeftIcon } from "lucide-react";
import { memo } from "react";
import { useSidebar } from "@/components/ui/sidebar";
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
  const { state, toggleSidebar, isMobile } = useSidebar();

  if (state === "collapsed" && !isMobile) {
    return null;
  }

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
        <img
          alt="Otago Polytechnic"
          className="app-brand-logo h-12 w-auto shrink-0 rounded-sm object-contain"
          src="/images/oplogo.png"
        />
        <div className="min-w-0 leading-none">
          <p className="truncate font-semibold text-sm">Otago Polytechnic Assistant</p>
        </div>
      </div>

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      <div className="app-study-space ml-auto hidden rounded-full border border-sidebar-border bg-sidebar-accent/40 px-3 py-1.5 text-xs text-sidebar-foreground/70 md:block">
        Study space
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
