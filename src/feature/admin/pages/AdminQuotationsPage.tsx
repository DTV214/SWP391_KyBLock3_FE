import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Check, ChevronDown, FileText, Filter } from "lucide-react";
import {
  quotationService,
  type QuotationSummary,
} from "@/feature/quotation/services/quotationService";
import {
  QUOTATION_STATUS_OPTIONS,
  getQuotationStatusMeta,
} from "@/feature/quotation/utils/quotationStatus";

export default function AdminQuotationsPage() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedStatusLabel =
    QUOTATION_STATUS_OPTIONS.find((option) => option.value === status)?.label || "Tất cả trạng thái";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await quotationService.getStaffQuotations(status || undefined);
        setRows(response?.data || []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách quotation cho staff.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!statusDropdownRef.current) return;
      if (!statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectStatus = (value: string) => {
    setStatus(value);
    setIsStatusOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tet-primary">Reviewing Quotations</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách quotation dành cho staff review và chỉnh phí.</p>
        </div>

        <div ref={statusDropdownRef} className="relative min-w-[220px]">
          <button
            type="button"
            onClick={() => setIsStatusOpen((prev) => !prev)}
            className="flex h-10 w-full items-center gap-2.5 rounded-full border border-[#ead6c9] bg-[#fffaf5] px-4 text-left shadow-sm transition hover:border-[#dcb9a5]"
          >
            <Filter className="h-3.5 w-3.5 text-[#b07b61]" />
            <span className="min-w-0 flex-1 truncate text-base font-semibold text-[#4a0d06]">{selectedStatusLabel}</span>
            <ChevronDown
              className={`h-4 w-4 text-[#3d2a1d] transition-transform ${isStatusOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isStatusOpen && (
            <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#e8d4c8] bg-white shadow-lg">
              <div className="max-h-72 overflow-auto py-1">
                {QUOTATION_STATUS_OPTIONS.map((option) => {
                  const active = option.value === status;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectStatus(option.value)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm transition ${
                        active ? "bg-[#7a160e] text-white" : "text-[#5b2817] hover:bg-[#fff3ea]"
                      }`}
                    >
                      <span>{option.label}</span>
                      {active && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
                    to={`/admin/reviewing-quotations/${item.quotationId}`}
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
