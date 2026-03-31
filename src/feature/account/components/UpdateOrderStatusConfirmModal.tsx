import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import type { OrderResponse } from '@/feature/checkout/services/orderService';
import { translateOrderStatus } from '../utils/orderStatusUtils';

interface UpdateOrderStatusConfirmModalProps {
    order: OrderResponse | null;
    isOpen: boolean;
    newStatus: string | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    resolveStatusLabel?: (status: string) => string;
}

export default function UpdateOrderStatusConfirmModal({
    order,
    isOpen,
    newStatus,
    onClose,
    onConfirm,
    resolveStatusLabel,
}: UpdateOrderStatusConfirmModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!order || !newStatus) return null;

    const getStatusLabel = (status: string) =>
        resolveStatusLabel ? resolveStatusLabel(status) : translateOrderStatus(status);

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await onConfirm();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Không thể cập nhật trạng thái đơn hàng');
            console.error('Error updating order status:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-lg font-bold text-blue-900">Xác nhận cập nhật trạng thái</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-6 py-6 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <p className="text-gray-700">
                                        Bạn có chắc chắn muốn <span className="font-bold text-blue-600">cập nhật trạng thái</span> đơn hàng này không?
                                    </p>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                        <p className="text-sm text-blue-900">
                                            <span className="font-bold">Thay đổi:</span>
                                        </p>
                                        <div className="space-y-2 ml-4">
                                            <p className="text-sm text-blue-900">
                                                Trạng thái hiện tại: <span className="font-bold text-blue-600">{getStatusLabel(order.status)}</span>
                                            </p>
                                            <p className="text-sm text-blue-900 flex items-center gap-2">
                                                <span>→</span>
                                                <span>Trạng thái mới: <span className="font-bold text-green-600">{getStatusLabel(newStatus)}</span></span>
                                            </p>
                                        </div>
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

                            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Xác nhận'
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
