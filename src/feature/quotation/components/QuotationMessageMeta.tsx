type QuotationMessageMetaProps = {
  metaJson?: string | null;
};

const MONEY_KEYS = new Set([
  "price",
  "totalOriginal",
  "totalSubtract",
  "totalAdd",
  "totalAfter",
  "totalAfterDiscount",
  "totalDiscountAmount",
]);

const ROLE_VALUE_LABELS: Record<string, string> = {
  STAFF: "Nhân viên",
  ADMIN: "Quản trị viên",
  CUSTOMER: "Khách hàng",
};

const ACTION_VALUE_LABELS: Record<string, string> = {
  SUBMIT: "Gửi yêu cầu",
  START_REVIEW: "Bắt đầu rà soát",
  SEND_ADMIN: "Gửi quản trị viên",
  APPROVE: "Phê duyệt",
  REJECT: "Từ chối",
  NOTE: "Ghi chú",
};

const STATUS_VALUE_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Khách hàng gửi yêu cầu",
  STAFF_REVIEWING: "Nhân viên đang xử lý",
  WAITING_ADMIN: "Chờ quản trị viên duyệt",
  ADMIN_REJECTED: "Quản trị viên từ chối",
  WAITING_CUSTOMER: "Chờ khách phản hồi",
  CUSTOMER_REJECTED: "Khách từ chối",
  CUSTOMER_ACCEPTED: "Khách đã đồng ý",
  CONVERTED_TO_ORDER: "Đã tạo đơn hàng",
  CANCELLED: "Đã hủy",
};

const LABELS: Record<string, string> = {
  quotationId: "Mã báo giá",
  quotationFeeId: "Mã phí báo giá",
  quotationItemId: "Mã mục báo giá",
  productId: "Mã sản phẩm",
  productName: "Tên sản phẩm",
  sku: "Mã SKU",
  quantity: "Số lượng",
  unitPrice: "Đơn giá",
  isSubtracted: "Loại phí",
  price: "Số tiền",
  description: "Mô tả",
  status: "Trạng thái",
  oldStatus: "Trạng thái cũ",
  newStatus: "Trạng thái mới",
  actionType: "Hành động",
  fromRole: "Vai trò gửi",
  toRole: "Vai trò nhận",
  fromAccountId: "Mã tài khoản gửi",
  message: "Tin nhắn",
  createdAt: "Thời gian tạo",
  originalLineTotal: "Thành tiền gốc",
  subtractTotal: "Tổng giảm trừ",
  addTotal: "Tổng cộng thêm",
  finalLineTotal: "Thành tiền cuối",
  totalOriginal: "Tổng gốc",
  totalSubtract: "Tổng giảm trừ",
  totalAdd: "Tổng cộng thêm",
  totalAfter: "Sau điều chỉnh",
  totalAfterDiscount: "Sau giảm giá",
  totalDiscountAmount: "Số tiền giảm",
  revision: "Số lần chỉnh sửa",
};

const formatLabel = (key: string) => {
  if (LABELS[key]) return LABELS[key];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const getValueClassName = (key: string, value: unknown) => {
  if (key === "isSubtracted" && typeof value === "number") {
    return value === 1 ? "text-emerald-700" : "text-red-600";
  }

  if (key === "totalAdd") {
    return "text-emerald-700";
  }

  if (key === "totalSubtract") {
    return "text-red-600";
  }

  return "text-[#5b2817]";
};

const formatValue = (key: string, value: unknown) => {
  if (key === "isSubtracted" && typeof value === "number") {
    return value === 1 ? "Phụ phí cộng thêm" : "Phụ phí giảm trừ";
  }

  if (
    ["fromRole", "toRole"].includes(key) &&
    typeof value === "string"
  ) {
    return ROLE_VALUE_LABELS[value] || "Vai trò khác";
  }

  if (key === "actionType" && typeof value === "string") {
    return ACTION_VALUE_LABELS[value] || "Hành động khác";
  }

  if (
    ["status", "oldStatus", "newStatus"].includes(key) &&
    typeof value === "string"
  ) {
    return STATUS_VALUE_LABELS[value] || "Trạng thái khác";
  }

  if (MONEY_KEYS.has(key) && typeof value === "number") {
    return formatMoney(value);
  }

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

export default function QuotationMessageMeta({
  metaJson,
}: QuotationMessageMetaProps) {
  if (!metaJson) return null;

  try {
    const parsed = JSON.parse(metaJson) as Record<string, unknown>;
    const entries = Object.entries(parsed);

    if (entries.length === 0) return null;

    return (
      <div className="mt-3 rounded-xl border border-[#eadfd4] bg-white/80 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a06b56]">
          Thông tin chi tiết
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border border-[#f3e7db] bg-[#fffaf5] px-3 py-2"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#b18470]">
                {formatLabel(key)}
              </p>
              <p
                className={`mt-1 text-sm font-semibold break-all whitespace-pre-wrap ${getValueClassName(
                  key,
                  value,
                )}`}
              >
                {formatValue(key, value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return (
      <div className="mt-3 rounded-xl border border-[#eadfd4] bg-white/80 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a06b56]">
          Dữ liệu bổ sung
        </p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[#fffaf5] p-3 text-xs text-[#6d4c41]">
          {metaJson}
        </pre>
      </div>
    );
  }
}
