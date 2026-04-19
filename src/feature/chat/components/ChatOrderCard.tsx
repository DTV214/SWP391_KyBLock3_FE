import type { OrderResponse } from "@/feature/checkout/services/orderService";
import {
  getStatusColorClass,
  translateOrderStatus,
} from "@/feature/account/utils/orderStatusUtils";
import { formatOrderDate } from "@/feature/account/utils/orderFilterUtils";

interface ChatOrderCardProps {
  orderId: number;
  order?: OrderResponse;
  compact?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export default function ChatOrderCard({
  orderId,
  order,
  compact = false,
  clickable = false,
  onClick,
}: ChatOrderCardProps) {
  const firstItem = order?.items?.[0];
  const containerClassName = `w-full rounded-xl border text-left transition-all ${
    clickable
      ? "border-[#f1e1d6] bg-[#fffaf5] hover:border-[#d77a45] hover:shadow-sm"
      : "border-[#f3e7db] bg-[#fffcf7]"
  } ${compact ? "p-3" : "p-4"}`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a06b56]">
            Đơn hàng
          </p>
          <p className="mt-1 text-sm font-bold text-tet-primary">#{orderId}</p>
        </div>
        {order?.status && (
          <span
            className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${getStatusColorClass(
              order.status,
            )}`}
          >
            {translateOrderStatus(order.status)}
          </span>
        )}
      </div>

      {order ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-lg border border-[#f1e1d6] bg-white">
              {firstItem?.imageUrl ? (
                <img
                  src={firstItem.imageUrl}
                  alt={firstItem.productName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg text-[#c78b6c]">
                  G
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800">
                {firstItem?.productName || "Đơn hàng"}
              </p>
              <p className="text-xs text-gray-500">
                {order.items.length} sản phẩm
                {order.items.length > 1
                  ? `, +${order.items.length - 1} sản phẩm khác`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatOrderDate(order.orderDateTime)}</span>
            <span className="font-bold text-tet-primary">
              {order.finalPayableAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>

          {clickable && (
            <p className="text-[11px] font-medium text-[#b85b29]">
              Bấm để xem thông tin đơn hàng
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-gray-500">Đang tải đơn hàng...</p>
      )}
    </>
  );

  if (clickable) {
    return (
      <button type="button" onClick={onClick} className={containerClassName}>
        {content}
      </button>
    );
  }

  return <div className={containerClassName}>{content}</div>;
}
