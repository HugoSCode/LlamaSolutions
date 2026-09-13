import { DownloadIcon, PenLineIcon } from "lucide-react";
import Link from "next/link";
import {
  type ChangeEvent,
  type KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { useSyncMode } from "@/hooks/use-sync-mode";
import { exportChatById, renameChat } from "@/lib/chat-client";
import type { Chat } from "@/lib/db/schema";
import type { ExportableChat } from "@/lib/export-chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "./icons";

const PureChatItem = ({
  chat,
  currentExport,
  isActive,
  isRenaming,
  onDelete,
  onRenamed,
  onStartRename,
  setOpenMobile,
}: {
  chat: Chat;
  currentExport?: ExportableChat;
  isActive: boolean;
  isRenaming: boolean;
  onDelete: (chatId: string) => void;
  onRenamed: (chatId: string, title: string) => void;
  onStartRename: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { isLocal } = useSyncMode();
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });
  const [draft, setDraft] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurRef = useRef(false);

  useEffect(() => {
    setDraft(chat.title);
  }, [chat.title]);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const closeMobile = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleSetPrivate = useCallback(() => {
    setVisibilityType("private");
  }, [setVisibilityType]);

  const handleSetPublic = useCallback(() => {
    setVisibilityType("public");
  }, [setVisibilityType]);

  const handleDelete = useCallback(() => {
    onDelete(chat.id);
  }, [chat.id, onDelete]);

  const handleDraftChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDraft(event.target.value);
    },
    []
  );

  const handleStartRename = useCallback(() => {
    onStartRename(chat.id);
  }, [chat.id, onStartRename]);

  const cancelRename = useCallback(() => {
    skipBlurRef.current = true;
    setDraft(chat.title);
    onRenamed(chat.id, chat.title);
  }, [chat.id, chat.title, onRenamed]);

  const commitRename = useCallback(async () => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }

    const nextTitle = draft.trim() || chat.title;

    try {
      const saved = await renameChat({
        chatId: chat.id,
        isLocal,
        title: nextTitle,
      });
      onRenamed(chat.id, saved);
    } catch {
      toast.error("重命名失败");
      cancelRename();
    }
  }, [cancelRename, chat.id, chat.title, draft, isLocal, onRenamed]);

  const handleRenameKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitRename();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRename();
      }
    },
    [cancelRename, commitRename]
  );

  const handleExportMarkdown = useCallback(() => {
    exportChatById({
      chatId: chat.id,
      fallback: currentExport,
      format: "markdown",
      isLocal,
    }).catch(() => {
      toast.error("导出失败");
    });
  }, [chat.id, currentExport, isLocal]);

  const handleExportJson = useCallback(() => {
    exportChatById({
      chatId: chat.id,
      fallback: currentExport,
      format: "json",
      isLocal,
    }).catch(() => {
      toast.error("导出失败");
    });
  }, [chat.id, currentExport, isLocal]);

  return (
    <SidebarMenuItem>
      {isRenaming ? (
        <input
          aria-label="Rename chat"
          className="h-8 w-full rounded-lg border border-sidebar-border bg-sidebar px-2 text-[13px] text-sidebar-foreground outline-none"
          data-testid="rename-chat-input"
          onBlur={commitRename}
          onChange={handleDraftChange}
          onKeyDown={handleRenameKeyDown}
          ref={inputRef}
          value={draft}
        />
      ) : (
        <SidebarMenuButton
          asChild
          className="h-8 rounded-none text-[13px] text-sidebar-foreground/50 transition-all duration-150 hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:font-normal data-active:text-sidebar-foreground/50 data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:border-b data-[active=true]:border-dashed data-[active=true]:border-sidebar-foreground/50"
          isActive={isActive}
        >
          <Link href={`/chat/${chat.id}`} onClick={closeMobile}>
            <span className="truncate">{chat.title}</span>
          </Link>
        </SidebarMenuButton>
      )}

      {isRenaming ? null : (
        <DropdownMenu modal={true}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              className="mr-0.5 rounded-md text-sidebar-foreground/50 ring-0 transition-colors duration-150 focus-visible:ring-0 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              showOnHover={!isActive}
            >
              <MoreHorizontalIcon />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={handleStartRename}
            >
              <PenLineIcon className="size-3.5" />
              <span>Rename</span>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <DownloadIcon className="size-3.5" />
                <span>Export</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={handleExportMarkdown}
                  >
                    Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={handleExportJson}
                  >
                    JSON
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {isLocal ? null : (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <ShareIcon />
                  <span>Share</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      className="cursor-pointer flex-row justify-between"
                      onClick={handleSetPrivate}
                    >
                      <div className="flex flex-row items-center gap-2">
                        <LockIcon size={12} />
                        <span>Private</span>
                      </div>
                      {visibilityType === "private" ? (
                        <CheckCircleFillIcon />
                      ) : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer flex-row justify-between"
                      onClick={handleSetPublic}
                    >
                      <div className="flex flex-row items-center gap-2">
                        <GlobeIcon />
                        <span>Public</span>
                      </div>
                      {visibilityType === "public" ? (
                        <CheckCircleFillIcon />
                      ) : null}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}

            <DropdownMenuItem onSelect={handleDelete} variant="destructive">
              <TrashIcon />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) {
    return false;
  }
  if (prevProps.isRenaming !== nextProps.isRenaming) {
    return false;
  }
  if (prevProps.chat.title !== nextProps.chat.title) {
    return false;
  }
  if (prevProps.chat.id !== nextProps.chat.id) {
    return false;
  }
  return true;
});
