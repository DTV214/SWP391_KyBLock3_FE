import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  X,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { OrderResponse } from "@/feature/checkout/services/orderService";
import {
  allocateOrderStock,
  getOrderById,
  updateOrderStatus,
} from "@/feature/checkout/services/orderService";
import UpdateOrderStatusSuccessModal from "./UpdateOrderStatusSuccessModal";
import UpdateOrderStatusConfirmModal from "./UpdateOrderStatusConfirmModal";
import {
  translateOrderStatus,
  getStatusColorClass,
} from "../utils/orderStatusUtils";
import { formatOrderDate } from "../utils/orderFilterUtils";
import VatOrderBadge from "./VatOrderBadge";

interface OrderCardProps {
  order: OrderResponse;
  onViewDetails: (orderId: number) => void;
  onReorder: (orderId: number) => void; // Prop này sẽ tạm thời không được dùng ở giao diện
  onCancel: (orderId: number) => void;
  onStatusUpdate?: (updatedOrder: OrderResponse) => void;
  onFeedbackClick?: (orderId: number, isEdit: boolean) => void;
  onDeleteFeedbackClick?: (feedbackId: number) => void;
  isAdmin?: boolean;
}

export default function OrderCard({
  order: initialOrder,
  onViewDetails,
  onCancel,
  onStatusUpdate,
  onFeedbackClick,
  onDeleteFeedbackClick,
  isAdmin = false,
}: OrderCardProps) {
  const [order, setOrder] = useState(initialOrder);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(
    null,
  );
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [updatedOrder, setUpdatedOrder] = useState<OrderResponse | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
    null,
  );
  const [showFloatingError, setShowFloatingError] = useState(false);
  const firstItem = order.items[0];
  const placeholder = "https://via.placeholder.com/80?text=No+Image";
  const actualRevenue = order.actualRevenue ?? null;

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const getDisplayStatusLabel = (status: string) => {
    if (isAdmin && status === "PAID_WAITING_STOCK") {
      return "Chưa xử lý do thiếu hàng";
    }
    return translateOrderStatus(status);
  };

  const getDisplayStatusColorClass = (status: string) => {
    if (isAdmin && status === "PAID_WAITING_STOCK") {
      return "text-amber-700 bg-amber-50 border-amber-200";
    }
    return getStatusColorClass(status);
  };

  const getStatusActionButton = () => {
    if (isAdmin) {
      if (order.status === "PENDING") return null;

      if (order.status === "CANCEL_REQUESTED") {
        return {
          label: "Duyệt Hủy Đơn",
          nextStatus: "CANCELLED",
          color: "bg-red-600 hover:bg-red-700 text-white",
        };
      }

      if (
        order.status === "CONFIRMED" ||
        order.status === "PAID_WAITING_STOCK"
      ) {
        return {
          label: "Đang xử lý",
          nextStatus: "PROCESSING",
          color: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      }

      if (order.status === "PROCESSING") {
        return {
          label: "Đã giao hàng",
          nextStatus: "SHIPPED",
          color: "bg-green-600 hover:bg-green-700 text-white",
        };
      }
    } else if (order.status === "SHIPPED") {
      return {
        label: "Đã nhận được hàng",
        nextStatus: "DELIVERED",
        color: "bg-green-600 hover:bg-green-700 text-white",
      };
    }

    return null;
  };

  const handleStatusUpdateClick = () => {
    const actionButton = getStatusActionButton();
    if (!actionButton) return;

    setStatusUpdateError(null);
    setShowFloatingError(false);
    setPendingStatusChange(actionButton.nextStatus);
    setConfirmModalOpen(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!pendingStatusChange) return;

    setIsUpdatingStatus(true);
    setStatusUpdateError(null);
    setShowFloatingError(false);
    const token = localStorage.getItem("token");
    const shouldAllocateQuotationStock =
      isAdmin &&
      pendingStatusChange === "PROCESSING" &&
      order.isQuotation === 1;
    try {
      let response: OrderResponse;
      if (shouldAllocateQuotationStock) {
        await allocateOrderStock(order.orderId, token || undefined);
        response = await getOrderById(order.orderId, token || undefined);
      } else {
        response = await updateOrderStatus(
          order.orderId,
          pendingStatusChange,
          token || undefined,
        );
      }

      setOrder(response);
      setUpdatedOrder(response);
      setSuccessModalOpen(true);
      onStatusUpdate?.(response);
      setPendingStatusChange(null);
    } catch (error) {
      console.error("Failed to update order status:", error);
      const apiMessage =
        (error as any)?.response?.data?.msg ||
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "Không thể cập nhật trạng thái đơn hàng";
      setStatusUpdateError(apiMessage);
      setShowFloatingError(true);

      if (shouldAllocateQuotationStock) {
        try {
          const latestOrder = await getOrderById(
            order.orderId,
            token || undefined,
          );
          setOrder(latestOrder);
          onStatusUpdate?.(latestOrder);
        } catch {
          if (apiMessage.toLowerCase().includes("thiếu hàng")) {
            const fallbackOrder = {
              ...order,
              status: "PAID_WAITING_STOCK",
            } as OrderResponse;
            setOrder(fallbackOrder);
            onStatusUpdate?.(fallbackOrder);
          }
        }
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const statusActionButton = getStatusActionButton();
  const isCancelable = ["PENDING", "CONFIRMED", "PAID_WAITING_STOCK"].includes(
    order.status,
  );

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 group transition-all"
      >
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
          <div className="flex flex-wrap items-center gap-2">
            {order.requireVatInvoice && <VatOrderBadge />}
            <span
              className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-widest ${getDisplayStatusColorClass(order.status)}`}
            >
              {getDisplayStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {statusUpdateError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">Không thể cập nhật đơn hàng</p>
            <p className="mt-1">{statusUpdateError}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0">
              <img
                src={firstItem?.imageUrl || placeholder}
                alt={firstItem?.productName || "Product image"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-tet-primary line-clamp-1">
                {firstItem?.productName || "Sản phẩm"}
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
                  {order.promotionCode ? `${order.promotionCode} - ` : ""}
                  Thanh toán:{" "}
                  {order.status === "PENDING"
                    ? "(Chưa thanh toán)"
                    : "(Đã thanh toán)"}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-0 pt-4 md:pt-0">
            <div>
              <p className="text-xl font-black text-tet-primary">
                {order.finalPayableAmount.toLocaleString()}đ
              </p>
              {order.requireVatInvoice && (
                <p className="text-[10px] text-blue-600 font-bold italic">
                  Đã bao gồm VAT: {order.vatAmount.toLocaleString()}đ
                </p>
              )}
              {isAdmin && (
                <p className="text-[10px] text-emerald-600 font-bold italic">
                  Doanh thu thực nhận:{" "}
                  {actualRevenue == null
                    ? "Chưa có dữ liệu"
                    : `${actualRevenue.toLocaleString()}đ`}
                </p>
              )}
              {order.discountValue > 0 && (
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

              {/* NÚT DUYỆT TRẠNG THÁI CHO ADMIN HOẶC XÁC NHẬN NHẬN HÀNG CHO USER */}
              {statusActionButton && (
                <button
                  onClick={handleStatusUpdateClick}
                  disabled={isUpdatingStatus}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${statusActionButton.color} ${isUpdatingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isUpdatingStatus
                    ? "Đang cập nhật..."
                    : statusActionButton.label}
                </button>
              )}

              {/* CHỈ HIỆN NÚT HỦY KHI ĐỦ ĐIỀU KIỆN VÀ LÀ USER (NÚT MUA LẠI ĐÃ ĐƯỢC XÓA) */}
              {isCancelable && !isAdmin && (
                <button
                  onClick={() => onCancel(order.orderId)}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition-all flex items-center gap-1.5"
                >
                  <X size={14} /> Yêu cầu hủy
                </button>
              )}

              {!isAdmin && order.status === "DELIVERED" && (
                <>
                  <button
                    onClick={() =>
                      onFeedbackClick &&
                      onFeedbackClick(order.orderId, !!order.feedback)
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
                      order.feedback
                        ? "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
                        : "bg-[#690000] text-[#FFF8F1] hover:bg-[#800000]"
                    }`}
                  >
                    <Star
                      size={14}
                      className={
                        order.feedback
                          ? "fill-amber-600 outline-none border-none"
                          : ""
                      }
                    />
                    {order.feedback ? "Sửa đánh giá" : "Đánh giá"}
                  </button>

                  {order.feedback && onDeleteFeedbackClick && (
                    <button
                      onClick={() =>
                        onDeleteFeedbackClick(order.feedback!.feedbackId)
                      }
                      className="px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all ml-1 flex items-center"
                      title="Xóa đánh giá"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Các Modals xác nhận vẫn giữ nguyên */}
      {showFloatingError && statusUpdateError && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed top-24 right-6 z-[200] max-w-md rounded-2xl border border-red-200 bg-white p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-600">
              <AlertTriangle size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">
                Không thể cập nhật đơn hàng
              </p>
              <p className="mt-1 text-sm text-gray-700">{statusUpdateError}</p>
            </div>
            <button
              onClick={() => setShowFloatingError(false)}
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Đóng thông báo lỗi"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}

      <UpdateOrderStatusConfirmModal
        order={order}
        isOpen={confirmModalOpen}
        newStatus={pendingStatusChange}
        resolveStatusLabel={getDisplayStatusLabel}
        onClose={() => {
          setConfirmModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={handleConfirmStatusUpdate}
      />

      <UpdateOrderStatusSuccessModal
        order={updatedOrder}
        isOpen={successModalOpen}
        resolveStatusLabel={getDisplayStatusLabel}
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
}

