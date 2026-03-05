import {
  User,
  ClipboardList,
  MapPin,
  Ticket,
  LogOut,
  Settings,
  Gift,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function AccountSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // --- LOGIC ĐĂNG XUẤT ---
  const handleLogout = () => {
    // Xóa sạch dấu vết đăng nhập
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Đẩy người dùng về trang Login ngay lập tức
    navigate("/login");
  };

  const menuItems = [
    { name: "Hồ sơ", path: "/account/overview", icon: <User size={20} /> },
    {
      name: "Thông tin cá nhân",
      path: "/account/profile",
      icon: <Settings size={20} />,
    },
    {
      name: "Lịch sử đơn hàng",
      path: "/account/orders",
      icon: <ClipboardList size={20} />,
    },
    { name: "Địa chỉ", path: "/account/addresses", icon: <MapPin size={20} /> },
    { name: "Voucher", path: "/account/vouchers", icon: <Ticket size={20} /> },
    { name: "Giỏ quà của tôi", path: "/account/baskets", icon: <Gift size={20} /> },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 bg-tet-primary text-white">
        <p className="text-xs uppercase tracking-widest opacity-70 font-bold">
          Tài khoản của tôi
        </p>
      </div>
      <nav className="p-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all mb-1 ${
              location.pathname === item.path
                ? "bg-[#FBF5E8] text-tet-primary shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-tet-primary"
            }`}
          >
            {item.icon} {item.name}
          </Link>
        ))}
        {/* Nút đăng xuất được gắn logic handleLogout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all mt-4 border-t border-gray-50 pt-6"
        >
          <LogOut size={20} /> Đăng xuất
        </button>
      </nav>
    </aside>
  );
}
