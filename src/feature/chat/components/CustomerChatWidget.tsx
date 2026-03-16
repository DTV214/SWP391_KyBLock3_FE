import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCheck, Link2, MessageCircle, Send, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  chatService,
  getCurrentUserId,
  type ChatConversation,
  type ChatMessage,
} from "@/feature/chat/services/chatService";
import { chatRealtimeService } from "@/feature/chat/services/chatRealtime";
import ChatOrderCard from "@/feature/chat/components/ChatOrderCard";
import { orderService, type OrderResponse } from "@/feature/checkout/services/orderService";

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

export default function CustomerChatWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myOrders, setMyOrders] = useState<OrderResponse[]>([]);
  const [orderMap, setOrderMap] = useState<Record<number, OrderResponse>>({});
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const isAdmin = role === "ADMIN" || role === "STAFF";
  const shouldRender =
    Boolean(token) &&
    !isAdmin &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/login") &&
    !location.pathname.startsWith("/register");

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  const isMessageMine = (message: ChatMessage): boolean => {
    if (currentUserId !== null) {
      return message.senderId === currentUserId;
    }
    return message.senderId === conversation?.userId;
  };

  const unreadCount = useMemo(
    () =>
      sortedMessages.filter(
        (message) => !isMessageMine(message) && !message.isRead,
      ).length,
    [sortedMessages, currentUserId, conversation?.userId],
  );

  useEffect(() => {
    if (!shouldRender) return;

    const loadConversation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const conv = await chatService.getMyConversation();
        setConversation(conv);
        if (conv?.id) {
          const data = await chatService.getMyConversationMessages(conv.id);
          setMessages(data);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Không tải được dữ liệu chat.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    const loadOrders = async () => {
      try {
        const orders = await orderService.getMyOrders();
        setMyOrders(orders);
        setOrderMap(
          Object.fromEntries(orders.map((order) => [order.orderId, order])),
        );
      } catch {
        // silent order-loading error
      }
    };

    void loadConversation();
    void loadOrders();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;
    if (!conversation?.id) return;

    const joinRealtimeTargets = async () => {
      const userId = getCurrentUserId();

      await chatRealtimeService.invokeFirstSuccessful(
        [
          "JoinConversation",
          "JoinConversationGroup",
          "JoinChatConversation",
          "JoinChatRoom",
          "JoinRoom",
        ],
        conversation.id,
      );

      if (userId) {
        await chatRealtimeService.invokeFirstSuccessful(
          [
            "JoinUserGroup",
            "JoinCustomerGroup",
            "JoinAccountGroup",
            "JoinPersonalGroup",
            "JoinUserRoom",
          ],
          userId,
        );
      }
    };

    void joinRealtimeTargets();
  }, [shouldRender, conversation?.id]);

  useEffect(() => {
    if (!shouldRender) return;

    const unsubscribeConnection = chatRealtimeService.subscribeConnection(
      () => undefined,
    );

    return unsubscribeConnection;
  }, [shouldRender]);

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

  useEffect(() => {
    if (!shouldRender) return;

    const unsubscribeRealtime = chatRealtimeService.subscribe(() => {
      const loadLatestConversation = async () => {
        try {
          const conv = await chatService.getMyConversation();
          setConversation(conv);

          if (conv?.id) {
            const data = await chatService.getMyConversationMessages(conv.id);
            setMessages(data);
          }
        } catch {
          // silent realtime sync error
        }
      };

      void loadLatestConversation();
    });

    return unsubscribeRealtime;
  }, [shouldRender]);

  useEffect(() => {
    if (!isOpen) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sortedMessages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!conversation?.id) return;
    if (unreadCount === 0) return;

    const markAsRead = async () => {
      try {
        await chatService.markConversationRead(conversation.id);
        setMessages((prev) =>
          prev.map((message) =>
            isMessageMine(message) ? message : { ...message, isRead: true },
          ),
        );
      } catch {
        // silent read-update error
      }
    };

    void markAsRead();
  }, [isOpen, conversation?.id, unreadCount, currentUserId, conversation?.userId]);

  const handleSend = async () => {
    const trimmed = messageInput.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    try {
      const attachedSelectedOrder =
        selectedOrderId !== null
          ? myOrders.find((order) => order.orderId === selectedOrderId) ?? null
          : null;

      const sentMessage = await chatService.sendMessageAsUser({
        orderId: selectedOrderId ?? undefined,
        content: trimmed,
      });

      if (attachedSelectedOrder) {
        setOrderMap((prev) => ({
          ...prev,
          [attachedSelectedOrder.orderId]: attachedSelectedOrder,
        }));
      }

      setMessageInput("");
      setSelectedOrderId(null);
      setShowOrderPicker(false);

      if (!conversation) {
        const conv = await chatService.getMyConversation();
        setConversation(conv);
      }

      setMessages((prev) => [...prev, sentMessage]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gửi tin nhắn thất bại. Thử lại.",
      );
    } finally {
      setSending(false);
    }
  };

  if (!shouldRender) return null;

  const selectedOrder =
    selectedOrderId !== null
      ? myOrders.find((order) => order.orderId === selectedOrderId) ?? null
      : null;

  return (
    <div className="fixed bottom-28 right-24 z-[200] max-md:bottom-24 max-md:right-20">
      {isOpen ? (
        <div className="w-[90vw] max-w-[360px] h-[520px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-tet-primary text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Hỗ trợ khách hàng</p>
              <p className="text-[11px] opacity-90">Trò chuyện cùng staff</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-[#fffaf0]">
            {isLoading ? (
              <p className="text-sm text-gray-500">Đang tải hội thoại...</p>
            ) : sortedMessages.length === 0 ? (
              <p className="text-sm text-gray-500">
                Chưa có tin nhắn nào. Hãy gửi lời nhắn đầu tiên.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedMessages.map((message) => {
                  const isMine = isMessageMine(message);
                  const attachedOrder = message.orderId
                    ? orderMap[message.orderId] ??
                      myOrders.find((order) => order.orderId === message.orderId)
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
                          className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                            isMine
                              ? "bg-tet-primary text-white"
                              : "bg-white border border-gray-200 text-gray-800"
                          }`}
                        >
                          {message.orderId && (
                            <div className="mb-2 min-w-[220px]">
                              <ChatOrderCard
                                orderId={message.orderId}
                                order={attachedOrder}
                                compact
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
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-white">
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            {selectedOrder && (
              <div className="mb-3">
                <div className="rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] p-2">
                  <div className="mb-2 flex items-center justify-between gap-2 px-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a06b56]">
                      Đã gắn đơn hàng
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(null)}
                      className="rounded-full p-1 text-gray-500 transition-colors hover:bg-white hover:text-red-500"
                      aria-label="Bỏ đơn hàng"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <ChatOrderCard
                    orderId={selectedOrder.orderId}
                    order={selectedOrder}
                    compact
                  />
                </div>
              </div>
            )}

            <div className="relative flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => setShowOrderPicker((prev) => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                  showOrderPicker || selectedOrderId !== null
                    ? "border-[#d77a45] bg-[#fff2e8] text-[#7a160e]"
                    : "border-[#f1e1d6] bg-[#fffaf5] text-[#7a160e] hover:bg-[#fff2e8]"
                }`}
                aria-label="Gan don hang"
                title={selectedOrderId ? `Đã bind #${selectedOrderId}` : "Gắn đơn hàng"}
              >
                <Link2 size={15} />
              </button>

              {showOrderPicker && (
                <div className="absolute bottom-12 left-0 z-20 w-[290px] overflow-hidden rounded-2xl border border-[#f1e1d6] bg-white shadow-xl">
                  <div className="border-b border-[#f6e9dc] bg-[#fffaf5] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a06b56]">
                      Chọn đơn hàng
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Chọn một đơn hàng để gắn vào tin nhắn.
                    </p>
                  </div>

                  <div className="max-h-72 space-y-2 overflow-y-auto p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderId(null);
                        setShowOrderPicker(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                        selectedOrderId === null
                          ? "bg-[#fff2e8] text-[#7a160e]"
                          : "text-gray-600 hover:bg-[#fffaf5]"
                      }`}
                    >
                      Không gắn đơn hàng
                    </button>

                    {myOrders.length > 0 ? (
                      myOrders.map((order) => (
                        <button
                          key={order.orderId}
                          type="button"
                          onClick={() => {
                            setSelectedOrderId(order.orderId);
                            setShowOrderPicker(false);
                          }}
                          className={`w-full rounded-xl p-0 text-left transition-all ${
                            selectedOrderId === order.orderId
                              ? "ring-2 ring-[#d77a45]"
                              : ""
                          }`}
                        >
                          <ChatOrderCard
                            orderId={order.orderId}
                            order={order}
                            compact
                          />
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-gray-500">
                        Chưa có đơn hàng
                      </p>
                    )}
                  </div>
                </div>
              )}

              <input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Nhập nội dung..."
                className="h-10 flex-1 rounded-2xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-tet-primary"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending}
                className="h-10 w-12 rounded-2xl bg-tet-primary text-white flex items-center justify-center disabled:opacity-60"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-full bg-tet-primary text-white shadow-xl flex items-center justify-center hover:bg-tet-accent transition-colors"
          aria-label="Mở chat hỗ trợ"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
