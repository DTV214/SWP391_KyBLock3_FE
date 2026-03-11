import axios from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

// 1. Khởi tạo instance chính
const axiosClient = axios.create({
  timeout: 10000,
  // QUAN TRỌNG: Đã bỏ hardcode "Content-Type": "application/json" ở đây.
  // Axios mặc định gửi JSON rất tốt, nhưng bỏ đi sẽ giúp nó TỰ ĐỘNG
  // nhận diện FormData (multipart/form-data) khi bạn upload ảnh ở chức năng Blog.
});

// 1b. Axios instance cho public/anonymous requests
const axiosPublic = axios.create({
  timeout: 10000,
});

// 2. Request Interceptor: Tự động đính kèm Token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");

    // Đảm bảo headers tồn tại
    if (!config.headers) return config;

    // Kỹ thuật an toàn: Nếu là FormData (gửi ảnh), tuyệt đối không set Content-Type tĩnh
    // URLSearchParams → Axios tự set application/x-www-form-urlencoded (cũng không cần set)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else if (!(config.data instanceof URLSearchParams)) {
      config.headers["Content-Type"] = "application/json";
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. Response Interceptor: Xử lý dữ liệu và lỗi
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error("Token hết hạn hoặc bị từ chối truy cập (401).");
          // Xóa token
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role"); // Nhớ xóa cả role nhé

          // Chuyển hướng nếu không phải đang ở trang login
          if (!window.location.pathname.includes("/login")) {
            // Thay vì dùng window.location.href (làm reload trang và mất log Network),
            // bạn có thể cân nhắc dùng navigate của react-router-dom ở cấp Component.
            // Nhưng tạm thời để an toàn, ta vẫn dùng window.location nhưng thêm delay 1 chút để bạn kịp đọc log.
            setTimeout(() => {
              window.location.href = "/login";
            }, 500);
          }
          break;
        case 403:
          console.error("Bạn không có quyền truy cập tính năng này (403)");
          break;
        case 500:
          console.error("Lỗi hệ thống từ phía Server (500)");
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
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          break;
        case 403:
          console.error("Bạn không có quyền truy cập tính năng này (403)");
          break;
      }
    }
    return Promise.reject(error);
  },
);

export { axiosPublic };
export default axiosClient;
