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

export interface OrderResponseData {
    status: number;
    msg: string;
    data: OrderResponse;
}

export interface OrderListResponseData {
    status: number;
    msg: string;
    data: OrderResponse[];
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

// Export all as object for easier importing
export const orderService = {
    createOrder,
    getMyOrders,
};
