import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '../../../api/apiConfig';

export interface StockMovement {
    stockmovementid: number;
    stockid: number;
    orderid: number;
    quantity: number;
    movementdate: string;
    note: string;
    productName: string | null;
    movementType: string | null;
}

/**
 * Lấy lịch sử di chuyển kho cho một sản phẩm trong đơn hàng
 * GET /api/inventories/movements?orderId={orderId}&productId={productId}
 */
export const getStockMovementsByOrderAndProduct = async (
    orderId: number,
    productId: number,
    token?: string
): Promise<StockMovement[]> => {
    const response = await axiosClient.get<StockMovement[]>(
        API_ENDPOINTS.INVENTORY.STOCK_MOVEMENTS,
        {
            params: {
                orderId,
                productId,
            },
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );

    console.log('Stock Movements Response:', response); // Debug log

    return response.data;
};

export const stockMovementService = {
    getStockMovementsByOrderAndProduct,
};
