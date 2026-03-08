import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "./apiConfig";

export interface ChatMessage {
  message: string;
  history: any[];
}

export interface ChatResponse {
  status: number;
  msg: string;
  data: {
    reply: string;
  };
}

export const chatService = {
  /**
   * Send a message to the AI chatbot
   * @param message - User's message
   * @returns AI's response
   */
  sendMessage: async (message: string): Promise<string> => {
    try {
      const requestBody: ChatMessage = {
        message: message,
        history: [],
      };

      // axiosClient already returns response.data via interceptor
      // So response is directly {status, msg, data: {reply: "..."}}
      const response = await axiosClient.post<ChatResponse>(
        API_ENDPOINTS.AI_CHAT.SEND,
        requestBody
      ) as unknown as ChatResponse;
      
      console.log("AI Chat API Response:", response);
      
      // API returns: {status, msg, data: {reply: "..."}}
      if (response.data?.reply) {
        return response.data.reply;
      }
      
      // Fallback
      return "Không nhận được phản hồi từ AI";
    } catch (error) {
      console.error("AI Chat API Error:", error);
      throw new Error("Không thể kết nối với chatbot AI. Vui lòng thử lại sau.");
    }
  },
};
