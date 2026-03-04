import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import {
  chatService,
  getCurrentUserId,
  type ChatConversation,
  type ChatMessage,
} from "@/feature/chat/services/chatService";

const POLL_INTERVAL_MS = 7000;

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
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
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    setError(null);
    try {
      const data = await chatService.getAllConversations();
      setConversations(data);
      if (!selectedConversationId && data.length > 0) {
        setSelectedConversationId(data[0].id);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không tải được danh sách chat.",
      );
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    setIsLoadingMessages(true);
    setError(null);
    try {
      const data = await chatService.getConversationMessages(conversationId);
      setMessages(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không tải được nội dung hội thoại.",
      );
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    const timer = window.setInterval(() => {
      void loadMessages(selectedConversationId);
      void loadConversations();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [selectedConversationId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [sortedMessages, selectedConversationId]);

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
      await loadConversations();
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
            <p className="text-sm font-bold text-tet-primary">
              Danh sách hội thoại
            </p>
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
              sortedConversations.map((conversation) => (
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
                  <p className="text-sm font-bold text-tet-primary">
                    Conversation #{conversation.id}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    User ID: {conversation.userId}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {formatDateTime(conversation.lastMessageAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <p className="text-sm font-bold text-tet-primary">
              {selectedConversation
                ? `Hội thoại #${selectedConversation.id} - User ${selectedConversation.userId}`
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
                    currentUserId !== null
                      ? message.senderId === currentUserId
                      : message.senderId !== selectedConversation?.userId;
                  return (
                    <div
                      key={message.id}
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
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? "text-white/80" : "text-gray-500"
                          }`}
                        >
                          {formatDateTime(message.createdAt)}
                        </p>
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
    </div>
  );
}
