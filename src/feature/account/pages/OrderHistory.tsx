import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useOrderHistory } from '../hooks/useOrderHistory';
import OrderFilters from '../components/OrderFilters';
import OrderCard from '../components/OrderCard';
import OrderDetailModal from '../components/OrderDetailModal';
import CancelOrderConfirmModal from '../components/CancelOrderConfirmModal';
import CancelOrderSuccessModal from '../components/CancelOrderSuccessModal';
import { orderService, type OrderResponse } from '@/feature/checkout/services/orderService';
import type { SortBy } from '../utils/orderFilterUtils';

export default function OrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OrderResponse | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [cancelledOrder, setCancelledOrder] = useState<OrderResponse | null>(null);
  const {
    filteredOrders,
    isLoading,
    error,
    sortBy,
    handleStatusFilterChange,
    handleDateRangeChange,
    handleSearch,
    handleSort,
    updateOrderInList
  } = useOrderHistory();

  const handleViewDetails = (orderId: number) => {
    const order = filteredOrders.find((o) => o.orderId === orderId);
    if (order) {
      setSelectedOrder(order);
    }
  };

  const handleReorder = (orderId: number) => {
    console.log('Reorder:', orderId);
    // TODO: Implement reorder functionality
  };

  const handleCancel = (orderId: number) => {
    const order = filteredOrders.find((o) => o.orderId === orderId);
    if (order) {
      setOrderToCancel(order);
      setCancelModalOpen(true);
    }
  };

  const handleConfirmCancel = async (orderId: number) => {
    try {
      const token = localStorage.getItem('token');
      const updatedOrder = await orderService.cancelOrder(orderId, token || undefined);
      updateOrderInList(updatedOrder);
      setCancelledOrder(updatedOrder);
      setSuccessModalOpen(true);
      setCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (err: any) {
      throw new Error(err.message || 'Không thể hủy đơn hàng');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-tet-primary" />
          <p className="text-gray-600">Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <OrderFilters
        onSearchChange={handleSearch}
        onStatusChange={handleStatusFilterChange}
        onDateRangeChange={handleDateRangeChange}
        onSortChange={(sort) => handleSort(sort as SortBy)}
        sortBy={sortBy}
      />

      {/* DANH SÁCH ĐƠN HÀNG */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onViewDetails={handleViewDetails}
              onReorder={handleReorder}
              onCancel={handleCancel}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-bold text-gray-600 mb-2">Không có đơn hàng</p>
          <p className="text-sm text-gray-400">
            Bạn chưa có đơn hàng nào hoặc không có đơn hàng phù hợp với bộ lọc.
          </p>
        </div>
      )}

      {/* PAGINATION - To be implemented */}
      {filteredOrders.length > 10 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button className="px-4 py-2 rounded-xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-[#FBF5E8] hover:text-tet-primary transition-all">
            Trước
          </button>
          <button className="w-10 h-10 rounded-xl bg-tet-primary text-white font-bold shadow-lg">
            1
          </button>
          <button className="w-10 h-10 rounded-xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-[#FBF5E8]">
            2
          </button>
          <button className="px-4 py-2 rounded-xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-[#FBF5E8] hover:text-tet-primary transition-all">
            Sau
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={updateOrderInList}
          isAdmin={false}
        />
      )}

      {/* Cancel Order Confirm Modal */}
      <CancelOrderConfirmModal
        order={orderToCancel}
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
      />

      {/* Cancel Order Success Modal */}
      <CancelOrderSuccessModal
        order={cancelledOrder}
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />
    </motion.div>
  );
}
