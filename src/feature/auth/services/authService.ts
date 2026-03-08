import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

// Định nghĩa Interface để đảm bảo Type Safety cho dự án Happybox
export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterRequestPayload {
  username: string;
  password: string;
  email: string;
  fullname: string;
  phone: string;
}

export interface VerifyOtpPayload {
  username: string;
  otp: string;
}

// --- CẬP NHẬT: THÊM USERNAME ĐỂ ĐỊNH DANH DUY NHẤT ---

export interface ForgotPasswordPayload {
  email: string;
  username?: string; // Thêm username để phân biệt các account dùng chung email
}

export interface ResetPasswordPayload {
  email: string;
  username: string; // Thêm username để Backend cập nhật đúng bản ghi
  otp: string;
  newPassword: string;
}

const authService = {
  // 1. Đăng nhập
  login: async (payload: LoginPayload) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);
  },

  // 2. Bước 1 Đăng ký: Gửi đầy đủ thông tin để tạo tài khoản chờ & nhận OTP
  requestOtp: async (payload: RegisterRequestPayload) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.REGISTER_REQUEST_OTP, payload);
  },

  // 3. Bước 2 Đăng ký: Xác nhận mã OTP để kích hoạt tài khoản
  verifyOtp: async (payload: VerifyOtpPayload) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.REGISTER_VERIFY_OTP, payload);
  },

  // 4. Yêu cầu mã OTP quên mật khẩu (Cần Email + Username)
  requestForgotPasswordOtp: async (payload: ForgotPasswordPayload) => {
    return axiosClient.post(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD_REQUEST_OTP,
      payload,
    );
  },

  // 5. Xác nhận OTP và đặt lại mật khẩu mới (Cần khớp cả tổ hợp thông tin)
  resetPassword: async (payload: ResetPasswordPayload) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET, payload);
  },
};

export default authService;
