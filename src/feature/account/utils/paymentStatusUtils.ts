// Payment Status Constants and Utilities
export const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Translate payment status to Vietnamese
export const translatePaymentStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        PENDING: 'Chờ thanh toán',
        SUCCESS: 'Thành công',
        FAILED: 'Thất bại',
        CANCELLED: 'Đã hủy',
    };
    return statusMap[status] || status;
};

// Get payment status color for UI
export const getPaymentStatusColorClass = (status: string): string => {
    const colorMap: Record<string, string> = {
        PENDING: 'text-amber-600 bg-amber-50 border-amber-100',
        SUCCESS: 'text-green-600 bg-green-50 border-green-100',
        FAILED: 'text-red-600 bg-red-50 border-red-100',
        CANCELLED: 'text-gray-600 bg-gray-50 border-gray-100',
    };
    return colorMap[status] || 'text-gray-600 bg-gray-50 border-gray-100';
};

// Get payment status icon
export const getPaymentStatusIcon = (status: string): string => {
    const iconMap: Record<string, string> = {
        PENDING: '⏳',
        SUCCESS: '✅',
        FAILED: '❌',
        CANCELLED: '🚫',
    };
    return iconMap[status] || '•';
};
