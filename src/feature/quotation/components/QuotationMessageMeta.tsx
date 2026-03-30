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

const LABELS: Record<string, string> = {
  quotationItemId: "Item ID",
  isSubtracted: "Loại phí",
  price: "Số tiền",
  totalOriginal: "Tổng gốc",
  totalSubtract: "Tổng giảm trừ",
  totalAdd: "Tổng cộng thêm",
  totalAfter: "Sau điều chỉnh",
  totalAfterDiscount: "Sau giảm giá",
  totalDiscountAmount: "Số tiền giảm",
  revision: "Sô lần chỉnh sửa",
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

  if (MONEY_KEYS.has(key) && typeof value === "number") {
    return formatMoney(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
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
          Meta Data
        </p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[#fffaf5] p-3 text-xs text-[#6d4c41]">
          {metaJson}
        </pre>
      </div>
    );
  }
}
