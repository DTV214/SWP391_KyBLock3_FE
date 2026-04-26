import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building, Calendar, CheckCircle2, Clock, FileText, Pencil, PlayCircle, Plus, Save, ScrollText, Send, Trash2, User, X, XCircle } from "lucide-react";
import { quotationService, type QuotationDetail, type QuotationFee, type QuotationProductDetail } from "@/feature/quotation/services/quotationService";
import { getQuotationStatusMeta } from "@/feature/quotation/utils/quotationStatus";
import QuotationMessageMeta from "@/feature/quotation/components/QuotationMessageMeta";
import QuotationFeeFormFields from "@/feature/quotation/components/QuotationFeeFormFields";
import { DEFAULT_FEE_FORM as defaultFeeForm, findExistingFixedFee, getFeeFormForExistingFee, isHiddenQuotationMessage, resolveFeeFormPayload, type FeeFormState } from "@/feature/quotation/utils/quotationFeeOptions";

const formatMoney = (value?: number | null) => (typeof value === "number" ? `${value.toLocaleString("vi-VN")}đ` : "Chưa có");
const formatSignedMoney = (value: number | null | undefined, sign: "+" | "-") => (typeof value === "number" ? `${sign}${Math.abs(value).toLocaleString("vi-VN")}đ` : "Chưa có");
const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString("vi-VN") : "-");
type FetchDetailOptions = { showLoading?: boolean; includeFees?: boolean };
const getRoleBadgeClass = (role?: string | null) => role === "STAFF" ? "bg-amber-100 text-amber-800 border border-amber-200" : role === "ADMIN" ? "bg-violet-100 text-violet-800 border border-violet-200" : role === "CUSTOMER" ? "bg-sky-100 text-sky-800 border border-sky-200" : "bg-slate-100 text-slate-700 border border-slate-200";
const getActionBadgeClass = (action?: string | null) => action === "SUBMIT" ? "bg-blue-50 text-blue-700" : action === "START_REVIEW" ? "bg-amber-50 text-amber-700" : action === "SEND_ADMIN" ? "bg-violet-50 text-violet-700" : action === "APPROVE" || action === "ADMIN_APPROVE" ? "bg-emerald-50 text-emerald-700" : action === "REJECT" ? "bg-red-50 text-red-700" : action === "NOTE" ? "bg-gray-100 text-gray-700" : "bg-slate-100 text-slate-700";
const ROLE_LABELS: Record<string, string> = {
  STAFF: "Nhân viên",
  ADMIN: "Quản trị viên",
  CUSTOMER: "Khách hàng",
};
const ACTION_LABELS: Record<string, string> = {
  SUBMIT: "Gửi yêu cầu",
  START_REVIEW: "Bắt đầu rà soát",
  SEND_ADMIN: "Gửi quản trị viên",
  APPROVE: "Phê duyệt",
  ADMIN_APPROVE: "Admin duyệt",
  REJECT: "Từ chối",
  NOTE: "Ghi chú",
};
const getRoleLabel = (role?: string | null) =>
  role ? ROLE_LABELS[role] || "Vai trò khác" : "Không xác định";
const getActionLabel = (action?: string | null) =>
  action ? ACTION_LABELS[action] || "Hành động khác" : "Không xác định";
const QUOTATION_TYPE_LABELS: Record<string, string> = {
  MANUAL: "Báo giá thủ công",
  AUTO: "Báo giá tự động",
  SYSTEM: "Báo giá hệ thống",
};
const getQuotationTypeLabel = (type?: string | null) =>
  type ? QUOTATION_TYPE_LABELS[type] || "Loại báo giá khác" : "Không xác định";

