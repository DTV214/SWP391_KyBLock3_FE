import { Loader2, Copy, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { type PaymentTransaction, createPayment } from '@/feature/checkout/services/paymentService';
import {
    translatePaymentStatus,
    getPaymentStatusColorClass,
    getPaymentStatusIcon
} from '../utils/paymentStatusUtils';

interface OrderPaymentHistoryProps {
    payments: PaymentTransaction[];
    isLoading: boolean;
    orderId?: number;
    orderStatus?: string;
}

export default function OrderPaymentHistory({
    payments,
    isLoading,
    orderId,
    orderStatus
}: OrderPaymentHistoryProps) {
    const [isRetrying, setIsRetrying] = useState(false);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Không xác định';
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRetryPayment = async () => {
        if (!orderId) {
            alert('Không tìm thấy mã đơn hàng');
            return;
        }

        try {
            setIsRetrying(true);
            const response = await createPayment(
                {
                    orderId,
                    paymentMethod: 'VNPAY'
                },
                localStorage.getItem('token') || undefined
            );

            if (response && response.paymentUrl) {
                // Redirect to payment gateway
                window.location.href = response.paymentUrl;
            } else {
                alert('Lỗi khi tạo thanh toán. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Lỗi khi tạo thanh toán. Vui lòng thử lại!');
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-tet-primary">
                    Lịch sử giao dịch
                </h3>
                {orderStatus === 'PENDING' && orderId && (
                    <button
                        onClick={handleRetryPayment}
                        disabled={isRetrying}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold"
                    >
                        {isRetrying ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CreditCard size={16} /> Thanh toán lại
                            </>
                        )}
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-tet-primary" />
                </div>
            ) : payments.length > 0 ? (
                <div className="space-y-3">
                    {payments.map((payment) => (
                        <div
                            key={payment.paymentId}
                            className={`p-4 rounded-2xl border flex items-center justify-between ${getPaymentStatusColorClass(payment.status)}`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">
                                        {getPaymentStatusIcon(payment.status)}
                                    </span>
                                    <div>
                                        <p className="font-bold text-sm">
                                            {payment.paymentMethod}
                                        </p>
                                        <p className="text-xs opacity-75">
                                            {translatePaymentStatus(payment.status)}
                                            {payment.createdDate && ` • ${formatDate(payment.createdDate)}`}
                                        </p>
                                        {payment.transactionNo && (
                                            <p className="text-xs opacity-75 mt-1 font-mono">
                                                ID: {payment.transactionNo}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">
                                    {payment.amount.toLocaleString()}đ
                                </p>
                                {payment.transactionNo && (
                                    <button
                                        className="text-xs opacity-75 hover:opacity-100 transition-all ml-auto flex items-center gap-1 mt-2 cursor-pointer"
                                        onClick={() => {
                                            navigator.clipboard.writeText(payment.transactionNo!);
                                        }}
                                    >
                                        <Copy size={12} /> Sao chép mã
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <p className="text-gray-500 text-sm">
                        Chưa có giao dịch nào cho đơn hàng này
                    </p>
                </div>
            )}
        </section>
    );
}