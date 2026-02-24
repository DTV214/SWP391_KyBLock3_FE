import { CheckCircle2, Circle, Clock, FileText, Send, ShoppingBag, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  quotationService,
  type QuotationDetail,
  type QuotationProductDetail,
} from "@/feature/quotation/services/quotationService";
import { getQuotationStatusMeta } from "@/feature/quotation/utils/quotationStatus";

type StatusState = {
  quotationId?: number;
  status?: string;
  company?: string;
  address?: string;
  email?: string;
  phone?: string;
  items?: Array<{ productname: string; sku?: string | null; quantity: number }>;
};

const statusSteps = [
  { key: "DRAFT", label: "Nháp", sub: "Chưa gửi" },
  { key: "SUBMITTED", label: "Đã gửi", sub: "Chờ staff" },
  { key: "STAFF_REVIEWING", label: "Đang xử lý", sub: "Đang review" },
  { key: "WAITING_CUSTOMER", label: "Chờ khách", sub: "Chờ phản hồi" },
  { key: "CUSTOMER_ACCEPTED", label: "Đã xác nhận", sub: "Chờ tạo đơn" },
  { key: "CONVERTED_TO_ORDER", label: "Đã tạo đơn", sub: "Hoàn tất" },
];

const statusIndexMap: Record<string, number> = {
  DRAFT: 0,
  SUBMITTED: 1,
  STAFF_REVIEWING: 2,
  WAITING_ADMIN: 2,
  ADMIN_REJECTED: 2,
  WAITING_CUSTOMER: 3,
  CUSTOMER_REJECTED: 3,
  CUSTOMER_ACCEPTED: 4,
  CONVERTED_TO_ORDER: 5,
  CANCELLED: 0,
};

