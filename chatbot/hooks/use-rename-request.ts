"use client";

import { useEffect } from "react";

const RENAME_EVENT = "llama:rename-chat";

export function requestChatRename(chatId: string) {
  window.dispatchEvent(
    new CustomEvent(RENAME_EVENT, {
      detail: { chatId },
    })
  );
}

export function useRenameRequest(onRename: (chatId: string) => void) {
  useEffect(() => {
    const handleRename = (event: Event) => {
      const chatId = (event as CustomEvent<{ chatId?: string }>).detail?.chatId;
      if (chatId) {
        onRename(chatId);
      }
    };

    window.addEventListener(RENAME_EVENT, handleRename);
    return () => {
      window.removeEventListener(RENAME_EVENT, handleRename);
    };
  }, [onRename]);
}
