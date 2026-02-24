export type QuotationStatusMeta = {
  label: string;
  badgeClass: string;
};

const FALLBACK_STATUS: QuotationStatusMeta = {
  label: "Không xác định",
  badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
};

export const QUOTATION_STATUS_META: Record<string, QuotationStatusMeta> = {
  DRAFT: {
    label: "Nháp",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  SUBMITTED: {
    label: "Đã gửi",
    badgeClass: "bg-sky-100 text-sky-800 border border-sky-200",
  },
  STAFF_REVIEWING: {
    label: "Nhân viên đang xử lý",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  WAITING_ADMIN: {
    label: "Chờ admin duyệt",
    badgeClass: "bg-violet-100 text-violet-800 border border-violet-200",
  },
  ADMIN_REJECTED: {
    label: "Admin từ chối",
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
  },
  WAITING_CUSTOMER: {
    label: "Chờ khách phản hồi",
    badgeClass: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  },
  CUSTOMER_REJECTED: {
    label: "Khách từ chối",
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
  },
  CUSTOMER_ACCEPTED: {
    label: "Khách đã đồng ý",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  CONVERTED_TO_ORDER: {
    label: "Đã tạo đơn hàng",
    badgeClass: "bg-teal-100 text-teal-800 border border-teal-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    badgeClass: "bg-zinc-200 text-zinc-700 border border-zinc-300",
  },
};

export const QUOTATION_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  ...Object.entries(QUOTATION_STATUS_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];

export const getQuotationStatusMeta = (status?: string | null): QuotationStatusMeta => {
  if (!status) return FALLBACK_STATUS;
  return QUOTATION_STATUS_META[status] || FALLBACK_STATUS;
};
