import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
 
  User,
  Mail,
  Info,
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
  const [needUsername, setNeedUsername] = useState(false); // State kiểm soát việc hiện ô Username

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    isSuccess: true,
  });

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.requestForgotPasswordOtp({
        email,
        username: username || undefined,
      });
      setStep(2);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      const errorMsg = axiosError.response?.data?.msg || "";

      // KIỂM TRA LỖI ĐẶC BIỆT: Nếu có nhiều account
      if (errorMsg.includes("nhiều tài khoản")) {
        setNeedUsername(true); // Hiện ô Username ngay lập tức
        setDialog({
          open: true,
          title: "Thông báo quan trọng",
          message: errorMsg, // Thông báo đã gửi danh sách username vào mail
          isSuccess: true, // Để màu xanh cho dịu mắt vì đây là hướng dẫn
        });
      } else {
        setDialog({
          open: true,
          title: "Yêu cầu thất bại",
          message: errorMsg || "Đã có lỗi xảy ra, vui lòng thử lại.",
          isSuccess: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setDialog({
        open: true,
        title: "Lỗi",
        message: "Mật khẩu xác nhận không khớp.",
        isSuccess: false,
      });
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, username, otp, newPassword });
      setDialog({
        open: true,
        title: "Thành công!",
        message: `Mật khẩu của tài khoản "${username}" đã được thay đổi.`,
        isSuccess: true,
      });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      setDialog({
        open: true,
        title: "Khôi phục thất bại",
        message: axiosError.response?.data?.msg || "Mã OTP không chính xác.",
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
          <div className="bg-blue-50/50 p-4 rounded-xl flex gap-3 border border-blue-100">
            <Info className="text-blue-500 shrink-0" size={20} />
            <p className="text-xs text-blue-700 leading-relaxed">
              Bạn chỉ cần nhập Email. Nếu email của bạn có nhiều tài khoản,
              chúng tôi sẽ gửi danh sách tên đăng nhập vào hộp thư cho bạn.
            </p>
          </div>

          <div className="space-y-4">
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
                className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-tet-primary/20 focus:border-tet-primary transition-all shadow-sm"
              />
            </div>

            {/* Ô USERNAME CHỈ HIỆN KHI CẦN THIẾT HOẶC USER MUỐN NHẬP TRƯỚC */}
            {(needUsername || username) && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-tet-primary mb-1.5 flex items-center gap-2">
                  <User size={14} /> Tên đăng nhập
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên đăng nhập từ Email của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3.5 border border-tet-primary/30 bg-tet-primary/5 rounded-xl outline-none focus:ring-2 focus:ring-tet-primary/20"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-tet-primary text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all ${loading ? "opacity-70" : ""}`}
          >
            {loading
              ? "Đang xử lý..."
              : needUsername
                ? "Xác nhận khôi phục"
                : "Tiếp tục"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleResetPassword}
          className="space-y-5 animate-in slide-in-from-right-4 duration-300"
        >
          <div className="bg-tet-secondary/10 p-4 rounded-xl text-center mb-4 border border-tet-secondary/20">
            <span className="text-xs text-tet-primary font-medium">
              Đang khôi phục: <strong>{username}</strong> <br />
              Mã đã gửi đến: <strong>{email}</strong>
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
              className="w-full p-3.5 border border-gray-200 rounded-xl text-center tracking-[0.5em] text-xl font-bold focus:border-tet-primary outline-none"
            />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:border-tet-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <input
              type="password"
              required
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:border-tet-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tet-primary text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-xs text-gray-400 hover:text-tet-primary text-center"
          >
            Quay lại bước trước
          </button>
        </form>
      )}

      {/* AlertDialog */}
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
                if (dialog.title === "Thành công!") navigate("/login");
                else setDialog({ ...dialog, open: false });
              }}
              className="bg-tet-primary hover:bg-tet-primary/90 text-white px-12 py-6 rounded-2xl font-bold shadow-md"
            >
              Đồng ý
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
