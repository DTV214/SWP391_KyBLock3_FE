import { X } from "lucide-react";
import type { OrderResponse } from "@/feature/checkout/services/orderService";
import ChatOrderCard from "@/feature/chat/components/ChatOrderCard";

interface ChatOrderPreviewModalProps {
  isOpen: boolean;
  order: OrderResponse | null;
  orderId: number | null;
  onClose: () => void;
  onOpenOrderPage?: (orderId: number) => void;
}

export default function ChatOrderPreviewModal({
  isOpen,
  order,
  orderId,
  onClose,
  onOpenOrderPage,
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
              {"Chi ti\u1ebft \u0111\u01a1n h\u00e0ng"}
            </p>
            <h3 className="mt-1 text-lg font-bold text-tet-primary">
              {"\u0110\u01a1n h\u00e0ng #"}
              {orderId}
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
                  {"Giao h\u00e0ng"}
                </p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-tet-primary">
                      {"T\u00ean:"}
                    </span>{" "}
                    {order.customerName}
                  </p>
                  <p>
                    <span className="font-semibold text-tet-primary">
                      {"S\u0110T:"}
                    </span>{" "}
                    {order.customerPhone}
                  </p>
                  <p>
                    <span className="font-semibold text-tet-primary">
                      {"Email:"}
                    </span>{" "}
                    {order.customerEmail}
                  </p>
                  <p>
                    <span className="font-semibold text-tet-primary">
                      {"\u0110\u1ecba ch\u1ec9:"}
                    </span>{" "}
                    {order.customerAddress}
                  </p>
                  {order.note && (
                    <p>
                      <span className="font-semibold text-tet-primary">
                        {"Ghi ch\u00fa:"}
                      </span>{" "}
                      {order.note}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#f1e1d6] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a06b56]">
                  {"S\u1ea3n ph\u1ea9m"}
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
                          {"SKU: "}
                          {item.sku}
                          {" - x"}
                          {item.quantity}
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
              {"\u0110ang t\u1ea3i chi ti\u1ebft..."}
            </div>
          )}

          {onOpenOrderPage && (
            <div className="flex justify-end border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => onOpenOrderPage(orderId)}
                className="rounded-lg bg-tet-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
              >
                {"M\u1edf trong tab \u0110\u01a1n h\u00e0ng"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
