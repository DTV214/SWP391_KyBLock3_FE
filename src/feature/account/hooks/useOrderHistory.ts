import { useState, useEffect } from 'react';
import type { OrderResponse } from '@/feature/checkout/services/orderService';
import { orderService } from '@/feature/checkout/services/orderService';
import type { OrderFilters, SortBy } from '../utils/orderFilterUtils';
import { processOrders, getDateRangeOptions } from '../utils/orderFilterUtils';

export const useOrderHistory = () => {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter and sort state
    const [filters, setFilters] = useState<OrderFilters>({});
    const [sortBy, setSortBy] = useState<SortBy>('date-desc');

    // Load orders
    useEffect(() => {
        const loadOrders = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Vui lòng đăng nhập');
                    return;
                }
                const data = await orderService.getMyOrders(token);
                setOrders(data);
            } catch (err: any) {
                console.error('Error loading orders:', err);
                setError('Không thể tải danh sách đơn hàng');
            } finally {
                setIsLoading(false);
            }
        };

        loadOrders();
    }, []);

    // Apply filters and sorting
    useEffect(() => {
        const processed = processOrders(orders, filters, sortBy);
        setFilteredOrders(processed);
    }, [orders, filters, sortBy]);

    const handleStatusFilterChange = (status: string) => {
        setFilters((prev) => ({
            ...prev,
            status: status === 'all' ? undefined : status,
        }));
    };

    const handleDateRangeChange = (dateRangeLabel: string) => {
        const dateRangeOptions = getDateRangeOptions();
        const selected = dateRangeOptions.find((opt) => opt.label === dateRangeLabel);

        if (selected) {
            setFilters((prev) => ({
                ...prev,
                startDate: selected.startDate,
                endDate: selected.endDate,
            }));
        }
    };

    const handlePriceRangeChange = (min: number, max: number) => {
        setFilters((prev) => ({
            ...prev,
            minPrice: min,
            maxPrice: max,
        }));
    };

    const handleSearch = (query: string) => {
        setFilters((prev) => ({
            ...prev,
            searchQuery: query,
        }));
    };

    const handleSort = (sort: SortBy) => {
        setSortBy(sort);
    };

    const updateOrderInList = (updatedOrder: OrderResponse) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.orderId === updatedOrder.orderId ? updatedOrder : order
            )
        );
    };

    return {
        orders,
        filteredOrders,
        isLoading,
        error,
        filters,
        sortBy,
        handleStatusFilterChange,
        handleDateRangeChange,
        handlePriceRangeChange,
        handleSearch,
        handleSort,
        updateOrderInList,
    };
};
