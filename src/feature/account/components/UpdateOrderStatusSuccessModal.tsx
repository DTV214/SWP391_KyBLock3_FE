import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import type { OrderResponse } from '@/feature/checkout/services/orderService';
import { translateOrderStatus } from '../utils/orderStatusUtils';
import VatOrderBadge from './VatOrderBadge';

interface UpdateOrderStatusSuccessModalProps {
    order: OrderResponse | null;
    isOpen: boolean;
    onClose: () => void;
    resolveStatusLabel?: (status: string) => string;
}

export default function UpdateOrderStatusSuccessModal({
    order,
    isOpen,
    onClose,
    resolveStatusLabel,
}: UpdateOrderStatusSuccessModalProps) {
    if (!order) return null;

    const getStatusLabel = (status: string) =>
        resolveStatusLabel ? resolveStatusLabel(status) : translateOrderStatus(status);

    const getStatusMessage = () => {
        if (order.status === 'PROCESSING') {
            return '�on h�ng dang du?c x? l�. S? s?m du?c giao d?n kh�ch h�ng.';
        }
        if (order.status === 'SHIPPED') {
            return '�on h�ng d� du?c giao h�ng th�nh c�ng!';
        }
        return 'Tr?ng th�i don h�ng d� du?c c?p nh?t th�nh c�ng.';
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
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-101 w-full max-w-md"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-lg font-bold text-blue-900">C?p nh?t tr?ng th�i th�nh c�ng</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-6 py-6 space-y-4">
                                <div className="flex justify-center mb-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-8 h-8 text-blue-600" />
                                    </motion.div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-center text-gray-700 font-medium">{getStatusMessage()}</p>

                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-600"><span className="font-medium">M� don h�ng:</span></p>
                                            <p className="text-sm font-bold text-gray-900">#{order.orderId}</p>
                                        </div>
                                        <div className="flex justify-between items-center gap-3">
                                            <p className="text-sm text-gray-600"><span className="font-medium">Tr?ng th�i m?i:</span></p>
                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                {order.requireVatInvoice && <VatOrderBadge />}
                                                <p className="text-sm font-bold text-tet-primary">{getStatusLabel(order.status)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-600"><span className="font-medium">T?ng ti?n:</span></p>
                                            <p className="text-sm font-bold text-gray-900">{order.finalPayableAmount.toLocaleString('vi-VN')}?</p>
                                        </div>
                                    </div>

                                    {order.status === 'SHIPPED' && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <p className="text-sm text-green-900">
                                                <span className="font-medium">Giao h�ng:</span> Kh�ch h�ng s? nh?n du?c th�ng b�o v? tr?ng th�i giao h�ng c?a m�nh.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-8 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                                >
                                    ��ng
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}



