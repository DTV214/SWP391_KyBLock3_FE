import axios from "axios";

const CHAT_API_URL = "https://localhost:7056/api/Chat";

export interface ChatMessage {
  message: string;
  history: any[];
}

export interface ChatResponse {
  reply: string;
  // Add other fields from API response if needed
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
        history: [],
        message: message,
      };

      const response = await axios.post(CHAT_API_URL, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
        // For HTTPS localhost with self-signed certificate
      });
      
      console.log("Chat API Response:", response.data);
      
      // API returns: {status, msg, data: {reply: "..."}}
      if (response.data?.data?.reply) {
        return response.data.data.reply;
      }
      
      // Fallback
      return "Không nhận được phản hồi từ AI";
    } catch (error) {
      console.error("Chat API Error:", error);
      throw new Error("Không thể kết nối với chatbot AI");
    }
  },
};
