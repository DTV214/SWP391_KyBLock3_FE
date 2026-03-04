import { ClipboardList, Clock, CheckCircle2, TrendingUp } from "lucide-react";

export default function StaffDashboardPage() {
  const stats = [
    {
      label: "Báo giá chờ xử lý",
      value: "12",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Đơn hàng đang giao",
      value: "8",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Công việc hoàn thành",
      value: "45",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Tổng yêu cầu mới",
      value: "5",
      icon: ClipboardList,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#7a160e]">
          Tổng quan công việc
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Chào mừng trở lại! Dưới đây là tóm tắt công việc hôm nay của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-500 font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#7a160e] mb-4">
          Thông báo nội bộ
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-[#fffaf5] border border-[#ead6c9] rounded-2xl">
            <p className="font-semibold text-[#4a0d06]">
              🔥 Chiến dịch quà Tết 2026 sắp bắt đầu
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Yêu cầu toàn bộ Staff kiểm tra kỹ bảng giá chiết khấu mới nhất
              trước khi báo giá cho khách B2B.
            </p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="font-semibold text-blue-900">📦 Cập nhật kho hàng</p>
            <p className="text-sm text-blue-700 mt-1">
              Giỏ quà "An Khang" hiện đang tạm hết hộp gỗ, vui lòng tư vấn khách
              chuyển sang hộp da.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
