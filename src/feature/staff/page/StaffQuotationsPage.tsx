import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Filter,
  Building,
  DollarSign,
  PlayCircle,
  FileText,
  Clock,
} from "lucide-react";

// --- MOCK DATA ---
const MOCK_QUOTATIONS = [
  {
    quotationId: 1001,
    company: "Tập đoàn FPT",
    requestDate: "2026-03-01T08:30:00",
    totalQuantity: 150,
    totalPrice: 150000000,
    status: "SUBMITTED", // Mới khách gửi
  },
  {
    quotationId: 1002,
    company: "Công ty Cổ phần Sữa Việt Nam (Vinamilk)",
    requestDate: "2026-03-02T10:15:00",
    totalQuantity: 500,
    totalPrice: 420000000,
    status: "STAFF_REVIEWING", // Đang làm dở
  },
  {
    quotationId: 1003,
    company: "Ngân hàng Techcombank",
    requestDate: "2026-03-02T14:45:00",
    totalQuantity: 200,
    totalPrice: 280000000,
    status: "WAITING_ADMIN", // Đã đẩy lên Admin
  },
  {
    quotationId: 1004,
    company: "Shopee VN",
    requestDate: "2026-03-03T09:00:00",
    totalQuantity: 50,
    totalPrice: 45000000,
    status: "SUBMITTED",
  },
  {
    quotationId: 1005,
    company: "Công ty TNHH VNG",
    requestDate: "2026-03-03T11:20:00",
    totalQuantity: 300,
    totalPrice: null, // Trường hợp chưa có giá cụ thể
    status: "STAFF_REVIEWING",
  },
];

// --- HELPER FORMAT ---
const formatMoney = (value?: number | null) => {
  if (typeof value !== "number") return "Chưa cập nhật";
  return `${value.toLocaleString("vi-VN")}đ`;
};

const getStatusMeta = (status: string) => {
  switch (status) {
    case "SUBMITTED":
      return {
        label: "Mới nhận",
        badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
      };
    case "STAFF_REVIEWING":
      return {
        label: "Đang xử lý",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      };
    case "WAITING_ADMIN":
      return {
        label: "Chờ Admin duyệt",
        badgeClass: "bg-violet-100 text-violet-800 border-violet-200",
      };
    default:
      return { label: status, badgeClass: "bg-gray-100 text-gray-700" };
  }
};

export default function StaffQuotationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Lọc danh sách dựa trên trạng thái
  const filteredQuotations = MOCK_QUOTATIONS.filter(
    (q) => filterStatus === "ALL" || q.status === filterStatus,
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#7a160e]">
            Xử lý Báo giá (B2B)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách các yêu cầu báo giá từ Khách hàng Doanh nghiệp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#fffaf5] border border-[#ead6c9] rounded-full px-4 py-2">
            <Filter className="h-4 w-4 text-[#b07b61]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#4a0d06] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUBMITTED">Mới nhận (Cần xử lý)</option>
              <option value="STAFF_REVIEWING">Đang xử lý</option>
              <option value="WAITING_ADMIN">Chờ Admin duyệt</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredQuotations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-sm text-gray-500 shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            Không có báo giá nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredQuotations.map((item) => {
            const statusMeta = getStatusMeta(item.status);
            return (
              <div
                key={item.quotationId}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                {/* Thông tin chính */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-[#7a160e]">
                      #{item.quotationId}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
                    <Building className="h-4 w-4 text-gray-400" />
                    {item.company}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(item.requestDate).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.requestDate).toLocaleTimeString("vi-VN")}
                    </div>
                  </div>
                </div>

                {/* Thông tin giá & Nút Action */}
                <div className="flex items-center gap-6 lg:border-l lg:border-gray-100 lg:pl-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">
                      Số lượng:{" "}
                      <span className="font-semibold text-gray-800">
                        {item.totalQuantity} món
                      </span>
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[#7a160e]">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-bold text-lg">
                        {formatMoney(item.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Nút hành động thay đổi tùy theo trạng thái */}
                  <Link
                    to={`/staff/quotations/${item.quotationId}`}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all shadow-sm ${
                      item.status === "SUBMITTED"
                        ? "bg-[#7a160e] text-white hover:bg-[#5c0f09]"
                        : item.status === "STAFF_REVIEWING"
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {item.status === "SUBMITTED" && (
                      <>
                        <PlayCircle className="h-4 w-4" /> Bắt đầu xử lý
                      </>
                    )}
                    {item.status === "STAFF_REVIEWING" && (
                      <>
                        <FileText className="h-4 w-4" /> Tiếp tục xử lý
                      </>
                    )}
                    {item.status === "WAITING_ADMIN" && (
                      <>
                        <FileText className="h-4 w-4" /> Xem chi tiết
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
