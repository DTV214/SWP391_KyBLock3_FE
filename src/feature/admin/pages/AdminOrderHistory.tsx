import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAdminOrderHistory } from "../hooks/useAdminOrderHistory";
import OrderFilters from "@/feature/account/components/OrderFilters";
import OrderCard from "@/feature/account/components/OrderCard";
import OrderDetailModal from "@/feature/account/components/OrderDetailModal";
import CancelOrderConfirmModal from "@/feature/account/components/CancelOrderConfirmModal";
import CancelOrderSuccessModal from "@/feature/account/components/CancelOrderSuccessModal";
import {
  orderService,
  type OrderResponse,
} from "@/feature/checkout/services/orderService";
import type { SortBy } from "@/feature/account/utils/orderFilterUtils";

export default function AdminOrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OrderResponse | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [cancelledOrder, setCancelledOrder] = useState<OrderResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const {
    allOrders,
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
  } = useAdminOrderHistory();

  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams<{ orderId?: string }>();
  const baseOrderPath = location.pathname.startsWith("/staff")
    ? "/staff/orders"
    : "/admin/orders";
  const currentOrderId = orderId ? Number(orderId) : null;

  useEffect(() => {
    if (currentOrderId === null) {
      setSelectedOrder(null);
      setDetailError(null);
      return;
    }

    if (!Number.isInteger(currentOrderId) || currentOrderId <= 0) {
      navigate(baseOrderPath, { replace: true });
      return;
    }

    if (isLoading) return;

    const orderInAllOrders = allOrders.find(
      (order) => order.orderId === currentOrderId,
    );

    if (orderInAllOrders) {
      setSelectedOrder(orderInAllOrders);
      setDetailError(null);
      return;
    }

    setSelectedOrder(null);
    setDetailError(
      `Kh\u00f4ng t\u00ecm th\u1ea5y \u0111\u01a1n h\u00e0ng #${currentOrderId}.`,
    );
  }, [allOrders, baseOrderPath, currentOrderId, isLoading, navigate]);

  const handleViewDetails = (targetOrderId: number) => {
    navigate(`${baseOrderPath}/${targetOrderId}`);
  };

  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
    setDetailError(null);
    navigate(baseOrderPath);
  };

  const handleReorder = (targetOrderId: number) => {
    console.log("Reorder:", targetOrderId);
  };

  const handleCancel = (targetOrderId: number) => {
    const order = paginatedOrders.find((o) => o.orderId === targetOrderId);
    if (order) {
      setOrderToCancel(order);
      setCancelModalOpen(true);
    }
  };

  const handleConfirmCancel = async (targetOrderId: number) => {
    try {
      const token = localStorage.getItem("token");
      const updatedOrder = await orderService.cancelOrder(
        targetOrderId,
        token || undefined,
      );
      updateOrderInList(updatedOrder);
      setCancelledOrder(updatedOrder);
      setSuccessModalOpen(true);
      setCancelModalOpen(false);
      setOrderToCancel(null);
      if (selectedOrder?.orderId === updatedOrder.orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (err: any) {
      throw new Error(err.message || "Kh\u00f4ng th\u1ec3 h\u1ee7y \u0111\u01a1n h\u00e0ng");
    }
  };

  const handleStatusUpdate = (updatedOrder: OrderResponse) => {
    updateOrderInList(updatedOrder);
    if (selectedOrder?.orderId === updatedOrder.orderId) {
      setSelectedOrder(updatedOrder);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-tet-primary" />
          <p className="text-gray-600">
            {"\u0110ang t\u1ea3i danh s\u00e1ch \u0111\u01a1n h\u00e0ng..."}
          </p>
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
      <OrderFilters
        onSearchChange={handleSearch}
        onStatusChange={handleStatusFilterChange}
        onDateRangeChange={handleDateRangeChange}
        onSortChange={(sort) => handleSort(sort as SortBy)}
        sortBy={sortBy}
      />

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 inline-flex gap-2">
        <button
          onClick={() => handleQuotationTypeChange("normal")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            quotationType === "normal"
              ? "bg-tet-primary text-white shadow-md"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {"\u0110\u01a1n h\u00e0ng th\u01b0\u1eddng"}
        </button>
        <button
          onClick={() => handleQuotationTypeChange("quotation")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            quotationType === "quotation"
              ? "bg-tet-primary text-white shadow-md"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {"\u0110\u01a1n t\u1eeb quotation"}
        </button>
      </div>

      {detailError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
          {detailError}
        </div>
      )}

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
              isAdmin
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-bold text-gray-600 mb-2">
            {"Kh\u00f4ng c\u00f3 \u0111\u01a1n h\u00e0ng"}
          </p>
          <p className="text-sm text-gray-400">
            {quotationType === "quotation"
              ? "Kh\u00f4ng c\u00f3 \u0111\u01a1n quotation ph\u00f9 h\u1ee3p v\u1edbi b\u1ed9 l\u1ecdc."
              : "Kh\u00f4ng c\u00f3 \u0111\u01a1n h\u00e0ng th\u01b0\u1eddng n\u00e0o ho\u1eb7c kh\u00f4ng c\u00f3 \u0111\u01a1n h\u00e0ng ph\u00f9 h\u1ee3p v\u1edbi b\u1ed9 l\u1ecdc."}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-[#FBF5E8] hover:text-tet-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {"Tr\u01b0\u1edbc"}
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            if (totalPages <= 5) return i + 1;
            if (currentPage <= 3) return i + 1;
            if (currentPage >= totalPages - 2) return totalPages - 4 + i;
            return currentPage - 2 + i;
          }).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                page === currentPage
                  ? "bg-tet-primary text-white shadow-lg"
                  : "border border-gray-100 text-sm text-gray-400 hover:bg-[#FBF5E8]"
              }`}
            >
              {page}
            </button>
          ))}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span className="text-gray-400">...</span>
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-[#FBF5E8] hover:text-tet-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={handleCloseOrderDetails}
          onUpdate={updateOrderInList}
          isAdmin
        />
      )}

      <CancelOrderConfirmModal
        order={orderToCancel}
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
      />

      <CancelOrderSuccessModal
        order={cancelledOrder}
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />
    </motion.div>
  );
}
