import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/apiConfig';

// DTO interfaces for Order
export interface CreateOrderRequest {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    note?: string;
    promotionCode?: string;
}

export interface OrderItem {
    orderDetailId: number;
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    amount: number;
    imageUrl: string;
    productDetails?: ProductDetail[];
}

export interface ProductDetail {
    productDetailId: number;
    productParentId?: number;
    productId?: number;
    categoryId?: number;
    productname?: string;
    unit?: number;
    price?: number;
    imageurl?: string;
    quantity?: number;
}

export interface OrderResponse {
    orderId: number;
    accountId: number;
    orderDateTime: string;
    totalPrice: number;
    discountValue: number;
    finalPrice: number;
    status: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    note: string;
    promotionCode: string;
    shippedDate?: string | null;
    isQuotation?: number | null;
    items: OrderItem[];
}

export interface UpdateOrderRequest {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    note: string;
}

export interface UpdateOrderStatusRequest {
    status: string;
}

export interface AllocateStockResponse {
    message: string;
}

// Paginated Response
export interface PaginatedOrderResponse {
    data: OrderResponse[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
}

/**
 * T?o don h�ng m?i
 * POST /api/orders
 */
export const createOrder = async (
    request: CreateOrderRequest,
    token?: string
): Promise<OrderResponse> => {
    const response = await axiosClient.post<OrderResponse>(
        API_ENDPOINTS.ORDERS.CREATE,
        request,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * L?y danh s�ch don h�ng c?a ngu?i d�ng (c� ph�n trang)
 * GET /api/orders/my-orders?pageNumber=1&pageSize=10
 */
export const getMyOrders = async (
    pageNumber: number = 1,
    token?: string
): Promise<PaginatedOrderResponse> => {
    const response = await axiosClient.get<PaginatedOrderResponse>(
        API_ENDPOINTS.ORDERS.MY_ORDERS,
        {
            params: {
                pageNumber,
                pageSize: 10,
            },
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * L?y danh s�ch t?t c? don h�ng (Admin) (c� ph�n trang)
 * GET /api/orders?pageNumber=1&pageSize=10
 */
export const getAllOrders = async (
    pageNumber: number = 1,
    token?: string
): Promise<PaginatedOrderResponse> => {
    const response = await axiosClient.get<PaginatedOrderResponse>(
        API_ENDPOINTS.ORDERS.LIST,
        {
            params: {
                pageNumber,
                pageSize: 10,
            },
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * Lấy chi tiết một đơn hàng
 * GET /api/orders/{orderId}
 */
export const getOrderById = async (
    orderId: number,
    token?: string
): Promise<OrderResponse> => {
    const response = await axiosClient.get<OrderResponse>(
        API_ENDPOINTS.ORDERS.DETAIL(orderId),
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

// C?p nh?t th�ng tin giao h�ng c?a order
export const updateOrderShippingInfo = async (
    orderId: number,
    payload: UpdateOrderRequest,
    token?: string
): Promise<OrderResponse> => {
    const response = await axiosClient.put<OrderResponse>(
        API_ENDPOINTS.ORDERS.UPDATE_SHIPPING_INFO(orderId),
        payload,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );

    return response.data;
};

/**
 * C?p nh?t tr?ng th�i don h�ng
 * PUT /api/orders/{orderId}/status
 */
export const updateOrderStatus = async (
    orderId: number,
    status: string,
    token?: string
): Promise<OrderResponse> => {
    const response = await axiosClient.put<OrderResponse>(
        API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
        { status } as UpdateOrderStatusRequest,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

export const allocateOrderStock = async (
    orderId: number,
    token?: string
): Promise<AllocateStockResponse> => {
    const response = await axiosClient.post<AllocateStockResponse>(
        API_ENDPOINTS.ORDERS.ALLOCATE_STOCK(orderId),
        {},
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * H?y don h�ng
 * DELETE /api/orders/{orderId}/cancel
 */
export const cancelOrder = async (
    orderId: number,
    token?: string
): Promise<OrderResponse> => {
    const response = await axiosClient.delete<OrderResponse>(
        API_ENDPOINTS.ORDERS.CANCEL(orderId),
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * Tải xuống hóa đơn PDF của đơn hàng
 * GET /api/orders/{orderId}/invoice
 */
export const downloadInvoice = async (
    orderId: number,
    token?: string
): Promise<void> => {
    const response = await axiosClient.get(
        `${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/invoice`,
        {
            responseType: 'blob', // Important for file download
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );

    const fileBlob = response as unknown as Blob;
    
    // Kểm tra an toàn: Nếu API chưa deploy, server có thể trả về 200 OK kèm theo trang HTML fallback 
    // của React Router (thay vì PDF). Tránh tải file PDF bị lỗi (không mở được).
    if (fileBlob.type && fileBlob.type.includes('text/html')) {
        throw new Error('Tính năng In hóa đơn chưa được deploy lên máy chủ, hoặc đơn hàng không tồn tại.');
    }

    const blob = new Blob([fileBlob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HoaDon_${orderId.toString().padStart(6, '0')}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    if (link.parentNode) {
        link.parentNode.removeChild(link);
    }
    window.URL.revokeObjectURL(url);
};

// Export all as object for easier importing
export const orderService = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderShippingInfo,
    updateOrderStatus,
    allocateOrderStock,
    cancelOrder,
    downloadInvoice
};
