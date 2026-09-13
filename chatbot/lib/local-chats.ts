import type { Chat } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";

export const LOCAL_DB_NAME = "llama-local";
export const LOCAL_CHATS_STORE = "chats";
export const LOCAL_HISTORY_SWR_KEY = "llama-local-history";

const DB_VERSION = 1;

export type LocalChatRecord = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  visibility: "private";
  messages: ChatMessage[];
};

function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LOCAL_CHATS_STORE)) {
        db.createObjectStore(LOCAL_CHATS_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open local chat database"));
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed"));
    };
  });
}

export function localChatToChat(record: LocalChatRecord): Chat {
  return {
    createdAt: new Date(record.createdAt),
    id: record.id,
    title: record.title,
    userId: "local",
    visibility: "private",
  };
}

export async function listLocalChats(): Promise<LocalChatRecord[]> {
  const db = await openLocalDb();

  try {
    const records = await requestToPromise(
      db
        .transaction(LOCAL_CHATS_STORE, "readonly")
        .objectStore(LOCAL_CHATS_STORE)
        .getAll()
    );

    return records.sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  } finally {
    db.close();
  }
}

export async function getLocalChat(
  id: string
): Promise<LocalChatRecord | undefined> {
  const db = await openLocalDb();

  try {
    return await requestToPromise(
      db
        .transaction(LOCAL_CHATS_STORE, "readonly")
        .objectStore(LOCAL_CHATS_STORE)
        .get(id)
    );
  } finally {
    db.close();
  }
}

export async function upsertLocalChat({
  id,
  messages,
  title,
}: {
  id: string;
  messages: ChatMessage[];
  title?: string;
}): Promise<LocalChatRecord> {
  const db = await openLocalDb();

  try {
    const store = db
      .transaction(LOCAL_CHATS_STORE, "readwrite")
      .objectStore(LOCAL_CHATS_STORE);
    const existing = await requestToPromise<LocalChatRecord | undefined>(
      store.get(id)
    );
    const now = new Date().toISOString();
    const next: LocalChatRecord = {
      createdAt: existing?.createdAt ?? now,
      id,
      messages,
      title: title ?? existing?.title ?? "New chat",
      updatedAt: now,
      visibility: "private",
    };

    await requestToPromise(store.put(next));
    return next;
  } finally {
    db.close();
  }
}

export async function renameLocalChat(id: string, title: string) {
  const existing = await getLocalChat(id);

  if (!existing) {
    return;
  }

  await upsertLocalChat({
    id,
    messages: existing.messages,
    title,
  });
}

export async function deleteLocalChat(id: string) {
  const db = await openLocalDb();

  try {
    await requestToPromise(
      db
        .transaction(LOCAL_CHATS_STORE, "readwrite")
        .objectStore(LOCAL_CHATS_STORE)
        .delete(id)
    );
  } finally {
    db.close();
  }
}

export async function deleteAllLocalChats() {
  const db = await openLocalDb();

  try {
    await requestToPromise(
      db
        .transaction(LOCAL_CHATS_STORE, "readwrite")
        .objectStore(LOCAL_CHATS_STORE)
        .clear()
    );
  } finally {
    db.close();
  }
}
