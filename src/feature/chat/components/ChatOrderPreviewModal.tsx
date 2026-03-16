import { X } from "lucide-react";
import type { OrderResponse } from "@/feature/checkout/services/orderService";
import ChatOrderCard from "@/feature/chat/components/ChatOrderCard";

interface ChatOrderPreviewModalProps {
  isOpen: boolean;
  order: OrderResponse | null;
  orderId: number | null;
  onClose: () => void;
}

export default function ChatOrderPreviewModal({
  isOpen,
  order,
  orderId,
  onClose,
}: ChatOrderPreviewModalProps) {
  if (!isOpen || !orderId) return null;

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/35 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.75rem] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a06b56]">
              Chi tiết đơn hàng
            </p>
            <h3 className="mt-1 text-lg font-bold text-tet-primary">
              Đơn hàng #{orderId}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <ChatOrderCard orderId={orderId} order={order ?? undefined} />

          {order ? (
            <>
              <div className="rounded-2xl bg-[#fffaf5] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a06b56]">
                  Giao hàng
                </p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-tet-primary">Tên:</span>{" "}
                    {order.customerName}
                  </p>
                  <p>
                    <span className="font-semibold text-tet-primary">Sdt:</span>{" "}
                    {order.customerPhone}
                  </p>
                  <p>
                    <span className="font-semibold text-tet-primary">Email:</span>{" "}
                    {order.customerEmail}
                  </p>
                  <p>
                    <span className="font-semibold text-tet-primary">Địa chỉ:</span>{" "}
                    {order.customerAddress}
                  </p>
                  {order.note && (
                    <p>
                      <span className="font-semibold text-tet-primary">Ghi chú:</span>{" "}
                      {order.note}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#f1e1d6] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a06b56]">
                  Sản phẩm
                </p>
                <div className="mt-3 max-h-56 space-y-3 overflow-y-auto">
                  {order.items.map((item) => (
                    <div
                      key={item.orderDetailId}
                      className="flex items-center gap-3 rounded-xl bg-[#fffcf7] p-3"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-lg border border-[#f1e1d6] bg-white">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
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
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {item.sku} · x{item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-tet-primary">
                        {item.amount.toLocaleString("vi-VN")}d
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-[#fffaf5] p-4 text-sm text-gray-500">
              Đang tải chi tiết...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
