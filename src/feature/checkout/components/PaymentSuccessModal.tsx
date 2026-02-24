import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessModalProps {
    isOpen: boolean;
    orderId?: number;
    onClose?: () => void;
}

export default function PaymentSuccessModal({
    isOpen,
    orderId,
    onClose,
}: PaymentSuccessModalProps) {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
        onClose?.();
    };

    const handleGoOrders = () => {
        navigate('/account/orders');
        onClose?.();
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
                        className="fixed inset-0 bg-black/50 z-99"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-101 w-full max-w-md"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                            {/* Content */}
                            <div className="px-8 py-12 text-center space-y-6">
                                {/* Success Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                    className="flex justify-center"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-green-100 rounded-full blur-xl" />
                                        <CheckCircle className="w-24 h-24 text-green-600 relative" />
                                    </div>
                                </motion.div>

                                {/* Success Message */}
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-serif font-bold text-tet-primary">
                                        Thanh toán thành công! 🎉
                                    </h2>
                                    <p className="text-gray-600 text-lg">
                                        Đơn hàng của bạn đã được thanh toán qua ví
                                    </p>
                                </div>

                                {/* Order Info */}
                                {orderId && (
                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                                        <p className="text-sm text-gray-600 mb-2">Mã đơn hàng</p>
                                        <p className="text-2xl font-bold text-green-600">#{orderId}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-6">
                                    <button
                                        onClick={handleGoOrders}
                                        className="w-full bg-tet-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-tet-accent transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <span>Xem lịch sử giao dịch</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={handleGoHome}
                                        className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Quay về trang chủ
                                    </button>
                                </div>

                                {/* Decorative element */}
                                <div className="pt-4">
                                    <p className="text-sm text-gray-400">
                                        ✨ Cảm ơn bạn đã mua sắm tại QuaTet!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
