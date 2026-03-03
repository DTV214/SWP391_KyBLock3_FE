import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import type { OrderResponse } from '@/feature/checkout/services/orderService';

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
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-101 w-full max-w-md"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-green-50 border-b border-green-200 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <h2 className="text-lg font-bold text-green-900">Hủy đơn hàng thành công</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-green-600 hover:text-green-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-6 space-y-4">
                                <div className="flex justify-center mb-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </motion.div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-center text-gray-700 font-medium">
                                        Đơn hàng của bạn đã được hủy thành công!
                                    </p>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                        <p className="text-sm text-blue-900 font-medium">💳 Thông tin hoàn tiền:</p>
                                        <p className="text-sm text-blue-900">
                                            Nếu đơn hàng đã thanh toán, số tiền{' '}
                                            <span className="font-bold text-blue-600">{order.finalPrice.toLocaleString('vi-VN')}₫</span>{' '}
                                            sẽ được <span className="font-bold">hoàn lại vào ví</span> của bạn ngay lập tức.
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Mã đơn hàng:</span> #{order.orderId}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Lý do:</span> Yêu cầu của khách hàng
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <p className="text-sm text-amber-900">
                                            <span className="font-medium">📝 Lưu ý:</span> Nếu không nhận được hoàn tiền, vui lòng liên hệ với bộ phận hỗ trợ khách hàng.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-8 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
