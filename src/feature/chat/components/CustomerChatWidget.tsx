import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import {
  chatService,
  getCurrentUserId,
  type ChatConversation,
  type ChatMessage,
} from "@/feature/chat/services/chatService";

const POLL_INTERVAL_MS = 7000;

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const isAdmin = role === "ADMIN" || role === "STAFF";
  const pathname = window.location.pathname;
  const shouldRender =
    Boolean(token) &&
    !isAdmin &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/register");

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
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

    loadConversation();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;
    if (!conversation?.id) return;

    const timer = window.setInterval(async () => {
      try {
        const data = await chatService.getMyConversationMessages(conversation.id);
        setMessages(data);
      } catch {
        // silent polling error
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [conversation?.id, shouldRender]);

  useEffect(() => {
    if (!isOpen) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sortedMessages, isOpen]);

  const handleSend = async () => {
    const trimmed = messageInput.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    try {
      const sentMessage = await chatService.sendMessageAsUser({
        content: trimmed,
      });
      setMessageInput("");

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

  return (
    <div className="fixed bottom-28 right-10 z-[200] max-md:bottom-24 max-md:right-6">
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
                  const isMine =
                    currentUserId !== null
                      ? message.senderId === currentUserId
                      : message.senderId === conversation?.userId;

                  return (
                    <div
                      key={message.id}
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
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? "text-white/80" : "text-gray-500"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
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
            <div className="flex items-center gap-2">
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
                className="flex-1 h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-tet-primary"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending}
                className="h-10 w-10 rounded-lg bg-tet-primary text-white flex items-center justify-center disabled:opacity-60"
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
          className="w-14 h-14 rounded-full bg-tet-primary text-white shadow-xl flex items-center justify-center hover:bg-tet-accent transition-colors"
          aria-label="Mở chat hỗ trợ"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
