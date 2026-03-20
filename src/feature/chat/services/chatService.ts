import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

export interface ApiResponse<T> {
  status: number;
  msg: string;
  data: T;
}

export interface ChatConversation {
  id: number;
  userId: number;
  createdAt: string;
  lastMessageAt: string;
  user: unknown | null;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  orderId: number | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendChatMessagePayload {
  orderId?: number;
  content: string;
}

const getMyConversation = async (): Promise<ChatConversation> => {
  const response = (await axiosClient.get(
    API_ENDPOINTS.CHAT.USER_CONVERSATION,
  )) as ApiResponse<ChatConversation>;
  return response.data;
};

const getMyConversationMessages = async (
  conversationId: number,
): Promise<ChatMessage[]> => {
  const response = (await axiosClient.get(
    API_ENDPOINTS.CHAT.USER_MESSAGES(conversationId),
  )) as ApiResponse<ChatMessage[]>;
  return response.data;
};

const sendMessageAsUser = async (
  payload: SendChatMessagePayload,
): Promise<ChatMessage> => {
  const response = (await axiosClient.post(
    API_ENDPOINTS.CHAT.USER_SEND,
    payload,
  )) as ApiResponse<ChatMessage>;
  return response.data;
};

const getAllConversations = async (): Promise<ChatConversation[]> => {
  const response = (await axiosClient.get(
    API_ENDPOINTS.CHAT.ADMIN_ALL_CONVERSATIONS,
  )) as ApiResponse<ChatConversation[]>;
  return response.data;
};

const getConversationMessages = async (
  conversationId: number,
): Promise<ChatMessage[]> => {
  const response = (await axiosClient.get(
    API_ENDPOINTS.CHAT.ADMIN_MESSAGES(conversationId),
  )) as ApiResponse<ChatMessage[]>;
  return response.data;
};

const replyToConversation = async (
  conversationId: number,
  payload: SendChatMessagePayload,
): Promise<ChatMessage> => {
  const response = (await axiosClient.post(
    API_ENDPOINTS.CHAT.ADMIN_REPLY(conversationId),
    payload,
  )) as ApiResponse<ChatMessage>;
  return response.data;
};

const markConversationRead = async (conversationId: number): Promise<void> => {
  await axiosClient.put(API_ENDPOINTS.CHAT.READ(conversationId));
};

const getUnreadConversationCount = async (): Promise<number> => {
  const conversations = await getAllConversations();

  const embeddedUnreadCount = conversations.filter((conversation) =>
    (conversation.messages ?? []).some(
      (message) => !message.isRead && message.senderId === conversation.userId,
    ),
  ).length;

  const hasEmbeddedMessages = conversations.some(
    (conversation) => (conversation.messages ?? []).length > 0,
  );

  if (hasEmbeddedMessages) {
    return embeddedUnreadCount;
  }

  const unreadByConversation = await Promise.all(
    conversations.map(async (conversation) => {
      try {
        const messages = await getConversationMessages(conversation.id);
        return messages.some(
          (message) => !message.isRead && message.senderId === conversation.userId,
        );
      } catch {
        return false;
      }
    }),
  );

  return unreadByConversation.filter(Boolean).length;
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const getCurrentUserId = (): number | null => {
  const userRaw = localStorage.getItem("user");
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw) as Record<string, unknown>;
      const localId =
        user.accountId ?? user.id ?? user.userId ?? user.sub ?? user.nameid;
      const parsedLocalId = Number(localId);
      if (!Number.isNaN(parsedLocalId) && parsedLocalId > 0) {
        return parsedLocalId;
      }
    } catch {
      // ignore invalid localStorage value
    }
  }

  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const claimCandidates = [
    payload.sub,
    payload.nameid,
    payload.userId,
    payload.accountId,
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ],
  ];

  for (const claim of claimCandidates) {
    const parsed = Number(claim);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

export const chatService = {
  getMyConversation,
  getMyConversationMessages,
  sendMessageAsUser,
  getAllConversations,
  getConversationMessages,
  replyToConversation,
  markConversationRead,
  getUnreadConversationCount,
};

