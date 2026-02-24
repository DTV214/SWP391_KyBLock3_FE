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
    items: OrderItem[];
}

export interface UpdateOrderRequest {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    note: string;
}

/**
 * Tạo đơn hàng mới
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
 * Lấy danh sách đơn hàng của người dùng
 * GET /api/orders/my-orders
 */
export const getMyOrders = async (token?: string): Promise<OrderResponse[]> => {
    const response = await axiosClient.get<OrderResponse[]>(
        API_ENDPOINTS.ORDERS.MY_ORDERS,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

// Cập nhật thông tin giao hàng của order
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
 * Hủy đơn hàng
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

// Export all as object for easier importing
export const orderService = {
    createOrder,
    getMyOrders,
    updateOrderShippingInfo,
    cancelOrder
};
