"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useLocalHistory } from "@/hooks/use-local-history";
import { useRenameRequest } from "@/hooks/use-rename-request";
import { useSyncMode } from "@/hooks/use-sync-mode";
import { deleteChatByMode } from "@/lib/chat-client";
import {
  type ChatHistory,
  getChatHistoryPaginationKey,
} from "@/lib/chat-history";
import type { Chat } from "@/lib/db/schema";
import { LOCAL_HISTORY_SWR_KEY, localChatToChat } from "@/lib/local-chats";
import { fetcher } from "@/lib/utils";
import { LoaderIcon } from "./icons";
import { ChatItem } from "./sidebar-history-item";

export type { ChatHistory } from "@/lib/chat-history";

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      lastMonth: [],
      lastWeek: [],
      older: [],
      today: [],
      yesterday: [],
    } as GroupedChats
  );
};

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const id = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;
  const { isLocal } = useSyncMode();
  const { chatId, chatTitle, messages, setChatTitle } = useActiveChat();
  const { mutate: globalMutate } = useSWRConfig();
  const {
    data: localRecords = [],
    isLoading: isLocalLoading,
    mutate: mutateLocal,
  } = useLocalHistory(isLocal);

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(
    user && !isLocal ? getChatHistoryPaginationKey : () => null,
    fetcher,
    { fallbackData: [], revalidateOnFocus: false }
  );

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const localChats = useMemo(
    () => localRecords.map(localChatToChat),
    [localRecords]
  );

  const handleStartRename = useCallback((chatIdToRename: string) => {
    setRenamingId(chatIdToRename);
  }, []);

  const handleRenameRequest = useCallback(
    (chatIdToRename: string) => {
      const knownIds = isLocal
        ? localChats.map((chat) => chat.id)
        : (paginatedChatHistories ?? []).flatMap((page) =>
            page.chats.map((chat) => chat.id)
          );

      if (!knownIds.includes(chatIdToRename)) {
        toast("Send a message before renaming");
        return;
      }

      setRenamingId(chatIdToRename);
    },
    [isLocal, localChats, paginatedChatHistories]
  );

  useRenameRequest(handleRenameRequest);

  const handleRenamed = useCallback(
    (renamedId: string, title: string) => {
      setRenamingId(null);

      if (renamedId === chatId) {
        setChatTitle(title);
      }

      if (isLocal) {
        mutateLocal();
        globalMutate(LOCAL_HISTORY_SWR_KEY);
        return;
      }

      mutate((chatHistories) =>
        chatHistories?.map((chatHistory) => ({
          ...chatHistory,
          chats: chatHistory.chats.map((chat) =>
            chat.id === renamedId ? { ...chat, title } : chat
          ),
        }))
      );
    },
    [chatId, globalMutate, isLocal, mutate, mutateLocal, setChatTitle]
  );

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const handleDelete = useCallback(() => {
    const chatToDelete = deleteId;
    const isCurrentChat = pathname === `/chat/${chatToDelete}`;

    setShowDeleteDialog(false);

    if (!chatToDelete) {
      return;
    }

    if (isCurrentChat) {
      router.replace("/");
    }

    if (isLocal) {
      deleteChatByMode({ chatId: chatToDelete, isLocal: true }).then(() => {
        mutateLocal();
        globalMutate(LOCAL_HISTORY_SWR_KEY);
      });
    } else {
      mutate((chatHistories) => {
        if (chatHistories) {
          return chatHistories.map((chatHistory) => ({
            ...chatHistory,
            chats: chatHistory.chats.filter((chat) => chat.id !== chatToDelete),
          }));
        }
      });

      deleteChatByMode({ chatId: chatToDelete, isLocal: false });
    }

    toast.success("Chat deleted");
  }, [deleteId, globalMutate, isLocal, mutate, mutateLocal, pathname, router]);

  const handleShowDeleteDialog = useCallback((targetChatId: string) => {
    setDeleteId(targetChatId);
    setShowDeleteDialog(true);
  }, []);

  const handleViewportEnter = useCallback(() => {
    if (!isValidating && !hasReachedEnd) {
      setSize((size) => size + 1);
    }
  }, [hasReachedEnd, isValidating, setSize]);

  const currentExport = {
    id: chatId,
    messages,
    title: chatTitle,
  };

  if (!user && !isLocal) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-[13px] text-sidebar-foreground/60">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if ((isLocal && isLocalLoading) || (!isLocal && isLoading)) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          History
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex flex-col gap-0.5 px-1">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                className="flex h-8 items-center gap-2 rounded-lg px-2"
                key={item}
              >
                <div
                  className="h-3 max-w-(--skeleton-width) flex-1 animate-pulse rounded-md bg-sidebar-foreground/[0.06]"
                  style={
                    {
                      "--skeleton-width": `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const hasEmptyLocalHistory = isLocal && localChats.length === 0;

  if ((isLocal && hasEmptyLocalHistory) || (!isLocal && hasEmptyChatHistory)) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          History
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-[13px] text-sidebar-foreground/60">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          History
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {(() => {
              const chatsFromHistory = isLocal
                ? localChats
                : (paginatedChatHistories ?? []).flatMap(
                    (paginatedChatHistory) => paginatedChatHistory.chats
                  );

              const groupedChats = groupChatsByDate(chatsFromHistory);

              return (
                <div className="flex flex-col gap-4">
                  {groupedChats.today.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Today
                      </div>
                      {groupedChats.today.map((chat) => (
                        <ChatItem
                          chat={chat}
                          currentExport={currentExport}
                          isActive={chat.id === id}
                          isRenaming={renamingId === chat.id}
                          key={chat.id}
                          onDelete={handleShowDeleteDialog}
                          onRenamed={handleRenamed}
                          onStartRename={handleStartRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.yesterday.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Yesterday
                      </div>
                      {groupedChats.yesterday.map((chat) => (
                        <ChatItem
                          chat={chat}
                          currentExport={currentExport}
                          isActive={chat.id === id}
                          isRenaming={renamingId === chat.id}
                          key={chat.id}
                          onDelete={handleShowDeleteDialog}
                          onRenamed={handleRenamed}
                          onStartRename={handleStartRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.lastWeek.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Last 7 days
                      </div>
                      {groupedChats.lastWeek.map((chat) => (
                        <ChatItem
                          chat={chat}
                          currentExport={currentExport}
                          isActive={chat.id === id}
                          isRenaming={renamingId === chat.id}
                          key={chat.id}
                          onDelete={handleShowDeleteDialog}
                          onRenamed={handleRenamed}
                          onStartRename={handleStartRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.lastMonth.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Last 30 days
                      </div>
                      {groupedChats.lastMonth.map((chat) => (
                        <ChatItem
                          chat={chat}
                          currentExport={currentExport}
                          isActive={chat.id === id}
                          isRenaming={renamingId === chat.id}
                          key={chat.id}
                          onDelete={handleShowDeleteDialog}
                          onRenamed={handleRenamed}
                          onStartRename={handleStartRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.older.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Older
                      </div>
                      {groupedChats.older.map((chat) => (
                        <ChatItem
                          chat={chat}
                          currentExport={currentExport}
                          isActive={chat.id === id}
                          isRenaming={renamingId === chat.id}
                          key={chat.id}
                          onDelete={handleShowDeleteDialog}
                          onRenamed={handleRenamed}
                          onStartRename={handleStartRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </SidebarMenu>

          {isLocal ? null : (
            <motion.div onViewportEnter={handleViewportEnter} />
          )}

          {isLocal || hasReachedEnd ? null : (
            <div className="mt-1 flex flex-row items-center gap-2 px-4 py-2 text-sidebar-foreground/50">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div className="text-[11px]">Loading...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
