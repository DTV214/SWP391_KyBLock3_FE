import axios from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

// 1. Khởi tạo instance chính (có redirect khi 401)
const axiosClient = axios.create({
  // Bạn có thể dùng BASE_URL từ apiConfig ở đây nếu muốn
  timeout: 10000, // 10 giây nếu không phản hồi thì ngắt
  headers: {
    "Content-Type": "application/json",
  },
});

// 1b. Axios instance cho public/anonymous requests (KHÔNG redirect khi 401)
const axiosPublic = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: Tự động đính kèm Token vào mỗi yêu cầu gửi đi
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem("token");

    if (token && config.headers) {
      // Đính kèm theo chuẩn Bearer Token của .NET Identity/JWT
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. Response Interceptor: Xử lý dữ liệu trả về và lỗi hệ thống
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Vì Backend của bạn trả về { status, msg, data }
    // Chúng ta trả về response.data để ở ngoài Component gọi là lấy được object đó luôn
    return response.data;
  },
  (error) => {
    // Xử lý lỗi tập trung
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token hết hạn hoặc không hợp lệ -> Xóa local và đẩy về login
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          // Chỉ redirect nếu không phải đang ở trang login
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
          break;
        case 403:
          console.error("Bạn không có quyền truy cập tính năng này");
          break;
        case 500:
          console.error("Lỗi hệ thống từ phía Server");
          break;
      }
    }
    return Promise.reject(error);
  },
);

// 3b. Response Interceptor cho axiosPublic (KHÔNG redirect)
axiosPublic.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    // Xử lý lỗi nhưng KHÔNG redirect, cho phép component tự handle
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Chỉ xóa token, không redirect
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          break;
        case 403:
          console.error("Bạn không có quyền truy cập tính năng này");
          break;
        case 500:
          console.error("Lỗi hệ thống từ phía Server");
          break;
      }
    }
    return Promise.reject(error);
  },
);

export { axiosPublic };
export default axiosClient;
