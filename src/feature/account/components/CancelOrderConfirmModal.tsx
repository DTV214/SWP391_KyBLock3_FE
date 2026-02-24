import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import type { OrderResponse } from '@/feature/checkout/services/orderService';

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
            onClose();
        } catch (err: any) {
            setError(err.message || 'Không thể hủy đơn hàng');
            console.error('Error canceling order:', err);
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
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <h2 className="text-lg font-bold text-red-900">Xác nhận hủy đơn hàng</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="text-red-600 hover:text-red-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-6 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <p className="text-gray-700">
                                        Bạn có chắc chắn muốn <span className="font-bold text-red-600">hủy đơn hàng này</span> không?
                                    </p>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-900">
                                            <span className="font-bold">💳 Hoàn tiền:</span> Sau khi hủy, số tiền{' '}
                                            <span className="font-bold text-blue-600">{order.finalPrice.toLocaleString('vi-VN')}₫</span>{' '}
                                            sẽ được hoàn ngay về ví của bạn.
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium">Mã đơn hàng:</span> #{order.orderId}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Tổng tiền:</span>{' '}
                                            <span className="font-bold text-gray-900">
                                                {order.finalPrice.toLocaleString('vi-VN')}₫
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Giữ lại
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                    className="px-6 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Hủy đơn hàng'
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
