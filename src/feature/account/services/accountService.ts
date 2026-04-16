import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

// 1. Định nghĩa cấu trúc dữ liệu Profile trả về từ Server
export interface ProfileData {
  accountId: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  address: string | null;
  role: string;
  status: string;
  // ĐÃ XÓA: walletBalance
}

// 2. Interface cho Response chuẩn của Happybox
export interface ProfileResponse {
  status: number;
  msg: string;
  data: ProfileData;
}

// 3. Payload dùng cho việc cập nhật (PUT)
export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
  address: string;
}

const accountService = {
  getProfile: async (): Promise<ProfileResponse> => {
    return axiosClient.get(API_ENDPOINTS.USER.PROFILE);
  },
  updateProfile: async (
    payload: UpdateProfilePayload,
  ): Promise<{ status: number; msg: string }> => {
    return axiosClient.put(API_ENDPOINTS.USER.PROFILE, payload);
  },
  deleteProfile: async (): Promise<{ status: number; msg: string }> => {
    return axiosClient.delete(API_ENDPOINTS.USER.PROFILE);
  },
};

export default accountService;
