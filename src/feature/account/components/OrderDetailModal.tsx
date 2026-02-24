import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Edit2, Save, X as XIcon, Copy } from 'lucide-react';
import type { OrderResponse, OrderItem } from '@/feature/checkout/services/orderService';
import { formatOrderDate } from '../utils/orderFilterUtils';
import {
    translateOrderStatus,
    getStatusColorClass,
} from '../utils/orderStatusUtils';
import {
    translatePaymentStatus,
    getPaymentStatusColorClass,
    getPaymentStatusIcon,
} from '../utils/paymentStatusUtils';
import { paymentService, type PaymentTransaction } from '@/feature/checkout/services/paymentService';

interface OrderDetailModalProps {
    order: OrderResponse;
    isOpen: boolean;
    onClose: () => void;
}

export default function OrderDetailModal({
    order,
    isOpen,
    onClose,
}: OrderDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [editData, setEditData] = useState({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerAddress: order.customerAddress,
        note: order.note,
    });

    // Load payments
    useEffect(() => {
        if (isOpen) {
            loadPayments();
        }
    }, [isOpen, order.orderId]);

    const loadPayments = async () => {
        try {
            setPaymentsLoading(true);
            const token = localStorage.getItem('token') || undefined;
            const data = await paymentService.getPaymentsByOrder(order.orderId, token);
            setPayments(data);
        } catch (error) {
            console.error('Error loading payments:', error);
        } finally {
            setPaymentsLoading(false);
        }
    };

    const handleEditChange = (field: string, value: string) => {
        setEditData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = () => {
        // TODO: Save changes to backend
        console.log('Save order changes:', editData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditData({
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail,
            customerAddress: order.customerAddress,
            note: order.note,
        });
        setIsEditing(false);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[2rem] shadow-2xl max-h-[90vh] w-full max-w-4xl overflow-y-auto"
            >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-tet-primary">
                            Mã đơn: #{order.orderId}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {formatOrderDate(order.orderDateTime)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-8">
                    {/* Status Section */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Trạng thái đơn hàng
                            </p>
                            <p
                                className={`text-sm px-3 py-1 rounded-full border font-bold inline-block mt-2 ${getStatusColorClass(order.status)}`}
                            >
                                {translateOrderStatus(order.status)}
                            </p>
                        </div>
                        {order.promotionCode && (
                            <div className="ml-auto">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Mã giảm giá
                                </p>
                                <p className="text-sm font-bold text-green-600 mt-1">
                                    {order.promotionCode}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Order Info Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-serif font-bold text-tet-primary">
                                Thông tin giao hàng
                            </h3>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-tet-primary text-white rounded-xl hover:bg-tet-accent transition-all text-sm font-bold"
                                >
                                    <Edit2 size={16} /> Chỉnh sửa
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl">
                            {/* Editable Fields */}
                            {isEditing ? (
                                <>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Họ và tên
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.customerName}
                                            onChange={(e) =>
                                                handleEditChange('customerName', e.target.value)
                                            }
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-secondary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.customerPhone}
                                            onChange={(e) =>
                                                handleEditChange('customerPhone', e.target.value)
                                            }
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-secondary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={editData.customerEmail}
                                            onChange={(e) =>
                                                handleEditChange('customerEmail', e.target.value)
                                            }
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-secondary outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Địa chỉ giao hàng
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.customerAddress}
                                            onChange={(e) =>
                                                handleEditChange('customerAddress', e.target.value)
                                            }
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-secondary outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Ghi chú
                                        </label>
                                        <textarea
                                            value={editData.note}
                                            onChange={(e) =>
                                                handleEditChange('note', e.target.value)
                                            }
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-secondary outline-none resize-none h-20"
                                        />
                                    </div>

                                    {/* Edit Buttons */}
                                    <div className="md:col-span-2 flex gap-3">
                                        <button
                                            onClick={handleSave}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold"
                                        >
                                            <Save size={18} /> Lưu thay đổi
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-bold"
                                        >
                                            <XIcon size={18} /> Hủy
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Họ và tên
                                        </p>
                                        <p className="text-sm font-bold text-tet-primary mt-1">
                                            {order.customerName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Số điện thoại
                                        </p>
                                        <p className="text-sm font-bold text-tet-primary mt-1">
                                            {order.customerPhone}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Email
                                        </p>
                                        <p className="text-sm font-bold text-tet-primary mt-1">
                                            {order.customerEmail}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Địa chỉ giao hàng
                                        </p>
                                        <p className="text-sm font-bold text-tet-primary mt-1">
                                            {order.customerAddress}
                                        </p>
                                    </div>
                                    {order.note && (
                                        <div className="md:col-span-2">
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                                Ghi chú
                                            </p>
                                            <p className="text-sm font-bold text-tet-primary mt-1">
                                                {order.note}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    {/* Order Items Section */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-serif font-bold text-tet-primary">
                            Sản phẩm đơn hàng
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {order.items.map((item: OrderItem) => (
                                <div
                                    key={item.orderDetailId}
                                    className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100"
                                >
                                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.productName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tet-secondary to-tet-primary/10">
                                                <span className="text-xl">🎁</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-tet-primary">
                                            {item.productName}
                                        </h4>
                                        <p className="text-xs text-gray-400 uppercase font-bold">
                                            SKU: {item.sku}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm text-gray-600">
                                                x{item.quantity}
                                            </span>
                                            <span className="font-bold text-tet-primary">
                                                {item.amount.toLocaleString()}đ
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Price Summary Section */}
                    <section className="space-y-4 p-4 bg-gradient-to-br from-tet-bg/20 to-tet-secondary/5 rounded-2xl border border-tet-secondary/10">
                        <h3 className="text-lg font-serif font-bold text-tet-primary">
                            Tính toán giá
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tạm tính</span>
                                <span className="font-bold text-tet-primary">
                                    {order.totalPrice.toLocaleString()}đ
                                </span>
                            </div>
                            {order.discountValue && order.discountValue > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-bold">
                                    <span>Giảm giá ({order.promotionCode})</span>
                                    <span>-{order.discountValue.toLocaleString()}đ</span>
                                </div>
                            )}
                            <div className="border-t border-gray-200 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-serif font-bold text-tet-primary uppercase">
                                    Tổng cộng
                                </span>
                                <span className="text-2xl font-black text-tet-primary">
                                    {order.finalPrice.toLocaleString()}đ
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Payments Section */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-serif font-bold text-tet-primary">
                            Lịch sử giao dịch
                        </h3>

                        {paymentsLoading ? (
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
                                                    </p>
                                                    {payment.transactionNo && (
                                                        <p className="text-xs opacity-75 mt-1">
                                                            Mã giao dịch: {payment.transactionNo}
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
                                                    className="text-xs opacity-75 hover:opacity-100 transition-all flex items-center gap-1 mt-2 cursor-pointer"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(payment.transactionNo!);
                                                    }}
                                                >
                                                    <Copy size={12} /> Sao chép
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
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold"
                    >
                        Đóng
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
