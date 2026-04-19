import { useState, useEffect } from 'react';
import type { OrderResponse } from '@/feature/checkout/services/orderService';
import { orderService } from '@/feature/checkout/services/orderService';
import type { OrderFilters, SortBy } from '@/feature/account/utils/orderFilterUtils';
import { processOrders, getDateRangeOptions } from '@/feature/account/utils/orderFilterUtils';

const normalizeOrderForOrdersPage = (order: OrderResponse): OrderResponse => {
    return order;
};

const PAGE_SIZE = 10;

export const useAdminOrderHistory = () => {
    const [allOrders, setAllOrders] = useState<OrderResponse[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderResponse[]>([]);
    const [paginatedOrders, setPaginatedOrders] = useState<OrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Filter and sort state
    const [filters, setFilters] = useState<OrderFilters>({
        quotationType: 'normal',
        vatType: 'all',
    });
    const [sortBy, setSortBy] = useState<SortBy>('date-desc');

    // Load all orders from API
    useEffect(() => {
        const loadAllOrders = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Vui lòng đăng nhập');
                    return;
                }

                // Load first page
                const firstPageData = await orderService.getAllOrders(1, token);
                let allOrdersData = firstPageData.data.map(normalizeOrderForOrdersPage);

                // Load remaining pages if necessary
                if (firstPageData.totalPages > 1) {
                    for (let page = 2; page <= firstPageData.totalPages; page++) {
                        const pageData = await orderService.getAllOrders(page, token);
                        allOrdersData = [
                            ...allOrdersData,
                            ...pageData.data.map(normalizeOrderForOrdersPage),
                        ];
                    }
                }

                setAllOrders(allOrdersData);
                setTotalItems(allOrdersData.length);
                setCurrentPage(1);
            } catch (err: any) {
                console.error('Error loading orders:', err);
                setError('Không thể tải danh sách đơn hàng');
            } finally {
                setIsLoading(false);
            }
        };

        loadAllOrders();
    }, []);

    // Apply filters and sorting
    useEffect(() => {
        const processed = processOrders(allOrders, filters, sortBy);
        setFilteredOrders(processed);

        // Calculate pagination
        const pages = Math.ceil(processed.length / PAGE_SIZE);
        setTotalPages(pages || 1);

        // Reset to page 1 when filters change
        setCurrentPage(1);
    }, [allOrders, filters, sortBy]);

    // Apply pagination to filtered orders
    useEffect(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
    }, [filteredOrders, currentPage]);

    const handleStatusFilterChange = (status: string) => {
        setFilters((prev) => ({
            ...prev,
            status: status === 'all' ? undefined : status,
        }));
    };

    const handleQuotationTypeChange = (quotationType: 'all' | 'normal' | 'quotation') => {
        setFilters((prev) => ({
            ...prev,
            quotationType,
        }));
    };

    const handleVatTypeChange = (vatType: 'all' | 'vat' | 'non-vat') => {
        setFilters((prev) => ({
            ...prev,
            vatType,
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

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const updateOrderInList = (updatedOrder: OrderResponse) => {
        const normalizedOrder = normalizeOrderForOrdersPage(updatedOrder);

        setAllOrders((prevOrders) =>
            prevOrders.map((order) =>
                order.orderId === normalizedOrder.orderId ? normalizedOrder : order
            )
        );
    };

    return {
        allOrders,
        filteredOrders,
        paginatedOrders,
        isLoading,
        error,
        filters,
        quotationType: filters.quotationType ?? 'all',
        sortBy,
        currentPage,
        totalPages,
        totalItems,
        handleQuotationTypeChange,
        handleVatTypeChange,
        handleStatusFilterChange,
        handleDateRangeChange,
        handlePriceRangeChange,
        handleSearch,
        handleSort,
        goToPage,
        updateOrderInList,
    };
};
