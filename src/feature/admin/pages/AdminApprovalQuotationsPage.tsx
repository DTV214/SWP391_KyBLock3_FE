import { useEffect, useMemo, useState } from "react";
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

const PAGE_SIZE = 5;

const mergeQuotationRows = (...groups: QuotationSummary[][]) => {
  const rowMap = new Map<number, QuotationSummary>();

  groups.flat().forEach((item) => {
    if (!item || item.status === "DRAFT") return;
    rowMap.set(item.quotationId, item);
  });

  return Array.from(rowMap.values()).sort(
    (a, b) =>
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime(),
  );
};

export default function AdminApprovalQuotationsPage() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<QuotationSummary[]>([]);
  const [allRows, setAllRows] = useState<QuotationSummary[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = QUOTATION_STATUS_OPTIONS.filter(
    (option) => option.value !== "DRAFT",
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [staffResponse, adminResponse] = await Promise.all([
          quotationService.getStaffQuotations(),
          quotationService.getAdminQuotations(),
        ]);

        const mergedRows = mergeQuotationRows(
          (staffResponse?.data || []) as QuotationSummary[],
          (adminResponse?.data || []) as QuotationSummary[],
        );

        const counts = mergedRows.reduce<Record<string, number>>((acc, item) => {
          acc[item.status] = (acc[item.status] ?? 0) + 1;
          return acc;
        }, {});

        setAllRows(mergedRows);
        setStatusCounts(counts);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách báo giá cho quản trị viên.");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  useEffect(() => {
    setRows(status ? allRows.filter((item) => item.status === status) : allRows);
  }, [allRows, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
    [rows],
  );

  const paginatedRows = useMemo(
    () =>
      rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, rows],
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
          <h1 className="text-2xl font-bold text-tet-primary">Báo giá</h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách báo giá dành cho quản trị viên theo dõi, rà soát phí và phê duyệt.
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
                    {option.value ? (statusCounts[option.value] ?? 0) : allRows.length}
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
          Không có báo giá nào.
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedRows.map((item) => {
            const statusMeta = getQuotationStatusMeta(item.status);
            const displayTotal = item.requireVatInvoice
              ? item.finalPayablePreview
              : item.totalPrice;
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
                    {item.requireVatInvoice && (
                      <span className="text-xs px-2 py-1 rounded-full border border-amber-200 bg-amber-50 font-semibold text-amber-700">
                        Có VAT
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    Khách hàng: {item.company || "Không có"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.requestDate).toLocaleString("vi-VN")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.requireVatInvoice && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tổng gồm VAT</p>
                      <p className="font-semibold text-[#7a160e]">
                        {typeof displayTotal === "number"
                          ? `${displayTotal.toLocaleString("vi-VN")}đ`
                          : "Chưa có"}
                      </p>
                    </div>
                  )}
                  <div className={`text-right ${item.requireVatInvoice ? "hidden" : ""}`}>
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
