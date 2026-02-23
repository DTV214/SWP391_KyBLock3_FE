import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, FileText, Filter } from "lucide-react";
import {
  quotationService,
  type QuotationSummary,
} from "@/feature/quotation/services/quotationService";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Nháp" },
  { value: "SUBMITTED", label: "Đã gửi" },
  { value: "STAFF_REVIEWING", label: "Nhân viên xử lý" },
  { value: "WAITING_ADMIN", label: "Chờ Admin" },
  { value: "ADMIN_REJECTED", label: "Admin từ chối" },
  { value: "WAITING_CUSTOMER", label: "Chờ khách phản hồi" },
  { value: "CUSTOMER_REJECTED", label: "Khách từ chối" },
  { value: "CUSTOMER_ACCEPTED", label: "Khách đồng ý" },
  { value: "CONVERTED_TO_ORDER", label: "Đã tạo đơn" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const statusBadgeMap: Record<string, string> = {
  DRAFT: "bg-[#f7ebe2] text-[#7a160e]",
  SUBMITTED: "bg-blue-50 text-blue-600",
  STAFF_REVIEWING: "bg-amber-50 text-amber-700",
  WAITING_ADMIN: "bg-amber-50 text-amber-700",
  ADMIN_REJECTED: "bg-red-50 text-red-600",
  WAITING_CUSTOMER: "bg-purple-50 text-purple-600",
  CUSTOMER_REJECTED: "bg-red-50 text-red-600",
  CUSTOMER_ACCEPTED: "bg-green-50 text-green-600",
  CONVERTED_TO_ORDER: "bg-green-50 text-green-600",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default function QuotationHistoryPage() {
  const [status, setStatus] = useState("");
  const [data, setData] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await quotationService.getMyQuotations(status || undefined);
        setData(response?.data || []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải lịch sử báo giá.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);

  const rows = useMemo(() => data, [data]);

  return (
    <div className="bg-[#FBF5E8]/40 text-[#4a0d06] min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-[#f1e1d6] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lịch sử báo giá</h1>
            <p className="mt-2 text-sm text-[#7b5a4c]">
              Theo dõi tất cả yêu cầu báo giá của bạn.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#f1e1d6] bg-[#fffaf5] px-4 py-2 text-sm">
            <Filter className="h-4 w-4 text-[#b48a7a]" />
            <select
              className="bg-transparent text-sm focus:outline-none"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-8 text-center text-sm text-[#7b5a4c]">
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
              {error}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-8 text-center text-sm text-[#7b5a4c]">
              Chưa có yêu cầu báo giá nào.
            </div>
          ) : (
            rows.map((item) => (
              <div
                key={item.quotationId}
                className="flex flex-col gap-4 rounded-3xl border border-[#f1e1d6] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">
                      #{item.quotationId}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusBadgeMap[item.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#7b5a4c]">
                    Công ty: <span className="font-semibold">{item.company}</span>
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#8a5b4f]">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.requestDate).toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-[#8a5b4f]">Ước tính</p>
                    <p className="text-lg font-semibold text-[#7a160e]">
                      {item.totalPrice
                        ? `${item.totalPrice.toLocaleString("vi-VN")}đ`
                        : "Chưa có"}
                    </p>
                  </div>
                  <Link
                    to={`/quotation/status/${item.quotationId}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#7a160e] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5c0f09]"
                  >
                    <FileText className="h-4 w-4" />
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
