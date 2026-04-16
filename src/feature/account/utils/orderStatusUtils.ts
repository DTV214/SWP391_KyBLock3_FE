// Order Status Constants and Utilities
export const ORDER_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PAID_WAITING_STOCK: "PAID_WAITING_STOCK",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  CANCEL_REQUESTED: "CANCEL_REQUESTED", // Thêm trạng thái mới
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Translate English status to Vietnamese
export const translateOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: "Chờ thanh toán",
    CONFIRMED: "Đã thanh toán",
    PAID_WAITING_STOCK: "Chưa xử lý (Thiếu hàng)",
    PROCESSING: "Đang xử lý",
    SHIPPED: "Đã giao hàng",
    DELIVERED: "Đã nhận hàng",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    CANCEL_REQUESTED: "Yêu cầu hủy", // Dịch trạng thái
  };
  return statusMap[status] || status;
};

// Get status color for UI
export const getStatusColorClass = (status: string): string => {
  const colorMap: Record<string, string> = {
    PENDING: "text-amber-600 bg-amber-50 border-amber-100",
    CONFIRMED: "text-blue-600 bg-blue-50 border-blue-100",
    PAID_WAITING_STOCK: "text-amber-700 bg-amber-50 border-amber-200",
    PROCESSING: "text-purple-600 bg-purple-50 border-purple-100",
    SHIPPED: "text-indigo-600 bg-indigo-50 border-indigo-100",
    DELIVERED: "text-green-600 bg-green-50 border-green-100",
    COMPLETED: "text-green-600 bg-green-50 border-green-100",
    CANCELLED: "text-gray-500 bg-gray-50 border-gray-200",
    CANCEL_REQUESTED:
      "text-red-600 bg-red-50 border-red-200 shadow-sm animate-pulse", // Highlight nổi bật cho Admin thấy
  };
  return colorMap[status] || "text-gray-600 bg-gray-50 border-gray-100";
};

export const canReorder = (status: string): boolean => {
  return ["DELIVERED", "COMPLETED", "CANCELLED"].includes(status);
};

export const canCancel = (status: string): boolean => {
  // Khách hàng có thể YÊU CẦU HỦY khi ở 3 trạng thái này
  return ["PENDING", "CONFIRMED", "PAID_WAITING_STOCK"].includes(status);
};
