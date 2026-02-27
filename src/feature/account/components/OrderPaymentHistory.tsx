import { Loader2, Copy, CreditCard, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { type PaymentTransaction, createPayment, paymentByWallet } from '@/feature/checkout/services/paymentService';
import { getWallet, type WalletResponse } from '@/feature/checkout/services/walletService';
import {
    translatePaymentStatus,
    getPaymentStatusColorClass,
    getPaymentStatusIcon
} from '../utils/paymentStatusUtils';
import { formatOrderDate } from '../utils/orderFilterUtils';

interface OrderPaymentHistoryProps {
    payments: PaymentTransaction[];
    isLoading: boolean;
    orderId?: number;
    orderStatus?: string;
    isAdmin?: boolean;
}

export default function OrderPaymentHistory({
    payments,
    isLoading,
    orderId,
    orderStatus,
    isAdmin = false
}: OrderPaymentHistoryProps) {
    const [isRetrying, setIsRetrying] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'VNPAY' | 'WALLET'>('VNPAY');
    const [wallet, setWallet] = useState<WalletResponse | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load wallet on mount
    useEffect(() => {
        const loadWallet = async () => {
            try {
                setWalletLoading(true);
                const token = localStorage.getItem('token');
                if (!token) return;

                const walletData = await getWallet(token);
                setWallet(walletData);
            } catch (err) {
                console.error('Error loading wallet:', err);
            } finally {
                setWalletLoading(false);
            }
        };

        loadWallet();
    }, []);

    const handleOpenPaymentModal = () => {
        setError(null);
        setShowPaymentModal(true);
    };

    const handleRetryPayment = async () => {
        if (!orderId) {
            setError('Không tìm thấy mã đơn hàng');
            return;
        }

        // Get the total amount from the last pending payment
        const lastPayment = payments.find(p => p.status === 'PENDING');
        const paymentAmount = lastPayment?.amount || 0;

        // Check wallet balance if paying by wallet
        if (selectedPaymentMethod === 'WALLET') {
            if (!wallet || wallet.balance < paymentAmount) {
                const needed = paymentAmount - (wallet?.balance || 0);
                setError(`Số dư ví không đủ. Bạn cần ${needed.toLocaleString()}đ nữa.`);
                return;
            }
        }

        try {
            setIsRetrying(true);
            setError(null);
            const token = localStorage.getItem('token') || undefined;

            if (selectedPaymentMethod === 'WALLET') {
                // Wallet payment
                await paymentByWallet(orderId, token);
                alert('Thanh toán bằng ví thành công!');
                setShowPaymentModal(false);
                // Reload window to refresh payment history
                window.location.reload();
            } else {
                // VNPAY payment
                const response = await createPayment(
                    {
                        orderId,
                        paymentMethod: 'VNPAY'
                    },
                    token
                );

                if (response && response.paymentUrl) {
                    // Redirect to payment gateway
                    window.location.href = response.paymentUrl;
                } else {
                    setError('Lỗi khi tạo thanh toán. Vui lòng thử lại!');
                }
            }
        } catch (err) {
            console.error('Error creating payment:', err);
            setError('Lỗi khi tạo thanh toán. Vui lòng thử lại!');
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
                {orderStatus === 'PENDING' && orderId && !isAdmin && (
                    <button
                        onClick={handleOpenPaymentModal}
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
                                            {payment.createdDate && ` • ${formatOrderDate(payment.createdDate)}`}
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

            {/* Payment Method Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-serif font-bold text-tet-primary">
                                Chọn phương thức thanh toán
                            </h2>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            {/* VNPAY Option */}
                            <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-blue-50"
                                style={{
                                    borderColor: selectedPaymentMethod === 'VNPAY' ? '#3b82f6' : '#e5e7eb'
                                }}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="VNPAY"
                                    checked={selectedPaymentMethod === 'VNPAY'}
                                    onChange={() => {
                                        setSelectedPaymentMethod('VNPAY');
                                        setError(null);
                                    }}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <p className="font-bold text-sm">VNPay</p>
                                    <p className="text-xs text-gray-600">Thanh toán qua cổng VNPay</p>
                                </div>
                            </label>

                            {/* Wallet Option */}
                            <label
                                className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${wallet && wallet.balance > 0
                                    ? 'hover:bg-green-50'
                                    : 'opacity-50 cursor-not-allowed'
                                    }`}
                                style={{
                                    borderColor: selectedPaymentMethod === 'WALLET' ? '#10b981' : '#e5e7eb'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    value="WALLET"
                                    checked={selectedPaymentMethod === 'WALLET'}
                                    onChange={() => {
                                        setSelectedPaymentMethod('WALLET');
                                        setError(null);
                                    }}
                                    disabled={!wallet || wallet.balance <= 0}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <p className="font-bold text-sm">Ví đã lưu</p>
                                    {walletLoading ? (
                                        <p className="text-xs text-gray-600">Đang tải...</p>
                                    ) : wallet ? (
                                        <>
                                            <p className="text-xs text-gray-600">
                                                Số dư: <span className="font-bold text-green-600">{wallet.balance.toLocaleString()}đ</span>
                                            </p>
                                            {wallet.balance <= 0 && (
                                                <p className="text-xs text-red-600 mt-1">Số dư không đủ</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-600">Không thể tải thông tin ví</p>
                                    )}
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleRetryPayment}
                                disabled={isRetrying || walletLoading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm flex items-center justify-center gap-2"
                            >
                                {isRetrying && <Loader2 size={16} className="animate-spin" />}
                                {isRetrying ? 'Đang xử lý...' : 'Thanh toán'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}