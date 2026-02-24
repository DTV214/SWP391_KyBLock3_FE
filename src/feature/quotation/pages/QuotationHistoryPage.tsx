import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, FileText, Filter, Send } from "lucide-react";
import {
  quotationService,
  type QuotationSummary,
} from "@/feature/quotation/services/quotationService";
import {
  QUOTATION_STATUS_OPTIONS,
  getQuotationStatusMeta,
} from "@/feature/quotation/utils/quotationStatus";

export default function QuotationHistoryPage() {
  const [status, setStatus] = useState("");
  const [data, setData] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchData = async (statusValue?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await quotationService.getMyQuotations(statusValue || undefined);
      setData(response?.data || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải lịch sử báo giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(status);
  }, [status]);

  const rows = useMemo(() => data, [data]);

  const handleSubmitQuotation = async (quotationId: number) => {
    try {
      setSubmittingId(quotationId);
      await quotationService.submitQuotation(quotationId);
      await fetchData(status);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể gửi quotation cho staff.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="bg-[#FBF5E8]/40 text-[#4a0d06] min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-[#f1e1d6] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lịch sử báo giá</h1>
            <p className="mt-2 text-sm text-[#7b5a4c]">Theo dõi tất cả yêu cầu báo giá của bạn.</p>
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

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-8 text-center text-sm text-[#7b5a4c]">
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-8 text-center text-sm text-[#7b5a4c]">
              Chưa có yêu cầu báo giá nào.
            </div>
          ) : (
            rows.map((item) => {
              const statusMeta = getQuotationStatusMeta(item.status);
              return (
                <div
                  key={item.quotationId}
                  className="flex flex-col gap-4 rounded-3xl border border-[#f1e1d6] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">#{item.quotationId}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#7b5a4c]">
                      Công ty: <span className="font-semibold">{item.company || "N/A"}</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#8a5b4f]">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.requestDate).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="text-xs text-[#8a5b4f]">Ước tính</p>
                      <p className="text-lg font-semibold text-[#7a160e]">
                        {item.totalPrice ? `${item.totalPrice.toLocaleString("vi-VN")}đ` : "Chưa có"}
                      </p>
                    </div>
                    {item.status === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => handleSubmitQuotation(item.quotationId)}
                        disabled={submittingId === item.quotationId}
                        className="inline-flex items-center gap-2 rounded-full border border-[#7a160e] px-4 py-2 text-xs font-semibold text-[#7a160e] transition hover:bg-[#fff7ee] disabled:opacity-60"
                      >
                        <Send className="h-4 w-4" />
                        {submittingId === item.quotationId ? "Đang gửi" : "Gửi staff"}
                      </button>
                    )}
                    <Link
                      to={`/quotation/status/${item.quotationId}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#7a160e] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5c0f09]"
                    >
                      <FileText className="h-4 w-4" />
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
