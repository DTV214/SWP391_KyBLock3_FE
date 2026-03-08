import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  User,
  Mail,
} from "lucide-react";
import authService from "../services/authService";
import { AxiosError } from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiError {
  msg: string;
}

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // Thêm state username
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    isSuccess: true,
  });

  // --- GIAI ĐOẠN 1: GỬI YÊU CẦU OTP (EMAIL + USERNAME) ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Gửi cả email và username để Backend định danh chính xác account
      await authService.requestForgotPasswordOtp({ email, username });
      setStep(2);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      setDialog({
        open: true,
        title: "Yêu cầu thất bại",
        message:
          axiosError.response?.data?.msg ||
          "Thông tin tài khoản không chính xác hoặc lỗi hệ thống.",
        isSuccess: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- GIAI ĐOẠN 2: RESET MẬT KHẨU ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setDialog({
        open: true,
        title: "Lỗi nhập liệu",
        message: "Mật khẩu xác nhận không khớp, vui lòng kiểm tra lại.",
        isSuccess: false,
      });
      return;
    }

    setLoading(true);
    try {
      // Gửi đầy đủ Email, Username, OTP và Mật khẩu mới
      await authService.resetPassword({ email, username, otp, newPassword });
      setDialog({
        open: true,
        title: "Thành công!",
        message: `Mật khẩu của tài khoản "${username}" đã được thay đổi thành công.`,
        isSuccess: true,
      });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      setDialog({
        open: true,
        title: "Khôi phục thất bại",
        message:
          axiosError.response?.data?.msg ||
          "Mã OTP không chính xác hoặc đã hết hạn.",
        isSuccess: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {step === 1 ? (
        <form
          onSubmit={handleRequestOtp}
          className="space-y-5 animate-in fade-in duration-500"
        >
          <div className="text-center">
            <p className="text-sm text-gray-500 italic leading-relaxed">
              Vui lòng nhập Email và Tên đăng nhập để nhận mã xác thực khôi phục
              mật khẩu.
            </p>
          </div>

          <div className="space-y-4">
            {/* INPUT USERNAME (MỚI) */}
            <div>
              <label className="block text-sm font-bold text-tet-primary mb-1.5 flex items-center gap-2">
                <User size={14} /> Tên đăng nhập
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: xoai_staff"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-tet-primary/20 focus:border-tet-primary transition-all shadow-sm text-sm"
              />
            </div>

            {/* INPUT EMAIL */}
            <div>
              <label className="block text-sm font-bold text-tet-primary mb-1.5 flex items-center gap-2">
                <Mail size={14} /> Email liên kết
              </label>
              <input
                type="email"
                required
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-tet-primary/20 focus:border-tet-primary transition-all shadow-sm text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-tet-primary text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? "Đang kiểm tra..." : "Gửi mã xác thực"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleResetPassword}
          className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="bg-tet-secondary/10 p-4 rounded-xl text-center mb-4 border border-tet-secondary/20">
            <span className="text-xs text-tet-primary font-medium">
              Khôi phục cho tài khoản: <strong>{username}</strong> <br />
              Mã đã gửi đến Email: <strong>{email}</strong>
            </span>
          </div>

          <div>
            <label className="block text-sm font-bold text-tet-primary mb-1.5 text-center">
              Mã xác thực (OTP)
            </label>
            <input
              type="text"
              maxLength={6}
              required
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3.5 border border-gray-200 rounded-xl text-center tracking-[0.5em] text-xl font-bold focus:border-tet-primary outline-none shadow-inner"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-tet-primary mb-1.5">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3.5 border border-gray-200 rounded-xl focus:border-tet-primary outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tet-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-tet-primary mb-1.5">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                required
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl focus:border-tet-primary outline-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-tet-primary text-white py-4 rounded-xl font-bold shadow-lg transition-all ${loading ? "opacity-70" : "hover:brightness-110"}`}
          >
            {loading ? "Đang cập nhật..." : "Xác nhận đổi mật khẩu"}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-tet-primary transition-colors mt-2"
          >
            <ArrowLeft size={14} /> Quay lại nhập thông tin
          </button>
        </form>
      )}

      {/* ALERT DIALOG */}
      <AlertDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog({ ...dialog, open })}
      >
        <AlertDialogContent className="max-w-sm rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader className="items-center text-center">
            <div
              className={`p-4 rounded-full mb-2 ${dialog.isSuccess ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"}`}
            >
              {dialog.isSuccess ? (
                <CheckCircle2 size={40} />
              ) : (
                <XCircle size={40} />
              )}
            </div>
            <AlertDialogTitle className="text-2xl font-serif text-tet-primary">
              {dialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              {dialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => {
                if (dialog.isSuccess) navigate("/login");
                else setDialog({ ...dialog, open: false });
              }}
              className="bg-tet-primary hover:bg-tet-primary/90 text-white px-12 py-6 rounded-2xl font-bold shadow-md"
            >
              {dialog.isSuccess ? "Đăng nhập ngay" : "Thử lại"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
