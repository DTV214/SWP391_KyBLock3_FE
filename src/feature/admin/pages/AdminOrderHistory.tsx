import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

// Trạng thái đơn hàng đã thanh toán
const PAID_STATUSES = [
  "CONFIRMED",
  "PAID_WAITING_STOCK",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
];

const VAT_SEGMENT_COLORS = ["#C8102E", "#0EA5E9"];

export default function AdminOrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OrderResponse | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [cancelledOrder, setCancelledOrder] = useState<OrderResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const {
    allOrders,
    filteredOrders,
    paginatedOrders,
    isLoading,
    error,
    quotationType,
    sortBy,
    currentPage,
    totalPages,
    handleQuotationTypeChange,
    handleVatTypeChange,
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

  // Tính toán doanh thu và lợi nhuận
  // Chỉ tính từ đơn hàng đã thanh toán và áp dụng các filter
  const calculateRevenueStats = () => {
    const paidOrders = filteredOrders.filter((order) =>
      PAID_STATUSES.includes(order.status)
    );

    if (paidOrders.length === 0) {
      return {
        totalRevenue: 0,
        averageActualRevenue: 0,
        averageProfit: 0,
        paidOrderCount: 0,
      };
    }

    // Tổng doanh thu từ totalPrice (tổng tiền đơn hàng)
    const sumTotalPrice = paidOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );

    // Tổng doanh thu thực nhận từ finalPrice (đã trừ voucher)
    const sumFinalPrice = paidOrders.reduce(
      (sum, order) => sum + (order.finalPrice || 0),
      0
    );

    // Tổng lợi nhuận từ actualRevenue
    const sumProfit = paidOrders.reduce(
      (sum, order) => sum + (order.actualRevenue || 0),
      0
    );

    return {
      totalRevenue: sumTotalPrice / paidOrders.length,
      averageActualRevenue: sumFinalPrice / paidOrders.length,
      averageProfit: sumProfit / paidOrders.length,
      paidOrderCount: paidOrders.length,
    };
  };

  const { totalRevenue, averageActualRevenue, averageProfit, paidOrderCount } =
    calculateRevenueStats();

  const vatSegmentData = useMemo(() => {
    const businessOrders = filteredOrders.filter((order) => order.requireVatInvoice);
    const retailOrders = filteredOrders.filter((order) => !order.requireVatInvoice);

    const retailRevenue = retailOrders.reduce(
      (sum, order) => sum + (order.finalPrice || 0),
      0,
    );
    const businessRevenue = businessOrders.reduce(
      (sum, order) => sum + (order.finalPrice || 0),
      0,
    );

    const retailVat = retailOrders.reduce(
      (sum, order) => sum + (order.vatAmount || 0),
      0,
    );
    const businessVat = businessOrders.reduce(
      (sum, order) => sum + (order.vatAmount || 0),
      0,
    );

    return {
      pieData: [
        { name: "Khách lẻ", value: retailOrders.length },
        { name: "Khách doanh nghiệp", value: businessOrders.length },
      ],
      revenueData: [
        {
          name: "Khách lẻ",
          orderCount: retailOrders.length,
          revenue: retailRevenue,
          vatAmount: retailVat,
        },
        {
          name: "Khách doanh nghiệp",
          orderCount: businessOrders.length,
          revenue: businessRevenue,
          vatAmount: businessVat,
        },
      ],
      totalCount: filteredOrders.length,
      totalVatAmount: retailVat + businessVat,
    };
  }, [filteredOrders]);

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
      {/* Revenue Summary Card */}
      <div className="bg-gradient-to-r from-tet-primary/10 to-tet-primary/5 border border-tet-primary/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-tet-primary">
            {"📊 Thống kê Doanh thu"}
          </p>
          <div className="grid grid-cols-3 gap-6">
            {/* Tổng doanh thu */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-600">
                {"Tổng doanh thu"}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {totalRevenue.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-xs text-gray-500">{"/đơn"}</span>
              </div>
            </div>

            {/* Doanh thu thực nhận trung bình */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-600">
                {"Doanh thu thực nhận"}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-tet-primary">
                  {averageActualRevenue.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-xs text-gray-500">{"/đơn"}</span>
              </div>
            </div>

            {/* Lợi nhuận trung bình */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-600">
                {"Lợi nhuận"}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  {averageProfit.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-xs text-gray-500">{"/đơn"}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {"Tính từ "}{paidOrderCount}{" đơn hàng đã thanh toán"}
          </p>
        </div>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-2 mb-4">
          <h3 className="text-base font-bold text-tet-primary">
            VAT theo nhóm khách hàng
          </h3>
          <p className="text-xs text-gray-500">
            Theo bộ lọc hiện tại: {vatSegmentData.totalCount} đơn hàng, tổng VAT {" "}
            {vatSegmentData.totalVatAmount.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="h-[280px]">
            <p className="text-xs font-semibold text-gray-600 mb-2">Tỷ trọng số đơn</p>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vatSegmentData.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {vatSegmentData.pieData.map((_, index) => (
                    <Cell
                      key={`vat-segment-${index}`}
                      fill={VAT_SEGMENT_COLORS[index % VAT_SEGMENT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} đơn`, "Số đơn"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[280px]">
            <p className="text-xs font-semibold text-gray-600 mb-2">Doanh thu theo nhóm</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vatSegmentData.revenueData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    value >= 1000000000
                      ? `${(value / 1000000000).toFixed(1)} Tỷ`
                      : value >= 1000000
                        ? `${(value / 1000000).toFixed(0)} Tr`
                        : `${(value / 1000).toFixed(0)} K`
                  }
                />
                <Tooltip
                  formatter={(value, name) => {
                    const numericValue =
                      typeof value === "number"
                        ? value
                        : Number(value ?? 0);
                    const label =
                      name === "revenue"
                        ? "Doanh thu"
                        : name === "vatAmount"
                          ? "VAT"
                          : "Giá trị";

                    return [
                      numericValue.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }),
                      label,
                    ];
                  }}
                />
                <Bar dataKey="revenue" fill="#C8102E" radius={[8, 8, 0, 0]} />
                <Bar dataKey="vatAmount" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <OrderFilters
        onSearchChange={handleSearch}
        onStatusChange={handleStatusFilterChange}
        onVatTypeChange={handleVatTypeChange}
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
