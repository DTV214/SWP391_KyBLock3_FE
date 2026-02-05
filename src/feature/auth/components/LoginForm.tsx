import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import type { LoginPayload } from "../services/authService";
import { AxiosError } from "axios";

// 1. Định nghĩa cấu trúc dữ liệu trả về từ Backend .NET của Happybox
interface AuthResponse {
  status: number;
  msg: string;
  data: {
    token: string;
    accountId: number;
    username: string;
    email: string;
    role: string;
  };
}

// 2. Định nghĩa cấu trúc lỗi khi API trả về lỗi (400, 401, v.v.)
interface ApiError {
  status: number;
  msg: string;
  data: null;
}

export function LoginForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginPayload>({
    username: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ép kiểu cho response dựa trên Interface AuthResponse
      const response = (await authService.login(
        formData,
      )) as unknown as AuthResponse;

      if (response.status === 200) {
        const { token, username, email, role } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("role", role); // Lưu role riêng để dễ check
        localStorage.setItem("user", JSON.stringify({ username, email, role }));

        alert("Đăng nhập thành công!");
        
        // Redirect dựa trên role
        if (role === "ADMIN" || role === "STAFF") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      }
    } catch (error: unknown) {
      // Xử lý lỗi một cách chuyên nghiệp không dùng any
      const axiosError = error as AxiosError<ApiError>;
      const errorMessage =
        axiosError.response?.data?.msg ||
        "Tên đăng nhập hoặc mật khẩu không chính xác";

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleLogin}>
      <div>
        <label className="block text-sm font-bold text-tet-primary mb-1.5">
          UserName
        </label>
        <input
          type="text"
          required
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          placeholder="Vui lòng nhập username"
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-tet-primary outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-tet-primary mb-1.5">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Mật khẩu"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-tet-primary outline-none text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-tet-primary text-white py-3.5 rounded-lg font-bold text-base hover:opacity-90 transition-all shadow-md ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Đang xử lý..." : "Đăng Nhập"}
      </button>

      {/* Các phần UI bên dưới giữ nguyên 100% */}
      <div className="relative my-8 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <span className="relative bg-white px-3 text-xs text-gray-400 uppercase tracking-wider">
          Hoặc đăng nhập bằng
        </span>
      </div>

      <button
        type="button"
        className="w-full border border-gray-200 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-all text-sm font-medium"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5"
        />{" "}
        Google
      </button>

      <p className="text-center text-sm text-gray-600 mt-6 font-medium">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="text-tet-primary font-bold underline underline-offset-4"
        >
          Đăng ký ngay
        </Link>
      </p>
    </form>
  );
}
