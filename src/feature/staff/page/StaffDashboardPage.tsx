import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Clock3,
  AlertTriangle,
  ListTodo,
  MessageSquare,
} from "lucide-react";
import {
  quotationService,
  type QuotationSummary,
} from "@/feature/quotation/services/quotationService";
import { chatService } from "@/feature/chat/services/chatService";
import { chatRealtimeService } from "@/feature/chat/services/chatRealtime";

export default function StaffDashboardPage() {
  const [rows, setRows] = useState<QuotationSummary[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnreadChats = async () => {
      const conversations = await chatService.getAllConversations();

      const unreadByConversation = await Promise.all(
        conversations.map(async (conversation) => {
          try {
            const messages = await chatService.getConversationMessages(
              conversation.id,
            );
            return messages.some(
              (message) =>
                !message.isRead && message.senderId === conversation.userId,
            );
          } catch {
            return false;
          }
        }),
      );

      setUnreadChatCount(unreadByConversation.filter(Boolean).length);
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [quotationResponse] = await Promise.all([
          quotationService.getStaffQuotations(),
        ]);

        setRows((quotationResponse?.data || []) as QuotationSummary[]);
        await fetchUnreadChats();
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu tổng quan báo giá.");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();

    const unsubscribeRealtime = chatRealtimeService.subscribe(() => {
      void fetchUnreadChats();
    });

    return unsubscribeRealtime;
  }, []);

  const { submittedCount, reviewingCount, rejectedCount, totalTaskCount } =
    useMemo(() => {
      const submitted = rows.filter((item) => item.status === "SUBMITTED").length;
      const reviewing = rows.filter(
        (item) => item.status === "STAFF_REVIEWING",
      ).length;
      const rejected = rows.filter((item) => item.status === "ADMIN_REJECTED").length;

      return {
        submittedCount: submitted,
        reviewingCount: reviewing,
        rejectedCount: rejected,
        totalTaskCount: submitted + reviewing + rejected,
      };
    }, [rows]);

  const stats = [
    {
      label: "Tổng task cần xử lý",
      value: totalTaskCount,
      icon: ListTodo,
      color: "text-[#7a160e]",
      bg: "bg-[#fff1e6]",
    },
    {
      label: "Khách hàng gửi yêu cầu",
      value: submittedCount,
      icon: ClipboardList,
      color: "text-sky-700",
      bg: "bg-sky-100",
    },
    {
      label: "Nhân viên đang xử lý",
      value: reviewingCount,
      icon: Clock3,
      color: "text-amber-700",
      bg: "bg-amber-100",
    },
    {
      label: "Admin từ chối",
      value: rejectedCount,
      icon: AlertTriangle,
      color: "text-rose-700",
      bg: "bg-rose-100",
    },
    {
      label: "Chat mới từ khách hàng",
      value: unreadChatCount,
      icon: MessageSquare,
      color: "text-violet-700",
      bg: "bg-violet-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#7a160e]">Tổng quan công việc</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tóm tắt nhanh các task báo giá staff cần xử lý.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? "..." : stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#7a160e] mb-4">Thông báo nội bộ</h3>
        <div className="space-y-3">
          <div className="p-4 bg-[#fffaf5] border border-[#ead6c9] rounded-2xl">
            <p className="font-semibold text-[#4a0d06]">Chiến dịch quà Tết sắp bắt đầu</p>
            <p className="text-sm text-gray-600 mt-1">
              Staff cần ưu tiên xử lý các yêu cầu mới và các báo giá bị admin từ chối.
            </p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="font-semibold text-blue-900">Cập nhật quy trình</p>
            <p className="text-sm text-blue-700 mt-1">
              Vui lòng kiểm tra kỹ chi phí phát sinh trước khi gửi duyệt lại cho admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
