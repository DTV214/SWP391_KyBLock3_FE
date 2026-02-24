import type { OrderResponse } from '@/feature/checkout/services/orderService';

// Types for filtering and sorting
export interface OrderFilters {
    status?: string;
    startDate?: Date;
    endDate?: Date;
    minPrice?: number;
    maxPrice?: number;
    searchQuery?: string;
}

export type SortBy = 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'none';

// Sort Orders
export const sortOrders = (
    orders: OrderResponse[],
    sortBy: SortBy
): OrderResponse[] => {
    const sorted = [...orders];

    switch (sortBy) {
        case 'date-desc':
            return sorted.sort(
                (a, b) =>
                    new Date(b.orderDateTime).getTime() - new Date(a.orderDateTime).getTime()
            );
        case 'date-asc':
            return sorted.sort(
                (a, b) =>
                    new Date(a.orderDateTime).getTime() - new Date(b.orderDateTime).getTime()
            );
        case 'price-desc':
            return sorted.sort((a, b) => b.finalPrice - a.finalPrice);
        case 'price-asc':
            return sorted.sort((a, b) => a.finalPrice - b.finalPrice);
        case 'none':
        default:
            return sorted;
    }
};

// Filter Orders
export const filterOrders = (
    orders: OrderResponse[],
    filters: OrderFilters
): OrderResponse[] => {
    return orders.filter((order) => {
        // Filter by status
        if (filters.status && order.status !== filters.status) {
            return false;
        }

        // Filter by date range
        const orderDate = new Date(order.orderDateTime);
        if (filters.startDate && orderDate < filters.startDate) {
            return false;
        }
        if (filters.endDate) {
            const endOfDay = new Date(filters.endDate);
            endOfDay.setHours(23, 59, 59, 999);
            if (orderDate > endOfDay) {
                return false;
            }
        }

        // Filter by price range
        if (filters.minPrice !== undefined && order.finalPrice < filters.minPrice) {
            return false;
        }
        if (filters.maxPrice !== undefined && order.finalPrice > filters.maxPrice) {
            return false;
        }

        // Search by order ID or product name
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesOrderId = order.orderId.toString().toLowerCase().includes(query);
            const matchesProduct = order.items.some((item) =>
                item.productName.toLowerCase().includes(query)
            );
            if (!matchesOrderId && !matchesProduct) {
                return false;
            }
        }

        return true;
    });
};

// Combine filter and sort
export const processOrders = (
    orders: OrderResponse[],
    filters: OrderFilters,
    sortBy: SortBy
): OrderResponse[] => {
    const filtered = filterOrders(orders, filters);
    return sortOrders(filtered, sortBy);
};

// Get date range options
export interface DateRangeOption {
    label: string;
    startDate?: Date;
    endDate?: Date;
}

export const getDateRangeOptions = (): DateRangeOption[] => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const lastYear = today.getFullYear() - 1;
    const yearStart = new Date(lastYear, 0, 1);
    const yearEnd = new Date(lastYear, 11, 31);

    return [
        { label: '30 ngày qua', startDate: thirtyDaysAgo, endDate: today },
        { label: '6 tháng qua', startDate: sixMonthsAgo, endDate: today },
        { label: `Năm ${lastYear}`, startDate: yearStart, endDate: yearEnd },
        { label: 'Tất cả thời gian' },
    ];
};

// Format date for display
export const formatOrderDate = (dateString: string | null) => {
    if (!dateString) return 'Không xác định';
    return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};