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
  const PAGE_SIZE = 5;
  const [status, setStatus] = useState("WAITING_ADMIN");
  const [rows, setRows] = useState<QuotationSummary[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const statusOptions = QUOTATION_STATUS_OPTIONS.filter(
    (option) => option.value !== "" && option.value !== "DRAFT",
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [filteredResponse, allResponse] = await Promise.all([
          quotationService.getAdminQuotations(status || undefined),
          quotationService.getAdminQuotations(),
        ]);

        setRows((filteredResponse?.data || []) as QuotationSummary[]);

        const allRows = ((allResponse?.data || []) as QuotationSummary[]).filter(
          (item) => item.status !== "DRAFT",
        );
        const counts = allRows.reduce<Record<string, number>>((acc, item) => {
          acc[item.status] = (acc[item.status] ?? 0) + 1;
          return acc;
        }, {});
        setStatusCounts(counts);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách quotation cho admin.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginatedRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tet-primary">Quotations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách quotation chờ admin duyệt hoặc theo dõi.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#7a160e]">
            <Filter className="h-3.5 w-3.5" />
            Bộ lọc trạng thái
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const active = option.value === status;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-[#7a160e] bg-[#7a160e] text-white shadow-sm"
                      : "border-[#e8d4c8] bg-[#fffaf5] text-[#5b2817] hover:border-[#dcb9a5]"
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white border border-[#e8d4c8] text-[#7a160e]"
                    }`}
                  >
                    {statusCounts[option.value] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 shadow-sm">
          Đang tải dữ liệu...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 shadow-sm">
          Không có quotation nào.
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedRows.map((item) => {
            const statusMeta = getQuotationStatusMeta(item.status);
            return (
              <div
                key={item.quotationId}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-tet-primary">
                      #{item.quotationId}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Công ty: {item.company || "N/A"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.requestDate).toLocaleString("vi-VN")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Tổng tiền</p>
                    <p className="font-semibold text-[#7a160e]">
                      {item.totalPrice
                        ? `${item.totalPrice.toLocaleString("vi-VN")}đ`
                        : "Chưa có"}
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-10 w-10 rounded-sm border border-[#d7b8a5] bg-[#fffaf5] text-sm font-bold text-[#7a160e] transition hover:bg-[#f7ecdf] disabled:opacity-40"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                const active = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 w-10 rounded-sm border text-sm font-bold transition ${
                      active
                        ? "border-[#7a160e] bg-[#7a160e] text-white"
                        : "border-[#d7b8a5] bg-[#fffaf5] text-[#7a160e] hover:bg-[#f7ecdf]"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="h-10 w-10 rounded-sm border border-[#d7b8a5] bg-[#fffaf5] text-sm font-bold text-[#7a160e] transition hover:bg-[#f7ecdf] disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