export default function QuotationStatusPage() {
  const { id } = useParams();
  const location = useLocation();
  const state = (location.state || {}) as StatusState;
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<"accept" | "reject" | null>(null);
  const [decisionMessage, setDecisionMessage] = useState("");
  const [detail, setDetail] = useState<QuotationDetail | null>(null);
  const [productImageMap, setProductImageMap] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await quotationService.getQuotationById(id);
      setDetail(response?.data || null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải chi tiết báo giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    const fetchProductImages = async () => {
      if (!detail?.lines?.length) return;
      const ids = Array.from(new Set(detail.lines.map((line) => line.productId))).filter((pid) => !productImageMap[pid]);
      if (ids.length === 0) return;
      const entries = await Promise.all(ids.map(async (pid) => {
        try {
          const res = await quotationService.getProductById(pid);
          const product = res?.data as QuotationProductDetail | undefined;
          return [pid, product?.imageUrl || ""] as const;
        } catch {
          return [pid, ""] as const;
        }
      }));
      setProductImageMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };
    fetchProductImages();
  }, [detail]);

  const currentStatus = detail?.status || state.status || "DRAFT";
  const currentIndex = statusIndexMap[currentStatus] ?? 0;
  const statusMeta = getQuotationStatusMeta(currentStatus);

  const fallbackItems = useMemo(() => state.items || [], [state.items]);

  const handleSubmitToStaff = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      setError(null);
      await quotationService.submitQuotation(id);
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể gửi quotation cho staff.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerAccept = async () => {
    if (!id) return;
    try {
      setDecisionLoading("accept");
      setError(null);
      await quotationService.customerAcceptQuotation(id, {
        message: decisionMessage.trim() || undefined,
      });
      setDecisionMessage("");
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể xác nhận báo giá.");
    } finally {
      setDecisionLoading(null);
    }
  };

  const handleCustomerReject = async () => {
    if (!id) return;
    try {
      setDecisionLoading("reject");
      setError(null);
      await quotationService.customerRejectQuotation(id, {
        message: decisionMessage.trim() || undefined,
      });
      setDecisionMessage("");
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể từ chối báo giá.");
    } finally {
      setDecisionLoading(null);
    }
  };

  return (
    <div className="bg-[#FBF5E8]/40 text-[#4a0d06] min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="rounded-3xl border border-[#f1e1d6] bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Chi tiết yêu cầu báo giá</h1>
            <p className="mt-2 text-sm text-[#7b5a4c]">
              Quotation tạo từ trang create ban đầu ở trạng thái DRAFT. Bấm "Gửi cho staff" để chuyển sang SUBMITTED.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-[#f1e1d6] bg-[#fff7ee] px-4 py-2 text-sm font-semibold text-[#7a160e]">
                Mã yêu cầu: Q-{id || state.quotationId}
              </div>
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}>
                {statusMeta.label}
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-[#f1e1d6] bg-[#fffaf5] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">Trạng thái yêu cầu</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {statusSteps.map((step, index) => {
                const isActive = index <= currentIndex;
                return (
                  <div key={step.key} className="text-center">
                    <div
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border ${
                        isActive ? "bg-[#7a160e] border-[#7a160e] text-white" : "bg-white text-[#b48a7a] border-[#f1e1d6]"
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <p className={`mt-3 text-xs font-semibold ${isActive ? "text-[#4a0d06]" : "text-[#8a5b4f]"}`}>{step.label}</p>
                    <p className="text-[11px] text-[#8a5b4f]">{step.sub}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-[#e5efe9] bg-[#f4fbf6] px-4 py-3 text-xs text-[#4c7b5a]">
              <Clock className="h-4 w-4" />
              Sau khi bạn gửi staff, hệ thống sẽ bắt đầu xử lý (SUBMITTED).
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">Thông tin yêu cầu</h3>
              <div className="mt-4 space-y-3 text-sm text-[#7b5a4c]">
                <div className="flex justify-between gap-4">
                  <span>Công ty</span>
                  <span className="font-semibold text-[#4a0d06] text-right">{detail?.company || state.company || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Email</span>
                  <span className="font-semibold text-[#4a0d06] text-right">{detail?.email || state.email || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Số điện thoại</span>
                  <span className="font-semibold text-[#4a0d06] text-right">{detail?.phone || state.phone || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Địa chỉ</span>
                  <span className="font-semibold text-[#4a0d06] text-right">{detail?.address || state.address || "Chưa cập nhật"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">Danh sách sản phẩm</h3>
              <div className="mt-4 space-y-3 text-sm text-[#7b5a4c]">
                {detail?.lines && detail.lines.length > 0 ? (
                  detail.lines.map((item) => (
                    <div
                      key={item.quotationItemId}
                      className="flex items-center justify-between rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#f1e1d6]">
                          {productImageMap[item.productId] ? (
                            <img src={productImageMap[item.productId]} alt={item.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8a5b4f]">No image</div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#4a0d06]">{item.productName}</p>
                          <p className="text-xs text-[#8a5b4f]">{item.sku ? `Mã SP: ${item.sku}` : "Mã SP: N/A"}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold">Số lượng: {item.quantity}</span>
                    </div>
                  ))
                ) : fallbackItems.length > 0 ? (
                  fallbackItems.map((item, index) => (
                    <div
                      key={`${item.productname}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-[#4a0d06]">{item.productname}</p>
                        <p className="text-xs text-[#8a5b4f]">{item.sku ? `Mã SP: ${item.sku}` : "Mã SP: N/A"}</p>
                      </div>
                      <span className="text-xs font-semibold">Số lượng: {item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#f1e1d6] p-4 text-center text-xs text-[#8a5b4f]">
                    Không có dữ liệu sản phẩm.
                  </div>
                )}
              </div>
            </div>
          </div>

          {currentStatus === "DRAFT" && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Bạn đang xem bản nháp quotation. Bạn cần bấm "Gửi cho staff" để chuyển trạng thái sang SUBMITTED.
            </div>
          )}

          {currentStatus === "WAITING_CUSTOMER" && (
            <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-indigo-800">Báo giá đã được admin duyệt. Bạn chọn phản hồi:</p>
              <textarea
                value={decisionMessage}
                onChange={(e) => setDecisionMessage(e.target.value)}
                rows={3}
                placeholder="Nhập ghi chú phản hồi (tuỳ chọn)"
                className="mt-2 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCustomerAccept}
                  disabled={decisionLoading !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {decisionLoading === "accept" ? "Đang xác nhận..." : "Đồng ý báo giá"}
                </button>
                <button
                  type="button"
                  onClick={handleCustomerReject}
                  disabled={decisionLoading !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  {decisionLoading === "reject" ? "Đang từ chối..." : "Từ chối báo giá"}
                </button>
              </div>
            </div>
          )}

          {currentStatus === "CUSTOMER_REJECTED" && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Bạn đã từ chối báo giá. Yêu cầu đã được gửi lại cho staff để điều chỉnh.
            </div>
          )}

          {currentStatus === "CUSTOMER_ACCEPTED" && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Bạn đã đồng ý báo giá. Hệ thống sẽ tạo đơn hàng theo cấu hình.
            </div>
          )}

          {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</div>}

          {loading && (
            <div className="mt-6 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3 text-xs text-[#7b5a4c]">
              Đang tải chi tiết báo giá...
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {currentStatus === "DRAFT" && (
              <button
                type="button"
                onClick={handleSubmitToStaff}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7a160e] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7a160e]/20 transition hover:bg-[#5c0f09] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Đang gửi..." : "Gửi cho staff"}
              </button>
            )}
            {(currentStatus === "CONVERTED_TO_ORDER" || currentStatus === "CUSTOMER_ACCEPTED") && (
              <Link
                to="/account/orders"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <ShoppingBag className="h-4 w-4" />
                Xem đơn hàng của tôi
              </Link>
            )}
            <Link
              to="/quotation/history"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d7b8a5] bg-white px-6 py-3 text-sm font-semibold text-[#7a160e] transition hover:bg-[#fff7ee]"
            >
              <FileText className="h-4 w-4" />
              Về lịch sử báo giá
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}







