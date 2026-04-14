import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

// --- DTOs ---
export interface AccountDto {
  accountId: number;
  username: string;
  email: string;
  phone: string | null;
  fullname: string | null;
  role: string;
  status: string; // PENDING, ACTIVE, INACTIVE, DELETED
  createdAt?: string;
}

export interface UpdateAccountStatusRequest {
  status: string;
}

// Interface Wrapper chung
export interface ApiResponse<T> {
  status: number;
  msg: string;
  data: T;
}

export interface ActionMessage {
  message: string;
}

// --- API Service Dành Riêng Cho Admin ---
export const accountAdminService = {
  // 1. Lấy danh sách tài khoản
  getAllAccounts: async (startDate?: string, endDate?: string): Promise<AccountDto[]> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<AccountDto[]>,
        ApiResponse<AccountDto[]>
      >(API_ENDPOINTS.ADMIN_ACCOUNTS.LIST, {
        params: { startDate, endDate }
      });

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return [];
    } catch (error: unknown) {
      console.error("Lỗi khi lấy danh sách tài khoản:", error);
      throw error;
    }
  },

  // 2. Lấy chi tiết tài khoản
  getAccountById: async (id: number): Promise<AccountDto | null> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<AccountDto>,
        ApiResponse<AccountDto>
      >(API_ENDPOINTS.ADMIN_ACCOUNTS.DETAIL(id));

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      console.error(`Lỗi khi lấy chi tiết tài khoản ${id}:`, error);
      throw error;
    }
  },

  // 3. Cập nhật TRẠNG THÁI tài khoản
  updateAccountStatus: async (
    id: number,
    status: string,
  ): Promise<ApiResponse<ActionMessage>> => {
    try {
      const payload: UpdateAccountStatusRequest = { status };
      const response = await axiosClient.put<
        ApiResponse<ActionMessage>,
        ApiResponse<ActionMessage>
      >(API_ENDPOINTS.ADMIN_ACCOUNTS.UPDATE_STATUS(id), payload);
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi cập nhật trạng thái tài khoản ${id}:`, error);
      throw error;
    }
  },

  // 4. Xóa tài khoản
  deleteAccount: async (id: number): Promise<ApiResponse<ActionMessage>> => {
    try {
      const response = await axiosClient.delete<
        ApiResponse<ActionMessage>,
        ApiResponse<ActionMessage>
      >(API_ENDPOINTS.ADMIN_ACCOUNTS.DELETE(id));
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi xóa tài khoản ${id}:`, error);
      throw error;
    }
  },
};
