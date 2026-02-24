import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ScrollText,
  User,
  XCircle,
} from "lucide-react";
import {
  quotationService,
  type QuotationDetail,
  type QuotationProductDetail,
} from "@/feature/quotation/services/quotationService";
import { getQuotationStatusMeta } from "@/feature/quotation/utils/quotationStatus";

const formatMoney = (value?: number | null) => {
  if (typeof value !== "number") return "Chưa có";
  return `${value.toLocaleString("vi-VN")}đ`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

const getRoleBadgeClass = (role?: string | null) => {
  switch (role) {
    case "STAFF":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "ADMIN":
      return "bg-violet-100 text-violet-800 border border-violet-200";
    case "CUSTOMER":
      return "bg-sky-100 text-sky-800 border border-sky-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getActionBadgeClass = (action?: string | null) => {
  switch (action) {
    case "SEND_ADMIN":
      return "bg-violet-50 text-violet-700";
    case "APPROVE":
      return "bg-emerald-50 text-emerald-700";
    case "REJECT":
      return "bg-red-50 text-red-700";
    case "NOTE":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function AdminApprovalQuotationDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittingApprove, setSubmittingApprove] = useState(false);
  const [submittingReject, setSubmittingReject] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState("");
  const [productImageMap, setProductImageMap] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await quotationService.getAdminQuotationById(id);
      setDetail((response?.data || null) as QuotationDetail | null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải chi tiết quotation cho admin.");
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

  const statusMeta = getQuotationStatusMeta(detail?.status);
  const canDecide = detail?.status === "WAITING_ADMIN";

  const totalQuantity = useMemo(() => {
    if (!detail?.lines) return 0;
    return detail.lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
  }, [detail]);

  const handleApprove = async () => {
    if (!id) return;
    try {
      setSubmittingApprove(true);
      setError(null);
      await quotationService.approveAdminQuotation(id, {
        message: decisionMessage.trim() || undefined,
      });
      setDecisionMessage("");
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể approve quotation.");
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      setSubmittingReject(true);
      setError(null);
      await quotationService.rejectAdminQuotation(id, {
        message: decisionMessage.trim() || undefined,
      });
      setDecisionMessage("");
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể reject quotation.");
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tet-primary">Quotation #{id}</h1>
          <p className="text-sm text-gray-500 mt-1">Trang admin duyệt báo giá gửi cho khách hàng.</p>
        </div>
        <Link
          to="/admin/quotations"
          className="inline-flex items-center gap-2 rounded-full border border-[#d7b8a5] bg-white px-4 py-2 text-xs font-semibold text-[#7a160e]"
        >
          <FileText className="h-4 w-4" />
          Về danh sách
        </Link>
      </div>

      {canDecide && (
        <div className="bg-white rounded-2xl border border-violet-200 p-4 shadow-sm">
          <p className="text-sm font-semibold text-violet-800">Quyết định của admin</p>
          <textarea
            value={decisionMessage}
            onChange={(e) => setDecisionMessage(e.target.value)}
            placeholder="Nhập ghi chú gửi khách/staff (tuỳ chọn)"
            rows={3}
            className="mt-2 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={submittingApprove || submittingReject}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submittingApprove ? "Đang duyệt..." : "Approve gửi khách"}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={submittingApprove || submittingReject}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              {submittingReject ? "Đang từ chối..." : "Reject trả staff"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 shadow-sm">
          Đang tải dữ liệu...
        </div>
      ) : !detail ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 shadow-sm">
          Không tìm thấy quotation.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-5 shadow-sm ${statusMeta.badgeClass}`}>
              <p className="text-xs opacity-80">Trạng thái</p>
              <p className="text-lg font-semibold mt-1">{statusMeta.label}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500">Loại quotation</p>
              <p className="text-lg font-semibold text-[#7a160e] mt-1">{detail.quotationType}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 shadow-sm">
              <p className="text-xs text-blue-700">Tổng số lượng</p>
              <p className="text-lg font-semibold text-blue-800 mt-1">{totalQuantity}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 shadow-sm">
              <p className="text-xs text-emerald-700">Tổng tiền sau phí</p>
              <p className="text-lg font-semibold text-emerald-800 mt-1">{formatMoney(detail.totalAfterDiscount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
            <div className="space-y-4 self-start">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a160e]/80">Thông tin khách hàng</h3>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><Building className="h-4 w-4 text-gray-500" />Công ty: <span className="font-semibold">{detail.company || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" />Email: <span className="font-semibold">{detail.email || "N/A"}</span></div>
                  <p>Số điện thoại: <span className="font-semibold">{detail.phone || "N/A"}</span></p>
                  <p>Địa chỉ: <span className="font-semibold">{detail.address || "N/A"}</span></p>
                  <p>Account ID: <span className="font-semibold">{detail.accountId ?? "-"}</span></p>
                  <p>Order ID: <span className="font-semibold">{detail.orderId ?? "-"}</span></p>
                  <p>Revision: <span className="font-semibold">{detail.revision}</span></p>
                  <p>Staff reviewer: <span className="font-semibold">{detail.staffReviewerId ?? "-"}</span></p>
                  <p>Admin reviewer: <span className="font-semibold">{detail.adminReviewerId ?? "-"}</span></p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Ngày tạo: {formatDate(detail.requestDate)}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Ngày submit: {formatDate(detail.submittedAt)}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Staff review: {formatDate(detail.staffReviewedAt)}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Admin review: {formatDate(detail.adminReviewedAt)}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Khách phản hồi: {formatDate(detail.customerRespondedAt)}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a160e]/80">Tổng hợp giá</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <p>Tổng gốc: <span className="font-semibold">{formatMoney(detail.totalOriginal)}</span></p>
                  <p>Tổng giảm trừ: <span className="font-semibold text-emerald-700">{formatMoney(detail.totalSubtract)}</span></p>
                  <p>Tổng cộng thêm: <span className="font-semibold text-rose-700">{formatMoney(detail.totalAdd)}</span></p>
                  <p>Discount amount: <span className="font-semibold">{formatMoney(detail.totalDiscountAmount)}</span></p>
                  <p className="pt-2 border-t border-gray-100">Sau điều chỉnh: <span className="font-semibold text-[#7a160e]">{formatMoney(detail.totalAfterDiscount)}</span></p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                  <p>Ghi chú ngân sách: {detail.desiredPriceNote || "-"}</p>
                  <p>Ghi chú thêm: {detail.note || "-"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a160e]/80">Danh sách sản phẩm và phí (read-only)</h3>
                <div className="mt-4 space-y-4">
                  {detail.lines?.map((line) => (
                    <div key={line.quotationItemId} className="rounded-xl border border-[#f1e1d6] bg-[#fffaf5] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#f1e1d6]">
                            {productImageMap[line.productId] ? (
                              <img src={productImageMap[line.productId]} alt={line.productName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8a5b4f]">No image</div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#4a0d06]">{line.productName}</p>
                            <p className="text-xs text-[#8a5b4f]">{line.sku || "N/A"}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <p>Số lượng: {line.quantity}</p>
                          <p>Đơn giá: {formatMoney(line.unitPrice)}</p>
                          <p>Gốc: {formatMoney(line.originalLineTotal)}</p>
                          <p className="text-emerald-700">Giảm trừ: {formatMoney(line.subtractTotal)}</p>
                          <p className="text-rose-700">Cộng thêm: {formatMoney(line.addTotal)}</p>
                          <p className="font-semibold text-[#7a160e]">Thành tiền: {formatMoney(line.finalLineTotal)}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-[#ead8cc] bg-white p-3">
                        <p className="text-xs font-semibold text-[#7a160e]">Danh sách phí</p>
                        {line.fees && line.fees.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {line.fees.map((fee) => (
                              <div key={fee.quotationFeeId} className="rounded-lg border border-gray-100 p-2">
                                <p className={`text-xs font-semibold ${fee.isSubtracted === 1 ? "text-rose-700" : "text-emerald-700"}`}>
                                  {fee.isSubtracted === 1 ? "Cộng thêm" : "Giảm trừ"}: {formatMoney(fee.price)}
                                </p>
                                <p className="text-xs text-gray-500">{fee.description || "Không có mô tả"}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mt-2">Chưa có phí cho sản phẩm này.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a160e]/80 flex items-center gap-2">
                  <ScrollText className="h-4 w-4" />
                  Lịch sử trao đổi
                </h3>
                {detail.messages && detail.messages.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {detail.messages.map((msg) => (
                      <div key={msg.quotationMessageId} className="rounded-lg border border-[#f1e1d6] bg-[#fffaf5] p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${getRoleBadgeClass(msg.fromRole)}`}>{msg.fromRole}</span>
                          <span className={`rounded-full px-2 py-0.5 ${getActionBadgeClass(msg.actionType)}`}>{msg.actionType}</span>
                          <span>#{msg.fromAccountId ?? "-"}</span>
                          <span>{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-gray-700">{msg.message}</p>
                        {msg.metaJson && <p className="mt-1 text-xs text-gray-500 break-all">Meta: {msg.metaJson}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">Chưa có lịch sử trao đổi.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}





