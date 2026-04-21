import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tag,
  Settings,
  Gift,
  ShoppingCart,
  FileText,
  Users,
  MessageSquare,
  LogOut,
  Home,
  BookOpen,
  PackageOpen,
  MapPin,
  Ticket,
  Mail, // <-- Bổ sung icon Mail
} from "lucide-react";
import { chatService } from "@/feature/chat/services/chatService";
import { chatRealtimeService } from "@/feature/chat/services/chatRealtime";
import BackofficeChatRealtimeBridge from "@/feature/chat/components/BackofficeChatRealtimeBridge";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const loadUnreadChats = async () => {
      try {
        const unreadCount = await chatService.getUnreadConversationCount();
        setUnreadChatCount(unreadCount);
      } catch {
        // silent unread-count error
      }
    };

    void loadUnreadChats();

    const unsubscribeRealtime = chatRealtimeService.subscribe(() => {
      void loadUnreadChats();
    });

    return () => {
      unsubscribeRealtime();
    };
  }, []);

  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      navigate("/login");
    }
  };

  const menuItems = [
    {
      path: "/admin/overview",
      label: "Tổng quan",
      icon: <LayoutDashboard size={18} />,
    },
    {
      path: "/admin/accounts",
      label: "Quản lý Tài khoản",
      icon: <Users size={18} />,
    },
    {
      path: "/admin/store-locations",
      label: "Cửa hàng",
      icon: <MapPin size={18} />,
    },
    {
      path: "/admin/products",
      label: "Sản phẩm",
      icon: <Package size={18} />,
    },
    {
      path: "/admin/inventory",
      label: "Kho hàng",
      icon: <PackageOpen size={18} />,
    },
    {
      path: "/admin/categories",
      label: "Danh mục",
      icon: <Tag size={18} />,
    },
    {
      path: "/admin/configs",
      label: "Cấu hình giỏ",
      icon: <Settings size={18} />,
    },
    {
      path: "/admin/templates",
      label: "Giỏ mẫu",
      icon: <Gift size={18} />,
    },
    {
      path: "/admin/promotions",
      label: "Promotion",
      icon: <Ticket size={18} />,
    },
    {
      path: "/admin/blogs",
      label: "Bài viết",
      icon: <BookOpen size={18} />,
    },
    {
      path: "/admin/quotations",
      label: "Quotations",
      icon: <FileText size={18} />,
    },
    {
      path: "/admin/orders",
      label: "Đơn hàng",
      icon: <ShoppingCart size={18} />,
    },
    // --- BỔ SUNG MENU LIÊN HỆ TẠI ĐÂY ---
    {
      path: "/admin/contacts",
      label: "Yêu cầu liên hệ",
      icon: <Mail size={18} />,
    },
    {
      path: "/admin/chats",
      label: "Chat khách hàng",
      icon: <MessageSquare size={18} />,
    },
  ];

  return (
    <>
      <BackofficeChatRealtimeBridge />
      <aside className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_22px_50px_-32px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur">
        <div className="shrink-0 bg-gradient-to-br from-tet-primary to-tet-accent p-6 text-white md:p-7">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white/20 backdrop-blur-sm">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Admin Panel</h3>
              <p className="text-xs opacity-90">Quản trị hệ thống</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 pt-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mb-1.5 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-tet-secondary text-tet-primary font-bold shadow-[0_14px_28px_-22px_rgba(122,22,14,0.55)]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-tet-primary"
                }`
              }
            >
              <div className="relative">
                {item.icon}
                {item.path === "/admin/chats" && unreadChatCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
              <span className="flex-1">{item.label}</span>
              {item.path === "/admin/chats" && unreadChatCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadChatCount}
                </span>
              )}
            </NavLink>
          ))}

          <div className="my-2 border-t border-gray-200"></div>

          <NavLink
            to="/home"
            className="mb-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50"
          >
            <Home size={18} />
            <span>Về trang chủ</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full rounded-2xl px-4 py-3.5 text-left text-sm font-medium text-red-600 transition-all hover:bg-red-50"
          >
            <span className="flex items-center gap-3">
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </span>
          </button>
        </nav>
      </aside>
    </>
  );
}
