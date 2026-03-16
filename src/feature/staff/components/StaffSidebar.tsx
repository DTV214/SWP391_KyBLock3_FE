import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Package,
  LogOut,
  Home,
  UserCircle,
  MessageSquare,
} from "lucide-react";
import { chatService } from "@/feature/chat/services/chatService";
import { chatRealtimeService } from "@/feature/chat/services/chatRealtime";

export default function StaffSidebar() {
  const navigate = useNavigate();
  const userName = "Staff";
  const [unreadChatCount, setUnreadChatCount] = useState(0);

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
      path: "/staff/dashboard",
      label: "Tổng quan",
      icon: <LayoutDashboard size={18} />,
    },
    {
      path: "/staff/quotations",
      label: "Xử lý Báo giá",
      icon: <FileText size={18} />,
    },
    {
      path: "/staff/orders",
      label: "Đơn hàng của tôi",
      icon: <Package size={18} />,
    },
    {
      path: "/staff/chats",
      label: "Chat khách hàng",
      icon: <MessageSquare size={18} />,
    },
  ];

  return (
    <aside className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-[#d77a45] to-[#b85b29] p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <UserCircle size={28} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight truncate w-32">
              {userName}
            </h3>
            <p className="text-xs opacity-90 font-medium tracking-wide">
              STAFF PORTAL
            </p>
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
                  ? "bg-[#fffaf5] text-[#7a160e] font-bold shadow-sm border border-[#f1e1d6]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#7a160e]"
              }`
            }
          >
            <div className="relative">
              {item.icon}
              {item.path === "/staff/chats" && unreadChatCount > 0 && (
                <span className="absolute -top-2 -right-2 h-2 w-2 rounded-full bg-red-500" />
              )}
            </div>
            <span className="flex-1">{item.label}</span>
            {item.path === "/staff/chats" && unreadChatCount > 0 && (
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
