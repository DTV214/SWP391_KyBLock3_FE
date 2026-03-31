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
    paginatedOrders,
    isLoading,
    error,
    quotationType,
    sortBy,
    currentPage,
    totalPages,
    handleQuotationTypeChange,
    handleStatusFilterChange,
    handleDateRangeChange,
    handleSearch,
    handleSort,
    goToPage,
    updateOrderInList,
  } = useOrderHistory();

  const handleViewDetails = (orderId: number) => {
    const order = paginatedOrders.find((o) => o.orderId === orderId);
    if (order) {
      setSelectedOrder(order);
    }
  };

  const handleReorder = (orderId: number) => {
    console.log('Reorder:', orderId);
    // TODO: Implement reorder functionality
  };

  const handleCancel = (orderId: number) => {
    const order = paginatedOrders.find((o) => o.orderId === orderId);
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

  const handleStatusUpdate = (updatedOrder: OrderResponse) => {
    updateOrderInList(updatedOrder);
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

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 inline-flex gap-2">
        <button
          onClick={() => handleQuotationTypeChange('normal')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            quotationType === 'normal'
              ? 'bg-tet-primary text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Đơn hàng thường
        </button>
        <button
          onClick={() => handleQuotationTypeChange('quotation')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            quotationType === 'quotation'
              ? 'bg-tet-primary text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Đơn từ quotation
        </button>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG */}
      {paginatedOrders.length > 0 ? (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onViewDetails={handleViewDetails}
              onReorder={handleReorder}
              onCancel={handleCancel}
              onStatusUpdate={handleStatusUpdate}
              isAdmin={false}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-bold text-gray-600 mb-2">Không có đơn hàng</p>
          <p className="text-sm text-gray-400">
            {quotationType === 'quotation'
              ? 'Không có đơn quotation phù hợp với bộ lọc.'
              : 'Bạn chưa có đơn hàng thường nào hoặc không có đơn hàng phù hợp với bộ lọc.'}
          </p>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          {/* Previous Button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-[#FBF5E8] hover:text-tet-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            if (totalPages <= 5) {
              return i + 1;
            }

            if (currentPage <= 3) {
              return i + 1;
            }

            if (currentPage >= totalPages - 2) {
              return totalPages - 4 + i;
            }

            return currentPage - 2 + i;
          }).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                page === currentPage
                  ? 'bg-tet-primary text-white shadow-lg'
                  : 'border border-gray-100 text-sm text-gray-400 hover:bg-[#FBF5E8]'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Show ellipsis if needed */}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span className="text-gray-400">...</span>
          )}

          {/* Next Button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-[#FBF5E8] hover:text-tet-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
