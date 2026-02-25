// Order Status Constants and Utilities
export const ORDER_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PAID_WAITING_STOCK: 'PAID_WAITING_STOCK',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Translate English status to Vietnamese
export const translateOrderStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        PENDING: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        PROCESSING: 'Đang xử lý',
        COMPLETED: 'Đã giao',
        CANCELLED: 'Đã hủy',
    };
    return statusMap[status] || status;
};

// Get status color for UI
export const getStatusColorClass = (status: string): string => {
    const colorMap: Record<string, string> = {
        PENDING: 'text-amber-600 bg-amber-50 border-amber-100',
        CONFIRMED: 'text-blue-600 bg-blue-50 border-blue-100',
        PROCESSING: 'text-purple-600 bg-purple-50 border-purple-100',
        COMPLETED: 'text-green-600 bg-green-50 border-green-100',
        CANCELLED: 'text-red-600 bg-red-50 border-red-100',
    };
    return colorMap[status] || 'text-gray-600 bg-gray-50 border-gray-100';
};

// Check if order can be reordered
export const canReorder = (status: string): boolean => {
    return status === ORDER_STATUS.COMPLETED;
};

// Check if order can be cancelled
export const canCancel = (status: string): boolean => {
    return status === ORDER_STATUS.PENDING || status === ORDER_STATUS.CONFIRMED;
};
