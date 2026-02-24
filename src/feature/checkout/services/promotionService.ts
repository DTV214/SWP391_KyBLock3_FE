import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/apiConfig';

// DTO interfaces
export interface PromotionResponse {
    promotionId: number;
    code: string;
    discountValue: number;
    expiryDate: string;
    isActive: boolean;
}

// ============ PROMOTION SERVICE ============

const promotionService = {
    /**
     * Lấy thông tin promotion bằng code
     * GET /api/promotions/code/{code}
     */
    getPromotionByCode: async (code: string): Promise<PromotionResponse> => {
        try {
            const response = await axiosClient.get(
                API_ENDPOINTS.PROMOTIONS.GET_BY_CODE(code)
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default promotionService;
