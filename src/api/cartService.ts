import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './apiConfig';

// DTO interfaces
export interface AddToCartRequest {
    productId: number;
    quantity: number;
}

export interface CartItemResponse {
    cartDetailId: number;
    productId: number;
    productName: string;
    sku?: string;
    price: number;
    quantity: number;
    subTotal: number;
    imageUrl1?: string;
}

export interface CartResponse {
    cartId: number;
    accountId: number;
    items: CartItemResponse[];
    totalPrice: number;
    discountValue?: number | null;
    finalPrice: number;
    itemCount: number;
    promotionCode?: string | null;
}

// ============ CART SERVICE ============

/**
 * Thêm sản phẩm vào giỏ hàng
 * POST /api/carts/items
 */
export const addToCart = async (
    request: AddToCartRequest,
    token?: string
): Promise<CartResponse> => {
    const response = await axiosClient.post<CartResponse>(
        `${API_ENDPOINTS.CARTS.ADD_TO_CART}`,
        request,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * Lấy giỏ hàng hiện tại
 * GET /api/carts
 */
export const getCart = async (token?: string): Promise<CartResponse> => {
    const response = await axiosClient.get<CartResponse>(
        API_ENDPOINTS.CARTS.GET,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 * PUT /api/carts/items/:cartDetailId
 */
export const updateCartItem = async (
    cartDetailId: number,
    quantity: number,
    token?: string
): Promise<CartResponse> => {
    const response = await axiosClient.put<CartResponse>(
        `${API_ENDPOINTS.CARTS.UPDATE_ITEM(cartDetailId)}`,
        { quantity },
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * DELETE /api/carts/items/:cartDetailId
 */
export const removeCartItem = async (
    cartDetailId: number,
    token?: string
): Promise<CartResponse> => {
    const response = await axiosClient.delete<CartResponse>(
        `${API_ENDPOINTS.CARTS.REMOVE_ITEM(cartDetailId)}`,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * Xóa toàn bộ giỏ hàng
 * DELETE /api/carts
 */
export const clearCart = async (token?: string): Promise<void> => {
    await axiosClient.delete(
        API_ENDPOINTS.CARTS.CLEAR,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
};

export const getCartCount = async (token?: string): Promise<number> => {
    const response = await axiosClient.get<{
        count: number | PromiseLike<number>; data: { count: number }
    }>(
        `${API_ENDPOINTS.CARTS.GET_ITEMS_COUNT}`,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data.count;
};

// Export all as object for easier importing
export const cartService = {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    getCartCount,
};
