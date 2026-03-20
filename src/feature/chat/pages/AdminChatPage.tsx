import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCheck, Loader2, MessageSquare, Send } from "lucide-react";
import {
  chatService,
  type ChatConversation,
  type ChatMessage,
} from "@/feature/chat/services/chatService";
import { chatRealtimeService } from "@/feature/chat/services/chatRealtime";
import { accountAdminService } from "@/api/accountAdminService";
import ChatOrderCard from "@/feature/chat/components/ChatOrderCard";
import ChatOrderPreviewModal from "@/feature/chat/components/ChatOrderPreviewModal";
import { orderService, type OrderResponse } from "@/feature/checkout/services/orderService";

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatMessageDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const renderMessageStatus = (isRead: boolean) =>
  isRead ? <CheckCheck size={12} /> : <Check size={12} />;

const JOIN_CONVERSATION_METHODS = [
  "JoinConversation",
  "JoinConversationGroup",
  "JoinChatConversation",
  "JoinChatRoom",
  "JoinRoom",
];

const LEAVE_CONVERSATION_METHODS = [
  "LeaveConversation",
  "LeaveConversationGroup",
  "LeaveChatConversation",
  "LeaveChatRoom",
  "LeaveRoom",
];

type LoadOptions = {
  silent?: boolean;
};

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  const [userNameMap, setUserNameMap] = useState<Record<number, string>>({});
  const [allOrders, setAllOrders] = useState<OrderResponse[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [orderMap, setOrderMap] = useState<Record<number, OrderResponse>>({});
  const [previewOrderId, setPreviewOrderId] = useState<number | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      ),
    [conversations],
  );

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  const selectedConversation = useMemo(
    () =>
      conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const previewOrder =
    previewOrderId !== null ? orderMap[previewOrderId] ?? null : null;

  const getUnreadCount = (conversation: ChatConversation): number =>
    unreadMap[conversation.id] ?? 0;

  const getDisplayName = (userId: number): string =>
    userNameMap[userId] || `User ${userId}`;

  const loadConversations = async (options?: LoadOptions) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setIsLoadingConversations(true);
      setError(null);
    }
    try {
      const data = await chatService.getAllConversations();

      const unreadEntries = await Promise.all(
        data.map(async (conversation) => {
          try {
            const conversationMessages =
              conversation.messages && conversation.messages.length > 0
                ? conversation.messages
                : await chatService.getConversationMessages(conversation.id);
            const unreadCount = conversationMessages.filter(
              (message) =>
                !message.isRead && message.senderId === conversation.userId,
            ).length;
            return [conversation.id, unreadCount] as const;
          } catch {
            return [conversation.id, 0] as const;
          }
        }),
      );

      const nameEntries = await Promise.all(
        data.map(async (conversation) => {
          try {
            const account = await accountAdminService.getAccountById(
              conversation.userId,
            );
            const displayName =
              account?.fullname?.trim() ||
              account?.username?.trim() ||
              `User ${conversation.userId}`;
            return [conversation.userId, displayName] as const;
          } catch {
            return [conversation.userId, `User ${conversation.userId}`] as const;
          }
        }),
      );

      setUnreadMap(Object.fromEntries(unreadEntries));
      setUserNameMap(Object.fromEntries(nameEntries));
      setConversations(data);

      if (!selectedConversationId && data.length > 0) {
        setSelectedConversationId(data[0].id);
      }
    } catch (err: unknown) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : "Không tải được danh sách chat.",
        );
      }
    } finally {
      if (!silent) {
        setIsLoadingConversations(false);
      }
    }
  };

  const loadMessages = async (conversationId: number, options?: LoadOptions) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setIsLoadingMessages(true);
      setError(null);
    }
    try {
      const data = await chatService.getConversationMessages(conversationId);
      setMessages(data);
    } catch (err: unknown) {
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "Không tải được nội dung hội thoại.",
        );
      }
    } finally {
      if (!silent) {
        setIsLoadingMessages(false);
      }
    }
  };

  const markAsRead = async (conversationId: number) => {
    try {
      await chatService.markConversationRead(conversationId);
    } catch {
      // silent read-update error
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem("token") || undefined;
        const orders = await orderService.getAllOrders(token);
        setAllOrders(orders);
        setOrderMap(
          Object.fromEntries(orders.map((order) => [order.orderId, order])),
        );
      } catch {
        // silent order-loading error
      }
    };

    void loadOrders();
  }, []);

  useEffect(() => {
    const unsubscribeConnection = chatRealtimeService.subscribeConnection(
      () => undefined,
    );

    return unsubscribeConnection;
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    const syncConversation = async () => {
      await loadMessages(selectedConversationId);
      await markAsRead(selectedConversationId);
      await loadConversations();
    };
    void syncConversation();
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;

    const groupKey = `conversation:${selectedConversationId}`;

    const joinConversation = async () => {
      await chatRealtimeService.joinGroup(
        groupKey,
        JOIN_CONVERSATION_METHODS,
        selectedConversationId,
      );
    };

    void joinConversation();

    return () => {
      void chatRealtimeService.leaveGroup(
        groupKey,
        LEAVE_CONVERSATION_METHODS,
        selectedConversationId,
      );
    };
  }, [selectedConversationId]);

  useEffect(() => {
    const unsubscribeRealtime = chatRealtimeService.subscribe(() => {
      void loadConversations({ silent: true });

      if (selectedConversationId) {
        void loadMessages(selectedConversationId, { silent: true });
        void markAsRead(selectedConversationId);
      }
    });

    return unsubscribeRealtime;
  }, [selectedConversationId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [sortedMessages, selectedConversationId]);

  useEffect(() => {
    const missingOrderIds = sortedMessages
      .map((message) => message.orderId)
      .filter(
        (orderId): orderId is number =>
          typeof orderId === "number" && !orderMap[orderId],
      );

    if (missingOrderIds.length === 0) return;

    const uniqueOrderIds = [...new Set(missingOrderIds)];

    const loadMissingOrders = async () => {
      const token = localStorage.getItem("token") || undefined;
      const entries = await Promise.all(
        uniqueOrderIds.map(async (orderId) => {
          try {
            const order = await orderService.getOrderById(orderId, token);
            return [orderId, order] as const;
          } catch {
            return null;
          }
        }),
      );

      setOrderMap((prev) => {
        const next = { ...prev };
        for (const entry of entries) {
          if (entry) {
            next[entry[0]] = entry[1];
          }
        }
        return next;
      });
    };

    void loadMissingOrders();
  }, [sortedMessages, orderMap]);

  const handleSendReply = async () => {
    const trimmed = messageInput.trim();
    if (!trimmed || !selectedConversationId || sending) return;

    setSending(true);
    setError(null);
    try {
      const sent = await chatService.replyToConversation(selectedConversationId, {
        content: trimmed,
      });
      setMessageInput("");
      setMessages((prev) => [...prev, sent]);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === selectedConversationId
            ? { ...conversation, lastMessageAt: sent.createdAt }
            : conversation,
        ),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gửi phản hồi thất bại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-[calc(100vh-180px)] max-h-[780px] min-h-[620px] flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-tet-primary">Chat khách hàng</h2>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi và phản hồi hội thoại của khách hàng theo thời gian thực.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] flex-1 min-h-0">
        <aside className="border-r border-gray-100 bg-[#fffaf0] flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-bold text-tet-primary">Danh sách hội thoại</p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải...
              </div>
            ) : sortedConversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Chưa có hội thoại nào.</p>
            ) : (
              sortedConversations.map((conversation) => {
                const unreadCount = getUnreadCount(conversation);
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                      selectedConversationId === conversation.id
                        ? "bg-tet-secondary/60"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-tet-primary">
                        Conversation #{conversation.id}
                      </p>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getDisplayName(conversation.userId)} (ID: {conversation.userId})
                    </p>
                    {unreadCount > 0 && (
                      <p className="text-[11px] mt-1 text-red-600 font-semibold">
                        Tin nhắn mới
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatDateTime(conversation.lastMessageAt)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <p className="text-sm font-bold text-tet-primary">
              {selectedConversation
                ? `Hội thoại #${selectedConversation.id} - ${getDisplayName(
                    selectedConversation.userId,
                  )}`
                : "Chọn một hội thoại để xem chi tiết"}
            </p>
          </div>

          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 bg-[#fffcf7] p-4 overflow-y-auto"
          >
            {isLoadingMessages ? (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải tin nhắn...
              </div>
            ) : !selectedConversationId ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <MessageSquare size={36} />
                <p className="mt-3 text-sm">Chọn hội thoại để bắt đầu phản hồi.</p>
              </div>
            ) : sortedMessages.length === 0 ? (
              <p className="text-sm text-gray-500">Hội thoại chưa có tin nhắn.</p>
            ) : (
              <div className="space-y-2">
                {sortedMessages.map((message) => {
                  const isMine =
                    message.senderId !== selectedConversation?.userId;
                  const attachedOrder = message.orderId
                    ? orderMap[message.orderId] ??
                      allOrders.find((order) => order.orderId === message.orderId)
                    : undefined;
                  const previousMessage =
                    sortedMessages[sortedMessages.indexOf(message) - 1];
                  const showDateDivider =
                    !previousMessage ||
                    formatMessageDate(previousMessage.createdAt) !==
                      formatMessageDate(message.createdAt);
                  return (
                    <div key={message.id}>
                      {showDateDivider && (
                        <div className="my-3 flex items-center gap-3">
                          <div className="h-px flex-1 bg-[#ead6c9]" />
                          <span className="text-[11px] font-semibold text-[#a06b56]">
                            {formatMessageDate(message.createdAt)}
                          </span>
                          <div className="h-px flex-1 bg-[#ead6c9]" />
                        </div>
                      )}
                      <div
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                            isMine
                              ? "bg-tet-primary text-white"
                              : "bg-white border border-gray-200 text-gray-800"
                          }`}
                        >
                          {message.orderId && (
                            <div className="mb-2 min-w-[260px]">
                              <ChatOrderCard
                                orderId={message.orderId}
                                order={attachedOrder}
                                compact
                                clickable
                                onClick={() => setPreviewOrderId(message.orderId)}
                              />
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <div
                            className={`mt-1 flex items-center gap-1 text-[10px] ${
                              isMine
                                ? "justify-end text-white/80"
                                : "justify-end text-gray-500"
                            }`}
                          >
                            <span>{formatTime(message.createdAt)}</span>
                            {renderMessageStatus(message.isRead)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-white">
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="flex items-center gap-2">
              <input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSendReply();
                  }
                }}
                disabled={!selectedConversationId}
                className="flex-1 h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-tet-primary disabled:bg-gray-50"
                placeholder="Nhập phản hồi cho khách hàng..."
              />
              <button
                type="button"
                onClick={() => void handleSendReply()}
                disabled={!selectedConversationId || sending}
                className="h-10 px-4 rounded-lg bg-tet-primary text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2"
              >
                <Send size={14} />
                Gửi
              </button>
            </div>
          </div>
        </section>
      </div>

      <ChatOrderPreviewModal
        isOpen={previewOrderId !== null}
        orderId={previewOrderId}
        order={previewOrder}
        onClose={() => setPreviewOrderId(null)}
      />
    </div>
  );
}
