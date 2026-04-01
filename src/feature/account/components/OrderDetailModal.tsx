import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Edit2, Save, X as XIcon, Package } from 'lucide-react';
import { type OrderResponse, type OrderItem, orderService } from '@/feature/checkout/services/orderService';
import { formatOrderDate } from '../utils/orderFilterUtils';
import {
    translateOrderStatus,
    getStatusColorClass,
} from '../utils/orderStatusUtils';
import { paymentService, type PaymentTransaction } from '@/feature/checkout/services/paymentService';
import { stockMovementService, type StockMovement } from '@/feature/admin/services/stockMovementService';
import OrderPaymentHistory from './OrderPaymentHistory';

interface OrderDetailModalProps {
    order: OrderResponse;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (updatedOrder: OrderResponse) => void;
    isAdmin?: boolean;
}

export default function OrderDetailModal({
    order,
    isOpen,
    onClose,
    onUpdate,
    isAdmin = false
}: OrderDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [displayOrder, setDisplayOrder] = useState<OrderResponse>(order);
    const [editData, setEditData] = useState({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerAddress: order.customerAddress,
        note: order.note,
    });
    const [stockMovementModal, setStockMovementModal] = useState({ isOpen: false, productId: 0, productName: '' });
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    const [stockMovementsLoading, setStockMovementsLoading] = useState(false);

    // Sync displayOrder with order prop when it changes
    useEffect(() => {
        setDisplayOrder(order);
        setEditData({
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail,
            customerAddress: order.customerAddress,
            note: order.note,
        });
    }, [order]);

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

    const loadStockMovements = async (productId: number, productName: string) => {
        try {
            setStockMovementsLoading(true);
            const token = localStorage.getItem('token') || undefined;
            const data = await stockMovementService.getStockMovementsByOrderAndProduct(
                order.orderId,
                productId,
                token
            );
            setStockMovements(data);
            setStockMovementModal({ isOpen: true, productId, productName });
        } catch (error) {
            console.error('Error loading stock movements:', error);
            alert('Không thể tải lịch sử di chuyển kho. Vui lòng thử lại!');
        } finally {
            setStockMovementsLoading(false);
        }
    };

    const handleEditChange = (field: string, value: string) => {
        setEditData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token') || undefined;
            const response = await orderService.updateOrderShippingInfo(order.orderId, editData, token);

            if (response) {
                // Update local display with new data
                setDisplayOrder(response);

                if (onUpdate) {
                    onUpdate(response);
                }

                // Show success message
                alert('Cập nhật thông tin giao hàng thành công!');

                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error saving order changes:', error);
            alert('Cập nhật thông tin giao hàng thất bại. Vui lòng thử lại!');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditData({
            customerName: displayOrder.customerName,
            customerPhone: displayOrder.customerPhone,
            customerEmail: displayOrder.customerEmail,
            customerAddress: displayOrder.customerAddress,
            note: displayOrder.note,
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
                            Mã đơn: #{displayOrder.orderId}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {formatOrderDate(displayOrder.orderDateTime)}
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
                                className={`text-sm px-3 py-1 rounded-full border font-bold inline-block mt-2 ${getStatusColorClass(displayOrder.status)}`}
                            >
                                {translateOrderStatus(displayOrder.status)}
                            </p>
                        </div>
                        {displayOrder.promotionCode && (
                            <div className="ml-auto">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Mã giảm giá
                                </p>
                                <p className="text-sm font-bold text-green-600 mt-1">
                                    {displayOrder.promotionCode}
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
                            {!isEditing && !isAdmin && (
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
                                            disabled={isSaving}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" /> Đang lưu...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={18} /> Lưu thay đổi
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={isSaving}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
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
                                            {displayOrder.customerName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Số điện thoại
                                        </p>
                                        <p className="text-sm font-bold text-tet-primary mt-1">
                                            {displayOrder.customerPhone}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Email
                                        </p>
                                        <p className="text-sm font-bold text-tet-primary mt-1">
                                            {displayOrder.customerEmail}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            Địa chỉ giao hàng
                                        </p>
                                        <p className="text-sm font-bold text-tet-primary mt-1">
                                            {displayOrder.customerAddress}
                                        </p>
                                    </div>
                                    {displayOrder.note && (
                                        <div className="md:col-span-2">
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                                Ghi chú
                                            </p>
                                            <p className="text-sm font-bold text-tet-primary mt-1">
                                                {displayOrder.note}
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
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {displayOrder.items.map((item: OrderItem) => (
                                <div key={item.orderDetailId} className="space-y-2">
                                    {/* Main item */}
                                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
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
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold text-tet-primary">
                                                    {item.productName}
                                                </h4>

                                                {isAdmin && (!item.productDetails || item.productDetails.length === 0) && (
                                                    <button
                                                        onClick={() => loadStockMovements(item.productId, item.productName)}
                                                        disabled={stockMovementsLoading}
                                                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-sm transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                                                        title="Xem lịch sử di chuyển kho"
                                                    >
                                                        <Package className="w-4 h-4" />
                                                        Kho
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 uppercase font-bold">
                                                SKU: {item.sku}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-sm text-gray-600">
                                                    {(item.amount / item.quantity).toLocaleString()}đ x{item.quantity}
                                                </span>
                                                <span className="text-sm text-gray-600">

                                                </span>
                                                <span className="font-bold text-tet-primary ml-auto">
                                                    {item.amount.toLocaleString()}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Details (nested items) */}
                                    {item.productDetails && item.productDetails.length > 0 && (
                                        <div className="ml-4 space-y-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                                                📦 Sản phẩm trong giỏ:
                                            </p>
                                            {item.productDetails.map((detail: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="flex gap-3 p-3 bg-white rounded-lg border border-blue-100"
                                                >
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                                        {detail.imageurl ? (
                                                            <img
                                                                src={detail.imageurl}
                                                                alt={detail.productname}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                                                <span className="text-xs">📷</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-700">
                                                            {detail.productname}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-sm font-bold text-blue-600">
                                                                x{detail.quantity}
                                                            </span>
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => loadStockMovements(detail.productId || 0, detail.productname || '')}
                                                                    disabled={stockMovementsLoading}
                                                                    className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-bold text-xs transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
                                                                    title="Xem lịch sử di chuyển kho"
                                                                >
                                                                    <Package className="w-3 h-3" />
                                                                    Kho
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                    {displayOrder.totalPrice.toLocaleString()}đ
                                </span>
                            </div>
                            {displayOrder.discountValue && displayOrder.discountValue > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-bold">
                                    <span>Giảm giá ({displayOrder.promotionCode})</span>
                                    <span>-{displayOrder.discountValue.toLocaleString()}đ</span>
                                </div>
                            )}
                            <div className="border-t border-gray-200 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-serif font-bold text-tet-primary uppercase">
                                    Tổng cộng
                                </span>
                                <span className="text-2xl font-black text-tet-primary">
                                    {displayOrder.finalPrice.toLocaleString()}đ
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Payments Section */}
                    <OrderPaymentHistory
                        payments={payments}
                        isLoading={paymentsLoading}
                        orderId={displayOrder.orderId}
                        orderStatus={displayOrder.status}
                        isAdmin={isAdmin}
                    />
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

            {/* Stock Movement Modal */}
            {stockMovementModal.isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-110 flex items-center justify-center p-4"
                    onClick={() => setStockMovementModal({ ...stockMovementModal, isOpen: false })}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-[2rem] shadow-2xl max-h-[80vh] w-full max-w-2xl overflow-y-auto"
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <Package className="w-6 h-6 text-blue-600" />
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-tet-primary">
                                        Lịch sử di chuyển kho
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {stockMovementModal.productName}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setStockMovementModal({ ...stockMovementModal, isOpen: false })}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {stockMovementsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-tet-primary animate-spin" />
                                </div>
                            ) : stockMovements.length > 0 ? (
                                <div className="space-y-3">
                                    {stockMovements.map((movement) => (
                                        <div
                                            key={movement.stockmovementid}
                                            className={`p-4 rounded-xl border-l-4 ${movement.quantity > 0
                                                ? 'bg-green-50 border-l-green-500'
                                                : 'bg-red-50 border-l-red-500'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">
                                                        {movement.quantity > 0 ? '📥' : '📤'}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-700">
                                                            {movement.note}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(movement.movementdate).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`font-bold text-lg ${movement.quantity > 0
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                        }`}
                                                >
                                                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 pl-8 space-y-1">
                                                <p>ID Kho: {movement.stockid}</p>
                                                <p>ID di chuyển: {movement.stockmovementid}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>Không có lịch sử di chuyển kho cho sản phẩm này</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setStockMovementModal({ ...stockMovementModal, isOpen: false })}
                                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold"
                            >
                                Đóng
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}
