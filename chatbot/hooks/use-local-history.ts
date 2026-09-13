"use client";

import useSWR from "swr";
import {
  LOCAL_HISTORY_SWR_KEY,
  type LocalChatRecord,
  listLocalChats,
} from "@/lib/local-chats";

export function useLocalHistory(enabled: boolean) {
  return useSWR<LocalChatRecord[]>(
    enabled ? LOCAL_HISTORY_SWR_KEY : null,
    listLocalChats,
    {
      fallbackData: [],
      revalidateOnFocus: false,
    }
  );
}
