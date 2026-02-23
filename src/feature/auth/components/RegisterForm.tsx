import authService from "../services/authService";
import type { RegisterRequestPayload } from "../services/authService";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";

interface ApiError {
  msg: string;
}

export function RegisterForm() {
  const navigate = useNavigate();

  // --- QUẢN LÝ TRẠNG THÁI ---
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState<RegisterRequestPayload>({
    username: "",
    password: "",
    email: "",
    fullname: "",
    phone: "", // Đã có trường riêng để quản lý
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- BƯỚC 1: REQUEST OTP ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      await authService.requestOtp(formData);
      alert("Mã OTP đã được gửi về Email của bạn!");
      setIsOtpStep(true);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      alert(
        axiosError.response?.data?.msg || "Đăng ký thất bại, vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- BƯỚC 2: VERIFY OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.verifyOtp({
        username: formData.username,
        otp: otp,
      });
      alert("Kích hoạt tài khoản thành công! Hãy đăng nhập.");
      navigate("/login");
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      alert(axiosError.response?.data?.msg || "Mã OTP không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  // --- GIAO DIỆN BƯỚC 2: NHẬP OTP ---
  if (isOtpStep) {
    return (
      <form className="space-y-6" onSubmit={handleVerifyOtp}>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4 font-medium">
            Mã xác thực đã được gửi tới <br />
            <span className="text-tet-primary font-bold">{formData.email}</span>
          </p>
          <input
            type="text"
            placeholder="Nhập 6 số OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-4 text-center text-2xl tracking-[0.5em] font-serif border border-gray-200 rounded-lg focus:ring-1 focus:ring-tet-primary outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-tet-primary text-white py-3.5 rounded-lg font-bold shadow-md transition-all ${
            loading ? "opacity-70" : "hover:brightness-110"
          }`}
        >
          {loading ? "Đang xác thực..." : "Xác Thực Tài Khoản"}
        </button>

        <button
          type="button"
          onClick={() => setIsOtpStep(false)}
          className="w-full text-xs text-gray-400 underline hover:text-tet-primary"
        >
          Quay lại thay đổi thông tin
        </button>
      </form>
    );
  }

  // --- GIAO DIỆN BƯỚC 1: ĐIỀN THÔNG TIN ---
  return (
    <form className="space-y-4" onSubmit={handleRequestOtp}>
      {/* Họ và tên */}
      <div>
        <label className="block text-sm font-bold text-tet-primary mb-1">
          Họ và tên
        </label>
        <input
          type="text"
          required
          value={formData.fullname}
          onChange={(e) =>
            setFormData({ ...formData, fullname: e.target.value })
          }
          placeholder="Họ và tên của bạn"
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-tet-primary outline-none text-sm"
        />
      </div>

      {/* Email (Đưa ra full width để nhường chỗ cho SĐT ở dưới) */}
      <div>
        <label className="block text-sm font-bold text-tet-primary mb-1">
          Email
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Địa chỉ email"
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-tet-primary outline-none text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Username */}
        <div>
          <label className="block text-sm font-bold text-tet-primary mb-1">
            Tên đăng nhập
          </label>
          <input
            type="text"
            required
            value={formData.username}
            onChange={
              (e) =>
                setFormData({
                  ...formData,
                  username: e.target.value,
                }) // Chỉ cập nhật username
            }
            placeholder="Username"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-tet-primary outline-none text-sm"
          />
        </div>

        {/* Số điện thoại (Trường mới được thêm vào) */}
        <div>
          <label className="block text-sm font-bold text-tet-primary mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={
              (e) =>
                setFormData({
                  ...formData,
                  phone: e.target.value,
                }) // Chỉ cập nhật phone
            }
            placeholder="Số điện thoại"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-tet-primary outline-none text-sm"
          />
        </div>
      </div>

      {/* Mật khẩu */}
      <div>
        <label className="block text-sm font-bold text-tet-primary mb-1">
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Xác nhận mật khẩu */}
      <div>
        <label className="block text-sm font-bold text-tet-primary mb-1">
          Xác nhận mật khẩu
        </label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu"
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-tet-primary outline-none text-sm"
        />
      </div>

      <button
        disabled={loading}
        className={`w-full bg-tet-primary text-white py-3.5 rounded-lg font-bold shadow-md transition-all ${
          loading ? "opacity-70" : "hover:brightness-110"
        }`}
      >
        {loading ? "Đang gửi yêu cầu..." : "Đăng Ký Ngay"}
      </button>

      <p className="text-center text-sm mt-6 text-gray-600 font-medium">
        Đã có tài khoản?{" "}
        <Link
          to="/login"
          className="text-tet-primary font-bold underline underline-offset-4"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </form>
  );
}
