import { motion } from 'framer-motion';
import { Calendar, CreditCard, RefreshCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { OrderResponse } from '@/feature/checkout/services/orderService';
import { updateOrderStatus } from '@/feature/checkout/services/orderService';
import UpdateOrderStatusSuccessModal from './UpdateOrderStatusSuccessModal';
import UpdateOrderStatusConfirmModal from './UpdateOrderStatusConfirmModal';
import {
    translateOrderStatus,
    getStatusColorClass,
    canReorder,
    canCancel,
} from '../utils/orderStatusUtils';
import { formatOrderDate } from '../utils/orderFilterUtils';

interface OrderCardProps {
    order: OrderResponse;
    onViewDetails: (orderId: number) => void;
    onReorder: (orderId: number) => void;
    onCancel: (orderId: number) => void;
    onStatusUpdate?: (updatedOrder: OrderResponse) => void;
    isAdmin?: boolean;
}

export default function OrderCard({
    order: initialOrder,
    onViewDetails,
    onReorder,
    onCancel,
    onStatusUpdate,
    isAdmin = false,
}: OrderCardProps) {
    const [order, setOrder] = useState(initialOrder);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [updatedOrder, setUpdatedOrder] = useState<OrderResponse | null>(null);
    const firstItem = order.items[0];
    const placeholder = 'https://via.placeholder.com/80?text=No+Image';

    // Update order when initialOrder changes
    useEffect(() => {
        setOrder(initialOrder);
    }, [initialOrder]);

    // Determine button visibility and action based on status
    const getStatusActionButton = () => {
        if (isAdmin) {
            // Admin logic: PENDING (disabled) -> CONFIRMED/PAID_WAITING_STOCK (PROCESSING) -> PROCESSING (SHIPPED)
            if (order.status === 'PENDING') {
                return null; // Button disabled for PENDING status
            } else if (order.status === 'CONFIRMED' || order.status === 'PAID_WAITING_STOCK') {
                return {
                    label: 'Đang xử lí',
                    nextStatus: 'PROCESSING',
                    color: 'bg-blue-600 hover:bg-blue-700',
                };
            } else if (order.status === 'PROCESSING') {
                return {
                    label: 'Đã giao hàng',
                    nextStatus: 'SHIPPED',
                    color: 'bg-green-600 hover:bg-green-700',
                };
            }
        } else {
            // Customer logic: Only SHIPPED can be updated to DELIVERED
            if (order.status === 'SHIPPED') {
                return {
                    label: 'Đã nhận được hàng',
                    nextStatus: 'DELIVERED',
                    color: 'bg-green-600 hover:bg-green-700',
                };
            }
        }
        return null;
    };

    const handleStatusUpdateClick = () => {
        const actionButton = getStatusActionButton();
        if (!actionButton) return;

        // Show confirmation modal with pending status
        setPendingStatusChange(actionButton.nextStatus);
        setConfirmModalOpen(true);
    };

    const handleConfirmStatusUpdate = async () => {
        if (!pendingStatusChange) return;

        setIsUpdatingStatus(true);
        try {
            const token = localStorage.getItem('token');
            const response = await updateOrderStatus(
                order.orderId,
                pendingStatusChange,
                token || undefined
            );
            // Update order in component state
            setOrder(response);
            setUpdatedOrder(response);
            setSuccessModalOpen(true);
            // Notify parent component
            onStatusUpdate?.(response);
            // Reset pending status
            setPendingStatusChange(null);
        } catch (error) {
            console.error('Failed to update order status:', error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const statusActionButton = getStatusActionButton();

    return (
        <>
            <motion.div
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 group transition-all"
            >
                {/* Header của Card: Mã đơn & Ngày */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-tet-primary uppercase tracking-wider">
                            Mã đơn: #{order.orderId}
                        </span>
                        <span className="hidden sm:block text-gray-300">|</span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                            <Calendar size={14} /> {formatOrderDate(order.orderDateTime)}
                        </span>
                    </div>
                    <span
                        className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-widest ${getStatusColorClass(order.status)}`}
                    >
                        {translateOrderStatus(order.status)}
                    </span>
                </div>

                {/* Nội dung sản phẩm & Giá */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0">
                            <img
                                src={firstItem.imageUrl || placeholder}
                                alt={firstItem.productName}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-tet-primary line-clamp-1">
                                {firstItem.productName}
                            </h4>
                            <p className="text-xs text-gray-400 italic">
                                {order.items.length} sản phẩm
                            </p>
                            {order.items.length > 1 && (
                                <p className="text-[10px] text-gray-400">
                                    + {order.items.length - 1} sản phẩm khác
                                </p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-2">
                                <CreditCard size={12} />
                                <span>
                                    {order.promotionCode ? `${order.promotionCode} - ` : ''}
                                    Thanh toán: {order.status === 'PENDING' ? '(Chưa thanh toán)' : '(Đã thanh toán)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-0 pt-4 md:pt-0">
                        <div>
                            <p className="text-xl font-black text-tet-primary">
                                {order.finalPrice.toLocaleString()}đ
                            </p>
                            {order.discountValue && order.discountValue > 0 && (
                                <p className="text-[10px] text-green-600 font-bold italic">
                                    Tiết kiệm: {order.discountValue.toLocaleString()}đ
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                            <button
                                onClick={() => onViewDetails(order.orderId)}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
                            >
                                Xem chi tiết
                            </button>
                            {statusActionButton && onStatusUpdate ? (
                                <button
                                    onClick={handleStatusUpdateClick}
                                    disabled={isUpdatingStatus}
                                    className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${statusActionButton.color} ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isUpdatingStatus ? 'Đang cập nhật...' : statusActionButton.label}
                                </button>
                            ) : null}
                            {canReorder(order.status) ? (
                                <button
                                    onClick={() => onReorder(order.orderId)}
                                    className="px-4 py-2 rounded-xl bg-tet-primary text-white text-xs font-bold shadow-md hover:bg-tet-accent transition-all flex items-center gap-1.5"
                                >
                                    <RefreshCcw size={14} /> Mua lại
                                </button>
                            ) : canCancel(order.status) ? (
                                <button
                                    onClick={() => onCancel(order.orderId)}
                                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition-all"
                                >
                                    Hủy đơn
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Update Order Status Confirm Modal */}
            <UpdateOrderStatusConfirmModal
                order={order}
                isOpen={confirmModalOpen}
                newStatus={pendingStatusChange}
                onClose={() => {
                    setConfirmModalOpen(false);
                    setPendingStatusChange(null);
                }}
                onConfirm={handleConfirmStatusUpdate}
            />

            {/* Update Order Status Success Modal */}
            <UpdateOrderStatusSuccessModal
                order={updatedOrder}
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
            />
        </>
    );
}
