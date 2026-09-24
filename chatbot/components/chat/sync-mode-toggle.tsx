"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useSyncMode } from "@/hooks/use-sync-mode";
import { copyChatToCloud, copyChatToLocal } from "@/lib/chat-client";
import { getChatHistoryPaginationKey } from "@/lib/chat-history";
import { LOCAL_HISTORY_SWR_KEY } from "@/lib/local-chats";
import type { SyncMode } from "@/lib/sync-mode";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

type SyncModeToggleProps = {
  chatId: string;
  messages: ChatMessage[];
  title: string;
};

export function SyncModeToggle({
  chatId,
  messages,
  title,
}: SyncModeToggleProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { canUseCloud, setSyncMode, syncMode } = useSyncMode();
  const [pendingMode, setPendingMode] = useState<SyncMode | null>(null);

  const handleSelect = useCallback(
    (next: SyncMode) => {
      if (next === syncMode) {
        return;
      }

      if (next === "cloud" && !canUseCloud) {
        toast.error("Sign in to use Cloud sync");
        return;
      }

      setPendingMode(next);
    },
    [canUseCloud, syncMode]
  );

  const closeDialog = useCallback(() => {
    setPendingMode(null);
  }, []);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDialog();
      }
    },
    [closeDialog]
  );

  const refreshStores = useCallback(() => {
    mutate(LOCAL_HISTORY_SWR_KEY);
    mutate(unstable_serialize(getChatHistoryPaginationKey));
  }, [mutate]);

  const handleCopyCurrent = useCallback(async () => {
    if (!pendingMode) {
      return;
    }

    try {
      if (pendingMode === "local") {
        await copyChatToLocal({ chatId, messages, title });
      } else {
        await copyChatToCloud({ chatId, messages, title });
      }

      setSyncMode(pendingMode);
      setPendingMode(null);
      refreshStores();
      toast.success(
        pendingMode === "local"
          ? "Copied the current chat to Local incognito"
          : "Copied the current chat to Cloud sync"
      );
    } catch {
      toast.error("Failed to copy the current chat");
    }
  }, [chatId, messages, pendingMode, refreshStores, setSyncMode, title]);

  const handleLeaveBehind = useCallback(() => {
    if (!pendingMode) {
      return;
    }

    setSyncMode(pendingMode);
    setPendingMode(null);
    refreshStores();
    router.replace("/");
    toast.success(
      pendingMode === "local"
        ? "Switched to Local incognito"
        : "Switched to Cloud sync"
    );
  }, [pendingMode, refreshStores, router, setSyncMode]);

  const handleSelectLocal = useCallback(() => {
    handleSelect("local");
  }, [handleSelect]);

  const handleSelectCloud = useCallback(() => {
    handleSelect("cloud");
  }, [handleSelect]);

  return (
    <>
      <fieldset
        className="m-0 inline-flex min-w-0 rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-0.5"
        data-testid="sync-mode-toggle"
      >
        <legend className="sr-only">Sync mode</legend>
        <button
          aria-pressed={syncMode === "local"}
          className={cn(
            "rounded-md px-2.5 py-1 text-[13px] transition-colors duration-150",
            syncMode === "local"
              ? "bg-background text-foreground shadow-sm"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
          )}
          data-testid="sync-mode-local"
          onClick={handleSelectLocal}
          type="button"
        >
          Local incognito
        </button>
        <button
          aria-pressed={syncMode === "cloud"}
          className={cn(
            "rounded-md px-2.5 py-1 text-[13px] transition-colors duration-150",
            syncMode === "cloud"
              ? "bg-background text-foreground shadow-sm"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
          )}
          data-testid="sync-mode-cloud"
          onClick={handleSelectCloud}
          type="button"
        >
          Cloud sync
        </button>
      </fieldset>

      <AlertDialog
        onOpenChange={handleDialogOpenChange}
        open={pendingMode !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch sync mode?</AlertDialogTitle>
            <AlertDialogDescription>
              Local and cloud chats are kept separate. Choose how to handle the
              current conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction onClick={handleCopyCurrent}>
              Copy current chat
            </AlertDialogAction>
            <AlertDialogAction onClick={handleLeaveBehind}>
              Leave behind
            </AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
