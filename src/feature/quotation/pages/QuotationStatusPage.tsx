import { CheckCircle2, Circle, Clock, FileText, Send, ShoppingBag, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { orderService, type OrderResponse } from "@/feature/checkout/services/orderService";
import { paymentService } from "@/feature/checkout/services/paymentService";
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

const formatMoney = (value?: number | null) => {
  if (typeof value !== "number") return "Chưa có";
  return `${value.toLocaleString("vi-VN")}đ`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN");
};

const PAID_ORDER_STATUSES = new Set([
  "CONFIRMED",
  "PAID_WAITING_STOCK",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
]);

export default function QuotationStatusPage() {
  const { id } = useParams();
  const location = useLocation();
  const state = (location.state || {}) as StatusState;
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<"accept" | "reject" | null>(null);
  const [decisionMessage, setDecisionMessage] = useState("");
  const [detail, setDetail] = useState<QuotationDetail | null>(null);
  const [linkedOrder, setLinkedOrder] = useState<OrderResponse | null>(null);
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [hasSuccessfulPayment, setHasSuccessfulPayment] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
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
    const loadPaymentState = async () => {
      const orderId = detail?.orderId;
      const shouldCheckPayment =
        detail?.status === "CONVERTED_TO_ORDER" && typeof orderId === "number";

      setLinkedOrder(null);
      setHasSuccessfulPayment(false);
      setPaymentChecked(false);

      if (!shouldCheckPayment) {
        setPaymentChecked(true);
        return;
      }

      try {
        const [orderResult, payments] = await Promise.all([
          orderService.getOrderById(orderId),
          paymentService.getPaymentsByOrder(orderId),
        ]);

        setLinkedOrder(orderResult);
        setHasSuccessfulPayment(
          payments.some((payment) => payment.status === "SUCCESS"),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setPaymentChecked(true);
      }
    };

    void loadPaymentState();
  }, [detail?.orderId, detail?.status]);

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
  const hasVatRequest = detail?.requireVatInvoice === true;
  const isOrderAlreadyPaid =
    hasSuccessfulPayment ||
    (linkedOrder?.status ? PAID_ORDER_STATUSES.has(linkedOrder.status) : false);
  const canPayConvertedOrder =
    currentStatus === "CONVERTED_TO_ORDER" &&
    typeof detail?.orderId === "number" &&
    paymentChecked &&
    !isOrderAlreadyPaid;

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

  const handlePayConvertedOrder = async () => {
    const orderId = detail?.orderId;
    if (typeof orderId !== "number") return;

    try {
      setPaymentSubmitting(true);
      setError(null);
      const paymentResponse = await paymentService.createPayment({
        orderId,
        paymentMethod: "VNPAY",
      });
      const paymentUrl = paymentResponse.paymentUrl || paymentResponse.paymentLink || "";

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      setError("Không nhận được đường dẫn thanh toán VNPay.");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể tạo thanh toán VNPay.");
    } finally {
      setPaymentSubmitting(false);
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
              {hasVatRequest && (
                <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Có VAT
                </div>
              )}
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

          <div className="mt-10 rounded-3xl border border-[#f1e1d6] bg-white p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">Thông tin yêu cầu</h3>
            <div className="mt-4 grid gap-3 text-sm text-[#7b5a4c] md:grid-cols-2">
              <div className="flex justify-between gap-4 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3">
                <span>Khách hàng</span>
                <span className="font-semibold text-[#4a0d06] text-right">{detail?.company || state.company || "Chưa cập nhật"}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3">
                <span>Email</span>
                <span className="font-semibold text-[#4a0d06] text-right">{detail?.email || state.email || "Chưa cập nhật"}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3">
                <span>Số điện thoại</span>
                <span className="font-semibold text-[#4a0d06] text-right">{detail?.phone || state.phone || "Chưa cập nhật"}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3">
                <span>Địa chỉ</span>
                <span className="font-semibold text-[#4a0d06] text-right">{detail?.address || state.address || "Chưa cập nhật"}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3">
                <span>Loại báo giá</span>
                <span className="font-semibold text-[#4a0d06] text-right">{detail?.quotationType || "Chưa có"}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3">
                <span>Lần chỉnh sửa</span>
                <span className="font-semibold text-[#4a0d06] text-right">{detail?.revision ?? 0}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3">
                <span>Ngày tạo</span>
                <span className="font-semibold text-[#4a0d06] text-right">{formatDate(detail?.requestDate)}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3">
                <span>Ngày gửi</span>
                <span className="font-semibold text-[#4a0d06] text-right">{formatDate(detail?.submittedAt)}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3 md:col-span-2">
                <span>Mã đơn hàng</span>
                <span className="font-semibold text-[#4a0d06] text-right">{detail?.orderId ?? "Chưa tạo"}</span>
              </div>
              <div className="rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a160e]/70">Ghi chú</p>
                <p className="mt-2 text-sm text-[#4a0d06]">
                  Ghi chú ngân sách: {detail?.desiredPriceNote || "Không có"}
                </p>
                <p className="mt-2 text-sm text-[#4a0d06]">
                  Ghi chú thêm: {detail?.note || "Không có"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-[#f1e1d6] bg-white p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">Danh sách sản phẩm</h3>
            <div className="mt-4 space-y-3 text-sm text-[#7b5a4c]">
              {detail?.lines && detail.lines.length > 0 ? (
                detail.lines.map((item) => (
                  <div
                    key={item.quotationItemId}
                    className="rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
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
                    <div className="mt-4 grid gap-2 rounded-2xl border border-[#ead8cc] bg-white p-3 text-xs text-[#7b5a4c]">
                      <div className="flex justify-between gap-4">
                        <span>Đơn giá</span>
                        <span className="font-semibold text-[#4a0d06]">{formatMoney(item.unitPrice)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Giá gốc</span>
                        <span className="font-semibold text-[#4a0d06]">{formatMoney(item.originalLineTotal)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Giảm trừ</span>
                        <span className="font-semibold text-emerald-700">{formatMoney(item.subtractTotal)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Cộng thêm</span>
                        <span className="font-semibold text-rose-700">{formatMoney(item.addTotal)}</span>
                      </div>
                      <div className="flex justify-between gap-4 border-t border-[#f1e1d6] pt-2">
                        <span>Thành tiền</span>
                        <span className="font-bold text-[#7a160e]">{formatMoney(item.finalLineTotal)}</span>
                      </div>
                    </div>
                    {item.fees && item.fees.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {item.fees.map((fee) => (
                          <div key={fee.quotationFeeId} className="flex items-center justify-between rounded-xl border border-[#ead8cc] bg-white px-3 py-2 text-xs">
                            <div>
                              <p className={`font-semibold ${fee.isSubtracted === 1 ? "text-rose-700" : "text-emerald-700"}`}>
                                {fee.isSubtracted === 1 ? "Cộng thêm" : "Giảm trừ"}
                              </p>
                              <p className="mt-1 text-[#8a5b4f]">{fee.description || "Không có mô tả"}</p>
                            </div>
                            <span className={`font-bold ${fee.isSubtracted === 1 ? "text-rose-700" : "text-emerald-700"}`}>
                              {fee.isSubtracted === 1 ? "+" : "-"}{formatMoney(fee.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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

          {detail && (
            <div className={`mt-6 grid gap-6 ${hasVatRequest ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
              <div className="rounded-3xl border border-[#f1e1d6] bg-white p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">Tổng thanh toán dự kiến</h3>
                <div className="mt-4 space-y-3 text-sm text-[#7b5a4c]">
                  <div className="flex justify-between gap-4">
                    <span>Tổng gốc</span>
                    <span className="font-semibold text-[#4a0d06]">{formatMoney(detail.totalOriginal)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Tổng giảm trừ</span>
                    <span className="font-semibold text-emerald-700">{formatMoney(detail.totalSubtract)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Tổng cộng thêm</span>
                    <span className="font-semibold text-rose-700">{formatMoney(detail.totalAdd)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Trước VAT</span>
                    <span className="font-semibold text-[#4a0d06]">{formatMoney(detail.totalAfterDiscount)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>VAT dự kiến</span>
                    <span className="font-semibold text-[#4a0d06]">{formatMoney(detail.vatAmountPreview)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-[#f1e1d6] pt-3 text-[#7a160e]">
                    <span>Thanh toán gồm VAT</span>
                    <span className="font-bold">{formatMoney(detail.finalPayablePreview)}</span>
                  </div>
                </div>
              </div>

              {hasVatRequest && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800/80">Thông tin VAT</h3>
                  <div className="mt-4 space-y-3 text-sm text-amber-900">
                    <div className="flex justify-between gap-4">
                      <span>Công ty</span>
                      <span className="font-semibold text-right">{detail.vatCompanyName || "-"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Mã số thuế</span>
                      <span className="font-semibold text-right">{detail.vatCompanyTaxCode || "-"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Địa chỉ</span>
                      <span className="font-semibold text-right">{detail.vatCompanyAddress || "-"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Email xác thực VAT</span>
                      <span className="font-semibold text-right">{detail.vatInvoiceEmail || "-"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
                to={detail?.orderId ? `/account/orders/${detail.orderId}` : "/account/orders"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <ShoppingBag className="h-4 w-4" />
                {detail?.orderId ? `Xem đơn hàng #${detail.orderId}` : "Xem đơn hàng của tôi"}
              </Link>
            )}
            {canPayConvertedOrder && (
              <button
                type="button"
                onClick={handlePayConvertedOrder}
                disabled={paymentSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7a160e] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7a160e]/20 transition hover:bg-[#5c0f09] disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" />
                {paymentSubmitting ? "Đang tạo thanh toán..." : "Thanh toán VNPay"}
              </button>
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