export default function AdminApprovalQuotationDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<QuotationDetail | null>(null);
  const [detailMode, setDetailMode] = useState<"staff" | "admin">("admin");
  const [loading, setLoading] = useState(false);
  const [startingReview, setStartingReview] = useState(false);
  const [sendingAdmin, setSendingAdmin] = useState(false);
  const [submittingApprove, setSubmittingApprove] = useState(false);
  const [submittingReject, setSubmittingReject] = useState(false);
  const [sendAdminMessage, setSendAdminMessage] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");
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
      setFeesByItem((prev) => ({ ...prev, [quotationItemId]: (response?.data || []) as QuotationFee[] }));
      setNewFeeForms((prev) => ({ ...prev, [quotationItemId]: prev[quotationItemId] || { ...defaultFeeForm } }));
    } catch (err) {
      console.error(err);
      setError(`Không thể tải phí cho mục #${quotationItemId}.`);
    } finally {
      setFeeLoading((prev) => ({ ...prev, [quotationItemId]: false }));
    }
  };

  const fetchDetail = async ({ showLoading = true, includeFees = true }: FetchDetailOptions = {}) => {
    if (!id) return;
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const [staffResult, adminResult] = await Promise.allSettled([quotationService.getStaffQuotationById(id), quotationService.getAdminQuotationById(id)]);
      const staffDetail = staffResult.status === "fulfilled" ? ((staffResult.value?.data || null) as QuotationDetail | null) : null;
      const adminDetail = adminResult.status === "fulfilled" ? ((adminResult.value?.data || null) as QuotationDetail | null) : null;
      const nextMode = staffDetail && ["SUBMITTED", "STAFF_REVIEWING", "ADMIN_REJECTED"].includes(staffDetail.status) ? "staff" : adminDetail ? "admin" : staffDetail ? "staff" : null;
      const nextDetail = nextMode === "staff" ? staffDetail : nextMode === "admin" ? adminDetail : null;
      if (!nextDetail || !nextMode) {
        setDetail(null);
        setError("Không thể tải chi tiết báo giá cho quản trị viên.");
        return;
      }
      setDetailMode(nextMode);
      setDetail(nextDetail);
      if (nextMode === "staff") {
        if (includeFees && nextDetail.lines?.length) await Promise.all(nextDetail.lines.map((line) => fetchFeesForItem(line.quotationItemId)));
      } else { setFeesByItem({}); setNewFeeForms({}); }
    } catch (err) {
      console.error(err);
      setError("Không thể tải chi tiết báo giá cho quản trị viên.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { void fetchDetail(); }, [id]);
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
    void fetchProductImages();
  }, [detail, productImageMap]);

  const statusMeta = getQuotationStatusMeta(detail?.status === "DRAFT" ? "SUBMITTED" : detail?.status);
  const totalQuantity = useMemo(() => detail?.lines?.reduce((sum, line) => sum + (line.quantity || 0), 0) || 0, [detail]);
  const visibleMessages = useMemo(() => (detail?.messages || []).filter((message) => !isHiddenQuotationMessage(message)), [detail?.messages]);
  const canStartReview = detailMode === "staff" && detail?.status === "SUBMITTED";
  const canSendAdmin = detailMode === "staff" && detail?.status === "STAFF_REVIEWING";
  const canEditFees = detailMode === "staff" && ["SUBMITTED", "STAFF_REVIEWING", "ADMIN_REJECTED"].includes(detail?.status || "");
  const canDecide = detailMode === "admin" && detail?.status === "WAITING_ADMIN";

  const handleStartReview = async () => { if (!id) return; try { setStartingReview(true); setError(null); await quotationService.startStaffReview(id); await fetchDetail(); } catch (err: any) { console.error(err); setError(err?.response?.data?.msg || "Không thể bắt đầu rà soát báo giá."); } finally { setStartingReview(false); } };
  const handleSendToAdmin = async () => { if (!id) return; try { setSendingAdmin(true); setError(null); await quotationService.sendStaffQuotationToAdmin(id, sendAdminMessage.trim() || undefined); setSendAdminMessage(""); await fetchDetail(); } catch (err: any) { console.error(err); setError(err?.response?.data?.msg || "Không thể gửi báo giá cho quản trị viên."); } finally { setSendingAdmin(false); } };
  const handleApprove = async () => { if (!id) return; try { setSubmittingApprove(true); setError(null); await quotationService.approveAdminQuotation(id, { message: decisionMessage.trim() || undefined }); setDecisionMessage(""); await fetchDetail(); } catch (err: any) { console.error(err); setError(err?.response?.data?.msg || "Không thể phê duyệt báo giá."); } finally { setSubmittingApprove(false); } };
  const handleReject = async () => { if (!id) return; try { setSubmittingReject(true); setError(null); await quotationService.rejectAdminQuotation(id, { message: decisionMessage.trim() || undefined }); setDecisionMessage(""); await fetchDetail(); } catch (err: any) { console.error(err); setError(err?.response?.data?.msg || "Không thể từ chối báo giá."); } finally { setSubmittingReject(false); } };

  const handleCreateFee = async (quotationItemId: number) => {
    if (!id) return;
    const form = newFeeForms[quotationItemId] || defaultFeeForm;
    const price = Number(form.price);
    if (!price || price <= 0) return void setError("Giá phí phải lớn hơn 0.");
    const feePayload = resolveFeeFormPayload(form);
    if (!feePayload) return void setError("Vui lòng nhập mô tả cho phí khác.");
    const existingFixedFee = form.descriptionType !== "OTHER" ? findExistingFixedFee(feesByItem[quotationItemId] || [], form.descriptionType) : undefined;
    try {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: true }));
      setError(null);
      if (existingFixedFee) await quotationService.updateStaffFee(id, existingFixedFee.quotationFeeId, { quotationFeeId: existingFixedFee.quotationFeeId, isSubtracted: feePayload.isSubtracted, price, description: feePayload.description });
      else await quotationService.createStaffFee(id, { quotationItemId, isSubtracted: feePayload.isSubtracted, price, description: feePayload.description });
      setNewFeeForms((prev) => ({ ...prev, [quotationItemId]: { ...defaultFeeForm } }));
      await fetchFeesForItem(quotationItemId);
      await fetchDetail({ showLoading: false, includeFees: false });
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể tạo phí.");
    } finally {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: false }));
    }
  };

  const openEditFee = (fee: QuotationFee) => { setEditingFeeId(fee.quotationFeeId); setEditFeeForm(getFeeFormForExistingFee(fee)); };
  const handleUpdateFee = async (quotationItemId: number, fee: QuotationFee) => {
    if (!id) return;
    const price = Number(editFeeForm.price);
    if (!price || price <= 0) return void setError("Giá phí phải lớn hơn 0.");
    const feePayload = resolveFeeFormPayload(editFeeForm);
    if (!feePayload) return void setError("Vui lòng nhập mô tả cho phí khác.");
    try {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: true }));
      setError(null);
      await quotationService.updateStaffFee(id, fee.quotationFeeId, { quotationFeeId: fee.quotationFeeId, isSubtracted: feePayload.isSubtracted, price, description: feePayload.description });
      setEditingFeeId(null);
      setEditFeeForm({ ...defaultFeeForm });
      await fetchFeesForItem(quotationItemId);
      await fetchDetail({ showLoading: false, includeFees: false });
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.msg || "Không thể cập nhật phí.");
    } finally {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: false }));
    }
  };
  const handleDeleteFee = async (quotationItemId: number, feeId: number) => {
    if (!id || !confirm("Bạn có chắc muốn xóa phí này?")) return;
    try {
      setFeeSubmitting((prev) => ({ ...prev, [quotationItemId]: true }));
      setError(null);
      await quotationService.deleteStaffFee(id, feeId);
      await fetchFeesForItem(quotationItemId);
      await fetchDetail({ showLoading: false, includeFees: false });
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
          <h1 className="text-2xl font-bold text-tet-primary">Báo giá #{id}</h1>
          <p className="text-sm text-gray-500 mt-1">Trang quản trị viên theo dõi toàn bộ luồng rà soát phí và phê duyệt báo giá.</p>
        </div>
        <Link to="/admin/quotations" className="inline-flex items-center gap-2 rounded-full border border-[#d7b8a5] bg-white px-4 py-2 text-xs font-semibold text-[#7a160e]"><FileText className="h-4 w-4" />Về danh sách</Link>
      </div>

      {(canStartReview || canSendAdmin) && <div className="bg-white rounded-2xl border border-violet-200 p-4 shadow-sm"><p className="text-sm font-semibold text-violet-800">Thao tác rà soát</p><div className="mt-2 flex flex-col md:flex-row gap-2"><input value={sendAdminMessage} onChange={(e) => setSendAdminMessage(e.target.value)} placeholder="Nhập ghi chú nội bộ hoặc gửi quản trị viên (tuỳ chọn)" className="flex-1 rounded-xl border border-violet-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />{canStartReview && <button type="button" onClick={handleStartReview} disabled={startingReview} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7a160e] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5c0f09] disabled:opacity-60"><PlayCircle className="h-4 w-4" />{startingReview ? "Đang bắt đầu rà soát..." : "Bắt đầu rà soát"}</button>}{canSendAdmin && <button type="button" onClick={handleSendToAdmin} disabled={sendingAdmin} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"><Send className="h-4 w-4" />{sendingAdmin ? "Đang gửi..." : "Gửi quản trị viên"}</button>}</div></div>}
      {canDecide && <div className="bg-white rounded-2xl border border-violet-200 p-4 shadow-sm"><p className="text-sm font-semibold text-violet-800">Quyết định của quản trị viên</p><textarea value={decisionMessage} onChange={(e) => setDecisionMessage(e.target.value)} placeholder="Nhập ghi chú gửi khách hàng/nhân viên (tuỳ chọn)" rows={3} className="mt-2 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" /><div className="mt-3 flex items-center gap-2"><button type="button" onClick={handleApprove} disabled={submittingApprove || submittingReject} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{submittingApprove ? "Đang phê duyệt..." : "Phê duyệt gửi khách hàng"}</button><button type="button" onClick={handleReject} disabled={submittingApprove || submittingReject} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"><XCircle className="h-4 w-4" />{submittingReject ? "Đang từ chối..." : "Từ chối trả nhân viên"}</button></div></div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {loading ? <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 shadow-sm">Đang tải dữ liệu...</div> : !detail ? <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 shadow-sm">Không tìm thấy báo giá.</div> : <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-5 shadow-sm ${statusMeta.badgeClass}`}><p className="text-xs opacity-80">Trạng thái</p><p className="text-lg font-semibold mt-1">{statusMeta.label}</p></div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"><p className="text-xs text-gray-500">Loại báo giá</p><p className="text-lg font-semibold text-[#7a160e] mt-1">{getQuotationTypeLabel(detail.quotationType)}</p></div>
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 shadow-sm"><p className="text-xs text-blue-700">Tổng số lượng</p><p className="text-lg font-semibold text-blue-800 mt-1">{totalQuantity}</p></div>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 shadow-sm"><p className="text-xs text-emerald-700">Tổng tiền sau phí</p><p className="text-lg font-semibold text-emerald-800 mt-1">{formatMoney(detail.totalAfterDiscount)}</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
          <div className="space-y-4 self-start">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a160e]/80">Thông tin khách hàng</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2"><Building className="h-4 w-4 text-gray-500" />Khách hàng: <span className="font-semibold">{detail.company || "Không có"}</span></div>
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" />Email: <span className="font-semibold">{detail.email || "Không có"}</span></div>
                <p>Số điện thoại: <span className="font-semibold">{detail.phone || "Không có"}</span></p><p>Địa chỉ: <span className="font-semibold">{detail.address || "Không có"}</span></p><p>Mã tài khoản: <span className="font-semibold">{detail.accountId ?? "-"}</span></p><p>Mã đơn hàng: <span className="font-semibold">{detail.orderId ?? "-"}</span></p><p>Lần chỉnh sửa: <span className="font-semibold">{detail.revision}</span></p><p>Nhân viên rà soát: <span className="font-semibold">{detail.staffReviewerId ?? "-"}</span></p><p>Quản trị viên rà soát: <span className="font-semibold">{detail.adminReviewerId ?? "-"}</span></p>
              </div>
              {detail.requireVatInvoice && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold text-amber-800">Thông tin VAT</p>
                  <p className="mt-2">Công ty: <span className="font-semibold">{detail.vatCompanyName || "-"}</span></p>
                  <p>Mã số thuế: <span className="font-semibold">{detail.vatCompanyTaxCode || "-"}</span></p>
                  <p>Địa chỉ: <span className="font-semibold">{detail.vatCompanyAddress || "-"}</span></p>
                  <p>Email xác thực VAT: <span className="font-semibold">{detail.vatInvoiceEmail || "-"}</span></p>
                </div>
              )}
              <div className="mt-4 rounded-xl border border-[#f1e1d6] bg-[#fffaf5] p-3 text-sm text-[#7b5a4c]">
                <p>Trước VAT: <span className="font-semibold text-[#4a0d06]">{formatMoney(detail.totalAfterDiscount)}</span></p>
                <p>VAT dự kiến: <span className="font-semibold text-[#4a0d06]">{formatMoney(detail.vatAmountPreview)}</span></p>
                <p className="mt-2 border-t border-[#f1e1d6] pt-2">Thanh toán gồm VAT: <span className="font-semibold text-[#7a160e]">{formatMoney(detail.finalPayablePreview)}</span></p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Ngày tạo: {formatDate(detail.requestDate)}</div><div className="flex items-center gap-2"><Clock className="h-4 w-4" />Ngày gửi yêu cầu: {formatDate(detail.submittedAt)}</div><div className="flex items-center gap-2"><Clock className="h-4 w-4" />Nhân viên rà soát: {formatDate(detail.staffReviewedAt)}</div><div className="flex items-center gap-2"><Clock className="h-4 w-4" />Quản trị viên rà soát: {formatDate(detail.adminReviewedAt)}</div><div className="flex items-center gap-2"><Clock className="h-4 w-4" />Khách phản hồi: {formatDate(detail.customerRespondedAt)}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a160e]/80">Tổng hợp giá</h3>
              <div className="mt-4 space-y-2 text-sm"><p>Tổng gốc: <span className="font-semibold">{formatMoney(detail.totalOriginal)}</span></p><p>Tổng giảm trừ: <span className="font-semibold text-emerald-700">{formatSignedMoney(detail.totalSubtract, "-")}</span></p><p>Tổng cộng thêm: <span className="font-semibold text-rose-700">{formatSignedMoney(detail.totalAdd, "+")}</span></p><p className="pt-2 border-t border-gray-100">Sau điều chỉnh: <span className="font-semibold text-[#7a160e]">{formatMoney(detail.totalAfterDiscount)}</span></p></div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-2"><p>Ghi chú ngân sách: {detail.desiredPriceNote || "-"}</p><p>Ghi chú thêm: {detail.note || "-"}</p></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a160e]/80">Danh sách sản phẩm và phí</h3>
              <div className="mt-4 space-y-4">
                {detail.lines?.map((line) => {
                  const fees = detailMode === "staff" ? feesByItem[line.quotationItemId] || [] : line.fees || [];
                  const itemForm = newFeeForms[line.quotationItemId] || defaultFeeForm;
                  const isItemBusy = feeLoading[line.quotationItemId] || feeSubmitting[line.quotationItemId];
                  const willUpdateFixedFee = itemForm.descriptionType !== "OTHER" && Boolean(findExistingFixedFee(fees, itemForm.descriptionType));
                  return (
                    <div key={line.quotationItemId} className="rounded-xl border border-[#f1e1d6] bg-[#fffaf5] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-xl bg-[#f1e1d6]">{productImageMap[line.productId] ? <img src={productImageMap[line.productId]} alt={line.productName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8a5b4f]">Không có ảnh</div>}</div><div><p className="text-sm font-semibold text-[#4a0d06]">{line.productName}</p><p className="text-xs text-[#8a5b4f]">{line.sku || "Không có"}</p></div></div>
                        <div className="text-right text-xs"><p>Số lượng: {line.quantity}</p><p>Đơn giá: {formatMoney(line.unitPrice)}</p><p>Gốc: {formatMoney(line.originalLineTotal)}</p><p className="text-emerald-700">Giảm trừ: {formatMoney(line.subtractTotal)}</p><p className="text-rose-700">Cộng thêm: {formatMoney(line.addTotal)}</p><p className="font-semibold text-[#7a160e]">Thành tiền: {formatMoney(line.finalLineTotal)}</p></div>
                      </div>
                      <div className="mt-3 rounded-lg border border-[#ead8cc] bg-white p-3"><p className="text-xs font-semibold text-[#7a160e]">Danh sách phí</p>{isItemBusy && canEditFees && fees.length === 0 ? <p className="text-xs text-gray-500 mt-2">Đang tải phí...</p> : fees.length === 0 ? <p className="text-xs text-gray-500 mt-2">Chưa có phí cho sản phẩm này.</p> : <div className="mt-2 space-y-2">{fees.map((fee) => <div key={fee.quotationFeeId} className="rounded-lg border border-gray-100 p-2">{canEditFees && editingFeeId === fee.quotationFeeId ? <div className="space-y-2"><QuotationFeeFormFields form={editFeeForm} onChange={setEditFeeForm} /><div className="flex items-center gap-2 justify-end"><button type="button" onClick={() => handleUpdateFee(line.quotationItemId, fee)} className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs text-white"><Save className="h-3 w-3" /> Lưu</button><button type="button" onClick={() => setEditingFeeId(null)} className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs"><X className="h-3 w-3" /> Hủy</button></div></div> : <div className="flex items-center justify-between gap-3"><div><p className={`text-xs font-semibold ${fee.isSubtracted === 1 ? "text-rose-700" : "text-emerald-700"}`}>{fee.isSubtracted === 1 ? "Cộng thêm" : "Giảm trừ"}: {formatMoney(fee.price)}</p><p className="text-xs text-gray-500">{fee.description || "Không có mô tả"}</p></div>{canEditFees && <div className="flex items-center gap-1"><button type="button" onClick={() => openEditFee(fee)} className="rounded-md border border-gray-300 p-1 text-gray-600"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => handleDeleteFee(line.quotationItemId, fee.quotationFeeId)} className="rounded-md border border-red-200 p-1 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div>}</div>}</div>)}</div>}</div>
                      {canEditFees && <div className="mt-3 rounded-lg border border-[#ead8cc] bg-white p-3"><p className="text-xs font-semibold text-[#7a160e]">Thêm phí mới</p><div className="mt-2"><QuotationFeeFormFields form={itemForm} onChange={(nextForm) => setNewFeeForms((prev) => ({ ...prev, [line.quotationItemId]: nextForm }))} /></div><div className="mt-2 flex justify-end"><button type="button" disabled={isItemBusy} onClick={() => handleCreateFee(line.quotationItemId)} className="inline-flex items-center gap-1 rounded-md bg-[#7a160e] px-3 py-1.5 text-xs text-white disabled:opacity-60"><Plus className="h-3.5 w-3.5" />{willUpdateFixedFee ? "Cập nhật phí" : "Thêm phí"}</button></div></div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a160e]/80 flex items-center gap-2"><ScrollText className="h-4 w-4" />Lịch sử trao đổi</h3>
              {visibleMessages.length > 0 ? <div className="mt-4 space-y-3">{visibleMessages.map((msg) => <div key={msg.quotationMessageId} className="rounded-lg border border-[#f1e1d6] bg-[#fffaf5] p-3 text-sm"><div className="flex flex-wrap items-center gap-2 text-xs text-gray-500"><span className={`rounded-full px-2 py-0.5 font-semibold ${getRoleBadgeClass(msg.fromRole)}`}>{getRoleLabel(msg.fromRole)}</span><span className={`rounded-full px-2 py-0.5 ${getActionBadgeClass(msg.actionType)}`}>{getActionLabel(msg.actionType)}</span><span>#{msg.fromAccountId ?? "-"}</span><span>{formatDate(msg.createdAt)}</span></div><p className="mt-1 text-gray-700">{msg.message}</p><QuotationMessageMeta metaJson={msg.metaJson} /></div>)}</div> : <p className="mt-4 text-sm text-gray-500">Chưa có lịch sử trao đổi.</p>}
            </div>
          </div>
        </div>
      </>}
    </div>
  );
}
