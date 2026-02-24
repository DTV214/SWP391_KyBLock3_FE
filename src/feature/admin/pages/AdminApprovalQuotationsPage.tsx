import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, FileText, Filter } from "lucide-react";
import {
  quotationService,
  type QuotationSummary,
} from "@/feature/quotation/services/quotationService";
import {
  QUOTATION_STATUS_OPTIONS,
  getQuotationStatusMeta,
} from "@/feature/quotation/utils/quotationStatus";

export default function AdminApprovalQuotationsPage() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await quotationService.getAdminQuotations(status || undefined);
        setRows(response?.data || []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách quotation cho admin.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tet-primary">Quotations</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách quotation chờ admin duyệt hoặc theo dõi.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#f1e1d6] bg-[#fffaf5] px-4 py-2 text-sm">
          <Filter className="h-4 w-4 text-[#b48a7a]" />
          <select
            className="bg-transparent text-sm focus:outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {QUOTATION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 shadow-sm">
          Đang tải dữ liệu...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 shadow-sm">
          Không có quotation nào.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((item) => {
            const statusMeta = getQuotationStatusMeta(item.status);
            return (
              <div
                key={item.quotationId}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-tet-primary">#{item.quotationId}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusMeta.badgeClass}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">Công ty: {item.company || "N/A"}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.requestDate).toLocaleString("vi-VN")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Tổng tiền</p>
                    <p className="font-semibold text-[#7a160e]">
                      {item.totalPrice ? `${item.totalPrice.toLocaleString("vi-VN")}đ` : "Chưa có"}
                    </p>
                  </div>
                  <Link
                    to={`/admin/quotations/${item.quotationId}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#7a160e] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5c0f09] transition"
                  >
                    <FileText className="h-4 w-4" />
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
