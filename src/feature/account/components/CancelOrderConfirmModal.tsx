import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useState } from "react";
import type { OrderResponse } from "@/feature/checkout/services/orderService";

interface CancelOrderConfirmModalProps {
  order: OrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: number) => Promise<void>;
}

export default function CancelOrderConfirmModal({
  order,
  isOpen,
  onClose,
  onConfirm,
}: CancelOrderConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onConfirm(order.orderId);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Không thể gửi yêu cầu hủy đơn hàng";
      setError(errorMessage);
      console.error("Error canceling order:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-9999"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10000 w-full max-w-md"
          >
            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden mx-4">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold text-tet-primary flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={24} />
                  Yêu cầu hủy đơn hàng
                </h3>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-8 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}
                <p className="text-gray-600 text-base leading-relaxed text-center">
                  Bạn có chắc chắn muốn gửi yêu cầu hủy đơn hàng{" "}
                  <strong className="text-tet-primary">#{order.orderId}</strong>{" "}
                  không?
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-4">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    <span className="font-bold">Lưu ý:</span> Yêu cầu của bạn sẽ
                    được chuyển đến bộ phận CSKH để xét duyệt. Đơn hàng sẽ tạm
                    thời chuyển sang trạng thái <strong>Chờ hủy</strong>.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-full font-bold text-gray-500 hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Giữ lại đơn
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...
                    </>
                  ) : (
                    "Gửi yêu cầu hủy"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
