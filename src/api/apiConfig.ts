// URL cơ sở của Backend .NET 8
// src/api/apiConfig.ts

// Ưu tiên cấu hình qua biến môi trường Vite:
// - VITE_API_BASE_URL=http://localhost:5280/api
// - VITE_API_BASE_URL=http://14.225.207.221:5000/api
const ENV_BASE_URL = (import.meta as any).env
  ?.VITE_API_BASE_URL as string | undefined;

// Fallback về server hiện tại nếu không set env
const BASE_URL = (
  ENV_BASE_URL?.trim() || "http://14.225.207.221:5000/api"
).replace(/\/+$/, "");
// const BASE_URL = (ENV_BASE_URL?.trim() || "http://localhost:5280/api").replace(/\/+$/, "");

// Điều này giúp bạn chỉ cần đổi file .env khi chạy local / deploy.
export const API_ENDPOINTS = {
  AUTH: {
    // Khớp chính xác với Swagger trong ảnh bạn cung cấp
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER_REQUEST_OTP: `${BASE_URL}/auth/register/request-otp`,
    REGISTER_VERIFY_OTP: `${BASE_URL}/auth/register/verify-otp`,
  },
  // Các endpoint khác cho Happybox sau này
  PRODUCTS: {
    LIST: `${BASE_URL}/products`,
    DETAIL: (id: string | number) => `${BASE_URL}/products/${id}`,
  },
  USER: {
    PROFILE: `${BASE_URL}/account/profile`,
  },
};

export default BASE_URL;
