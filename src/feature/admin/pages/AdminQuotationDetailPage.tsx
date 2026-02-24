import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  FileText,
  PlayCircle,
  Plus,
  Pencil,
  Trash2,
  Save,
  Send,
  X,
  User,
  Building,
  ScrollText,
} from "lucide-react";
import {
  quotationService,
  type QuotationDetail,
  type QuotationFee,
  type QuotationProductDetail,
} from "@/feature/quotation/services/quotationService";
import { getQuotationStatusMeta } from "@/feature/quotation/utils/quotationStatus";

type FeeFormState = {
  isSubtracted: number;
  price: string;
  description: string;
};

const defaultFeeForm: FeeFormState = {
  isSubtracted: 1,
  price: "",
  description: "",
};

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
    case "SUBMIT":
      return "bg-blue-50 text-blue-700";
    case "START_REVIEW":
      return "bg-amber-50 text-amber-700";
    case "SEND_ADMIN":
      return "bg-violet-50 text-violet-700";
    case "NOTE":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function AdminQuotationDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingReview, setStartingReview] = useState(false);
  const [sendingAdmin, setSendingAdmin] = useState(false);
  const [sendAdminMessage, setSendAdminMessage] = useState("");
  const [feeLoading, setFeeLoading] = useState<Record<number, boolean>>({});
  const [feeSubmitting, setFeeSubmitting] = useState<Record<number, boolean>>({});
  const [feesByItem, setFeesByItem] = useState<Record<number, QuotationFee[]>>({});
  const [newFeeForms, setNewFeeForms] = useState<Record<number, FeeFormState>>({});
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null);
  const [editFeeForm, setEditFeeForm] = useState<FeeFormState>(defaultFeeForm);
  const [productImageMap, setProductImageMap] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchFeesForItem = async (quotationItemId: number) => {
    if (!id) return;
    try {
      setFeeLoading((prev) => ({ ...prev, [quotationItemId]: true }));
      const response = await quotationService.getStaffItemFees(id, quotationItemId);
      const feeData = (response?.data || []) as QuotationFee[];
      setFeesByItem((prev) => ({ ...prev, [quotationItemId]: feeData }));
      setNewFeeForms((prev) => ({
        ...prev,
        [quotationItemId]: prev[quotationItemId] || { ...defaultFeeForm },
      }));
    } catch (err) {
      console.error(err);
      setError(`Không thể tải phí cho item #${quotationItemId}.`);
    } finally {
      setFeeLoading((prev) => ({ ...prev, [quotationItemId]: false }));
    }
  };

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await quotationService.getStaffQuotationById(id);
      const nextDetail = (response?.data || null) as QuotationDetail | null;
      setDetail(nextDetail);

      if (nextDetail?.lines?.length) {
        await Promise.all(nextDetail.lines.map((line) => fetchFeesForItem(line.quotationItemId)));
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải chi tiết quotation.");
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

  const canStartReview = detail?.status === "SUBMITTED";
  const canSendAdmin = detail?.status === "STAFF_REVIEWING";
  const statusMeta = getQuotationStatusMeta(detail?.status);

  const totalQuantity = useMemo(() => {
    if (!detail?.lines) return 0;
    return detail.lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
  }, [detail]);

  const handleStartReview = async () => {
    if (!id) return;
    try {
      setStartingReview(true);
      setError(null);
      await quotationService.startStaffReview(id);
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể bắt đầu review quotation.");
    } finally {
      setStartingReview(false);
    }
  };

  const handleSendToAdmin = async () => {
    if (!id) return;
    try {
      setSendingAdmin(true);
      setError(null);
      await quotationService.sendStaffQuotationToAdmin(id, sendAdminMessage.trim() || undefined);
      setSendAdminMessage("");
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể gửi quotation cho admin.");
    } finally {
      setSendingAdmin(false);
    }
  };

  const handleCreateFee = async (quotationItemId: number) => {
    if (!id) return;
    const form = newFeeForms[quotationItemId] || defaultFeeForm;
    const price = Number(form.price);
    if (!price || price <= 0) {
      setError("Giá phí phải lớn hơn 0.");
      return;
    }

    try {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: true }));
      setError(null);
      await quotationService.createStaffFee(id, {
        quotationItemId,
        isSubtracted: form.isSubtracted,
        price,
        description: form.description,
      });
      setNewFeeForms((prev) => ({ ...prev, [quotationItemId]: { ...defaultFeeForm } }));
      await fetchFeesForItem(quotationItemId);
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể tạo phí.");
    } finally {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: false }));
    }
  };

  const openEditFee = (fee: QuotationFee) => {
    setEditingFeeId(fee.quotationFeeId);
    setEditFeeForm({
      isSubtracted: fee.isSubtracted,
      price: String(fee.price),
      description: fee.description || "",
    });
  };

  const handleUpdateFee = async (quotationItemId: number, fee: QuotationFee) => {
    if (!id) return;
    const price = Number(editFeeForm.price);
    if (!price || price <= 0) {
      setError("Giá phí phải lớn hơn 0.");
      return;
    }

    try {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: true }));
      setError(null);
      await quotationService.updateStaffFee(id, fee.quotationFeeId, {
        quotationFeeId: fee.quotationFeeId,
        isSubtracted: editFeeForm.isSubtracted,
        price,
        description: editFeeForm.description,
      });
      setEditingFeeId(null);
      setEditFeeForm({ ...defaultFeeForm });
      await fetchFeesForItem(quotationItemId);
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể cập nhật phí.");
    } finally {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: false }));
    }
  };

  const handleDeleteFee = async (quotationItemId: number, feeId: number) => {
    if (!id) return;
    if (!confirm("Bạn có chắc muốn xóa phí này?")) return;

    try {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: true }));
      setError(null);
      await quotationService.deleteStaffFee(id, feeId);
      await fetchFeesForItem(quotationItemId);
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể xóa phí.");
    } finally {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tet-primary">Reviewing Quotation #{id}</h1>
          <p className="text-sm text-gray-500 mt-1">Trang staff review và chỉnh phí trước khi gửi admin.</p>
        </div>
        <div className="flex items-center gap-2">
          {canStartReview && (
            <button
              type="button"
              onClick={handleStartReview}
              disabled={startingReview}
              className="inline-flex items-center gap-2 rounded-full bg-[#7a160e] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5c0f09] transition disabled:opacity-60"
            >
              <PlayCircle className="h-4 w-4" />
              {startingReview ? "Đang bắt đầu review..." : "Bắt đầu review"}
            </button>
          )}
          <Link
            to="/admin/reviewing-quotations"
            className="inline-flex items-center gap-2 rounded-full border border-[#d7b8a5] bg-white px-4 py-2 text-xs font-semibold text-[#7a160e]"
          >
            <FileText className="h-4 w-4" />
            Về danh sách
          </Link>
        </div>
      </div>

      {canSendAdmin && (
        <div className="bg-white rounded-2xl border border-violet-200 p-4 shadow-sm">
          <p className="text-sm font-semibold text-violet-800">Gửi cho admin phê duyệt</p>
          <div className="mt-2 flex flex-col md:flex-row gap-2">
            <input
              value={sendAdminMessage}
              onChange={(e) => setSendAdminMessage(e.target.value)}
              placeholder="Nhập ghi chú gửi admin (tuỳ chọn)"
              className="flex-1 rounded-xl border border-violet-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
            <button
              type="button"
              onClick={handleSendToAdmin}
              disabled={sendingAdmin}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {sendingAdmin ? "Đang gửi..." : "Gửi admin"}
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
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a160e]/80">Danh sách sản phẩm và phí</h3>
                <div className="mt-4 space-y-4">
                  {detail.lines?.map((line) => {
                    const fees = feesByItem[line.quotationItemId] || [];
                    const itemForm = newFeeForms[line.quotationItemId] || defaultFeeForm;
                    const isItemBusy = feeLoading[line.quotationItemId] || feeSubmitting[line.quotationItemId];

                    return (
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
                          {isItemBusy && fees.length === 0 ? (
                            <p className="text-xs text-gray-500 mt-2">Đang tải phí...</p>
                          ) : fees.length === 0 ? (
                            <p className="text-xs text-gray-500 mt-2">Chưa có phí cho sản phẩm này.</p>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {fees.map((fee) => (
                                <div key={fee.quotationFeeId} className="rounded-lg border border-gray-100 p-2">
                                  {editingFeeId === fee.quotationFeeId ? (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <select
                                          value={editFeeForm.isSubtracted}
                                          onChange={(e) =>
                                            setEditFeeForm((prev) => ({
                                              ...prev,
                                              isSubtracted: Number(e.target.value),
                                            }))
                                          }
                                          className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                                        >
                                          <option value={1}>Phí cộng thêm</option>
                                          <option value={0}>Phí giảm trừ</option>
                                        </select>
                                        <input
                                          type="number"
                                          min={1}
                                          value={editFeeForm.price}
                                          onChange={(e) =>
                                            setEditFeeForm((prev) => ({ ...prev, price: e.target.value }))
                                          }
                                          className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                                          placeholder="Giá phí"
                                        />
                                        <input
                                          value={editFeeForm.description}
                                          onChange={(e) =>
                                            setEditFeeForm((prev) => ({ ...prev, description: e.target.value }))
                                          }
                                          className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                                          placeholder="Mô tả"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateFee(line.quotationItemId, fee)}
                                          className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs text-white"
                                        >
                                          <Save className="h-3 w-3" /> Lưu
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingFeeId(null)}
                                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
                                        >
                                          <X className="h-3 w-3" /> Hủy
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className={`text-xs font-semibold ${fee.isSubtracted === 1 ? "text-rose-700" : "text-emerald-700"}`}>
                                          {fee.isSubtracted === 1 ? "Cộng thêm" : "Giảm trừ"}: {formatMoney(fee.price)}
                                        </p>
                                        <p className="text-xs text-gray-500">{fee.description || "Không có mô tả"}</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => openEditFee(fee)}
                                          className="rounded-md border border-gray-300 p-1 text-gray-600"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFee(line.quotationItemId, fee.quotationFeeId)}
                                          className="rounded-md border border-red-200 p-1 text-red-600"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 rounded-lg border border-[#ead8cc] bg-white p-3">
                          <p className="text-xs font-semibold text-[#7a160e]">Thêm phí mới</p>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <select
                              value={itemForm.isSubtracted}
                              onChange={(e) =>
                                setNewFeeForms((prev) => ({
                                  ...prev,
                                  [line.quotationItemId]: {
                                    ...itemForm,
                                    isSubtracted: Number(e.target.value),
                                  },
                                }))
                              }
                              className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                            >
                              <option value={1}>Phí cộng thêm</option>
                              <option value={0}>Phí giảm trừ</option>
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={itemForm.price}
                              onChange={(e) =>
                                setNewFeeForms((prev) => ({
                                  ...prev,
                                  [line.quotationItemId]: { ...itemForm, price: e.target.value },
                                }))
                              }
                              className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                              placeholder="Giá phí"
                            />
                            <input
                              value={itemForm.description}
                              onChange={(e) =>
                                setNewFeeForms((prev) => ({
                                  ...prev,
                                  [line.quotationItemId]: {
                                    ...itemForm,
                                    description: e.target.value,
                                  },
                                }))
                              }
                              className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                              placeholder="Mô tả"
                            />
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              disabled={isItemBusy}
                              onClick={() => handleCreateFee(line.quotationItemId)}
                              className="inline-flex items-center gap-1 rounded-md bg-[#7a160e] px-3 py-1.5 text-xs text-white disabled:opacity-60"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Thêm phí
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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





