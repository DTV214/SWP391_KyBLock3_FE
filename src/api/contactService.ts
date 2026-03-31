import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

// --- DTOs ---
export interface ContactDto {
  id: number;
  customerName: string;
  phone: string;
  email: string;
  note: string | null;
  isContacted: boolean;
  createdAt: string;
}

export interface CreateContactRequest {
  customerName: string;
  phone: string;
  email: string;
  note?: string;
}

export interface UpdateContactRequest {
  customerName: string;
  phone: string;
  email: string;
  note?: string;
  isContacted: boolean;
}

export interface ApiResponse<T> {
  status: number;
  msg: string;
  data: T;
}

export interface ActionMessage {
  message: string;
}

// --- API Service ---
export const contactService = {
  // PUBLIC: Khách hàng gửi yêu cầu
  submitContact: async (
    data: CreateContactRequest,
  ): Promise<ApiResponse<ActionMessage>> => {
    try {
      const response = await axiosClient.post<
        ApiResponse<ActionMessage>,
        ApiResponse<ActionMessage>
      >(API_ENDPOINTS.CONTACTS.PUBLIC_CREATE, data);
      return response;
    } catch (error: unknown) {
      console.error("Lỗi khi gửi yêu cầu liên hệ:", error);
      throw error;
    }
  },

  // ADMIN: Lấy danh sách
  getAllContacts: async (): Promise<ContactDto[]> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<ContactDto[]>,
        ApiResponse<ContactDto[]>
      >(API_ENDPOINTS.CONTACTS.ADMIN_LIST);

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return [];
    } catch (error: unknown) {
      console.error("Lỗi khi lấy danh sách liên hệ:", error);
      throw error;
    }
  },

  // ADMIN: Cập nhật yêu cầu
  updateContact: async (
    id: number,
    data: UpdateContactRequest,
  ): Promise<ApiResponse<ActionMessage>> => {
    try {
      const response = await axiosClient.put<
        ApiResponse<ActionMessage>,
        ApiResponse<ActionMessage>
      >(API_ENDPOINTS.CONTACTS.ADMIN_UPDATE(id), data);
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi cập nhật liên hệ ${id}:`, error);
      throw error;
    }
  },

  // ADMIN: Xóa yêu cầu
  deleteContact: async (id: number): Promise<ApiResponse<ActionMessage>> => {
    try {
      const response = await axiosClient.delete<
        ApiResponse<ActionMessage>,
        ApiResponse<ActionMessage>
      >(API_ENDPOINTS.CONTACTS.ADMIN_DELETE(id));
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi xóa liên hệ ${id}:`, error);
      throw error;
    }
  },
};
