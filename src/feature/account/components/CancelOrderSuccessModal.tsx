import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { OrderResponse } from "@/feature/checkout/services/orderService";

interface CancelOrderSuccessModalProps {
  order: OrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CancelOrderSuccessModal({
  order,
  isOpen,
  onClose,
}: CancelOrderSuccessModalProps) {
  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-9999"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10000 w-full max-w-md"
          >
            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden mx-4 text-center">
              <div className="p-10">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-tet-primary mb-3">
                  Đã gửi yêu cầu hủy!
                </h3>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Yêu cầu hủy đơn hàng{" "}
                  <strong className="text-gray-800">#{order.orderId}</strong>{" "}
                  của bạn đã được ghi nhận và đang chờ Admin xử lý.
                </p>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left mb-8 space-y-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-800">
                      Trạng thái hiện tại:
                    </span>{" "}
                    Yêu cầu hủy (Chờ duyệt)
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-800">Lưu ý:</span> Nếu
                    đơn hàng đã được thanh toán, tiền sẽ được hoàn lại tự động
                    sau khi Admin xác nhận hủy thành công.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-full bg-tet-primary text-white font-bold text-lg hover:bg-tet-accent transition-all shadow-xl hover:-translate-y-0.5"
                >
                  Đóng & Quay lại
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
