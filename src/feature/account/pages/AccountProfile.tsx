// src/feature/account/pages/AccountProfile.tsx
import { motion } from "framer-motion";
import {
 
  ShieldCheck,

  Save,
  Lock,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import accountService from "../services/accountService";
import type { UpdateProfilePayload } from "../services/accountService";
import { AxiosError } from "axios";

interface ApiError {
  msg: string;
}

export default function AccountProfile() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 1. State quản lý dữ liệu Form khớp với Payload của Backend
  const [formData, setFormData] = useState<UpdateProfilePayload>({
    fullName: "",
    phone: "",
    address: "",
  });

  // State lưu trữ email (không cho sửa) và trạng thái tài khoản
  const [email, setEmail] = useState("");

  // 2. Lấy dữ liệu profile hiện tại khi vào trang
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await accountService.getProfile();
        if (response.status === 200) {
          const data = response.data;
          setFormData({
            fullName: data.fullName || "",
            phone: data.phone || "",
            address: data.address || "",
          });
          setEmail(data.email);
        }
      } catch (error: unknown) {
        console.error("Lỗi fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 3. Hàm xử lý cập nhật (PUT /api/profile)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await accountService.updateProfile(formData);
      if (res.status === 200) {
        alert("Cập nhật thông tin thành công!");
        // Cập nhật lại thông tin user trong localStorage nếu cần hiển thị tên ở Navbar ngay lập tức
        const userLocal = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...userLocal, username: formData.fullName }),
        );
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      alert(axiosError.response?.data?.msg || "Không thể cập nhật thông tin.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-tet-primary" size={32} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      {/* 1. KHỐI THÔNG TIN CÁ NHÂN */}
      <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-tet-bg rounded-2xl text-tet-primary">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-tet-primary">
              Thông tin cá nhân
            </h3>
            <p className="text-xs text-gray-400 italic">
              Cập nhật thông tin để có trải nghiệm tốt nhất
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Họ và tên */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-tet-primary ml-1">
                Họ và tên *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-tet-secondary outline-none transition-all"
                required
              />
            </div>

            {/* Số điện thoại */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-tet-primary ml-1 text-right flex justify-between">
                Số điện thoại *{" "}
                <span className="text-[10px] text-green-600 uppercase">
                  Đã xác thực
                </span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-tet-secondary outline-none transition-all"
                required
              />
            </div>

            {/* Email (Disabled theo logic Backend) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-tet-primary ml-1">
                Email (Chỉ xem)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full p-4 bg-gray-100 border border-gray-100 rounded-2xl text-gray-500 cursor-not-allowed opacity-70 pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-[10px] font-bold">
                  Đã bảo mật
                </span>
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-tet-primary ml-1">
                Địa chỉ nhận quà
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Nhập địa chỉ của bạn"
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-tet-secondary outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-10">
            <button
              type="button"
              className="px-8 py-3 rounded-full text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updating}
              className="bg-tet-primary text-white px-10 py-3 rounded-full text-sm font-bold shadow-lg hover:bg-tet-accent transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {updating ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </section>

      {/* 2. KHỐI BẢO MẬT & TÙY CHỌN (Tạm thời giữ nguyên giao diện tĩnh) */}
      <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 opacity-60">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-serif font-bold text-tet-primary">
            Bảo mật (Sắp ra mắt)
          </h3>
        </div>
        <p className="text-sm italic text-gray-400">
          Chức năng đổi mật khẩu đang được đồng bộ hóa với hệ thống OTP.
        </p>
      </section>
    </motion.div>
  );
}
