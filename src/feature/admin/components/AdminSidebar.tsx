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
} from "lucide-react";
import { chatService } from "@/feature/chat/services/chatService";
import { chatRealtimeService } from "@/feature/chat/services/chatRealtime";

export default function AdminSidebar() {
  const POLL_INTERVAL_MS = 7000;
  const navigate = useNavigate();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    const loadUnreadChats = async () => {
      try {
        const conversations = await chatService.getAllConversations();
        const unreadConversations = conversations.filter((conversation) =>
          (conversation.messages || []).some(
            (message) =>
              !message.isRead && message.senderId === conversation.userId,
          ),
        );
        setUnreadChatCount(unreadConversations.length);
      } catch {
        // silent unread-count error
      }
    };

    void loadUnreadChats();

    const unsubscribeConnection = chatRealtimeService.subscribeConnection(
      setIsRealtimeConnected,
    );
    const unsubscribeRealtime = chatRealtimeService.subscribe(() => {
      void loadUnreadChats();
    });

    const timer = !isRealtimeConnected
      ? window.setInterval(() => {
          void loadUnreadChats();
        }, POLL_INTERVAL_MS)
      : null;

    return () => {
      unsubscribeConnection();
      unsubscribeRealtime();
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [isRealtimeConnected]);

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
      icon: <Gift size={18} />,
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
      path: "/admin/reviewing-quotations",
      label: "Reviewing Quotations",
      icon: <FileText size={18} />,
    },
    {
      path: "/admin/orders",
      label: "Đơn hàng",
      icon: <ShoppingCart size={18} />,
    },
    {
      path: "/admin/chats",
      label: "Chat khách hàng",
      icon: <MessageSquare size={18} />,
    },
    {
      path: "/admin/customers",
      label: "Khách hàng",
      icon: <Users size={18} />,
    },
  ];

  return (
    <aside className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-tet-primary to-tet-accent p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Admin Panel</h3>
            <p className="text-xs opacity-90">Quản trị hệ thống</p>
          </div>
        </div>
      </div>

      <nav className="p-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${
                isActive
                  ? "bg-tet-secondary text-tet-primary font-bold shadow-sm"
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
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 text-blue-600 hover:bg-blue-50"
        >
          <Home size={18} />
          <span>Về trang chủ</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </nav>
    </aside>
  );
}
