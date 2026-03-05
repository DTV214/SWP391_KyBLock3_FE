import axiosClient, { axiosPublic } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/apiConfig';

// DTO interfaces
export interface PromotionResponse {
    promotionId: number;
    code: string;
    minPriceToApply: number | null;
    discountValue: number;
    maxDiscountPrice: number | null;
    isPercentage: boolean;
    startTime: string | null;
    expiryDate: string;
    isLimited: boolean;
    limitedCount: number | null;
    usedCount: number | null;
    status: 'ACTIVE' | 'WAIT_FOR_ACTIVE' | 'LIMITED_REACHED' | 'OUT_OF_DATE';
    isAlreadySave: boolean;
}

export interface CreatePromotionRequest {
    code: string;
    minPriceToApply: number;
    discountValue: number;
    maxDiscountPrice: number;
    isPercentage: boolean;
    startTime: string;
    expiryDate: string;
    isLimited: boolean;
    limitedCount: number;
}

export interface UpdatePromotionRequest extends CreatePromotionRequest { }

export interface SavePromotionRequest {
    promotionId: number;
    quantity: number;
    usedQuantity: number;
}

// ============ PROMOTION SERVICE ============

const promotionService = {
    /**
     * Lấy danh sách tất cả promocion
     * GET /api/promotions
     */
    getAllPromotions: async (): Promise<PromotionResponse[]> => {
        try {
            const response = await axiosClient.get<PromotionResponse[]>(
                API_ENDPOINTS.PROMOTIONS.LIST
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy danh sách promotion của account hiện tại
     * GET /api/promotions/accounts
     */
    getPromotionsByAccount: async (token?: string): Promise<PromotionResponse[]> => {
        try {
            const response = await axiosClient.get<PromotionResponse[]>(
                API_ENDPOINTS.PROMOTIONS.BY_ACCOUNT,
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy thông tin promotion theo ID
     * GET /api/promotions/{id}
     */
    getPromotionById: async (id: string | number): Promise<PromotionResponse> => {
        try {
            const response = await axiosClient.get<PromotionResponse>(
                API_ENDPOINTS.PROMOTIONS.DETAIL(id)
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy thông tin promotion bằng code
     * GET /api/promotions/code/{code}
     */
    getPromotionByCode: async (code: string, token?: string): Promise<PromotionResponse> => {
        try {
            const response = await axiosClient.get<PromotionResponse>(
                API_ENDPOINTS.PROMOTIONS.GET_BY_CODE(code),
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Tạo promotion mới
     * POST /api/promotions
     */
    createPromotion: async (data: CreatePromotionRequest, token?: string): Promise<PromotionResponse> => {
        try {
            const response = await axiosClient.post<PromotionResponse>(
                API_ENDPOINTS.PROMOTIONS.CREATE,
                data,
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cập nhật promotion
     * PUT /api/promotions/{id}
     */
    updatePromotion: async (
        id: string | number,
        data: UpdatePromotionRequest,
        token?: string
    ): Promise<PromotionResponse> => {
        try {
            const response = await axiosClient.put<PromotionResponse>(
                API_ENDPOINTS.PROMOTIONS.UPDATE(id),
                data,
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Xóa promotion
     * DELETE /api/promotions/{id}
     */
    deletePromotion: async (id: string | number, token?: string): Promise<void> => {
        try {
            await axiosClient.delete(
                API_ENDPOINTS.PROMOTIONS.DELETE(id),
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                }
            );
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy danh sách promotion giới hạn (public)
     * GET /api/promotions/limited
     */
    getLimitedPromotions: async (token?: string): Promise<PromotionResponse[]> => {
        try {
            const response = await axiosClient.get<PromotionResponse[]>(
                API_ENDPOINTS.PROMOTIONS.LIMITED,
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy danh sách promotion giới hạn (public - có thể dùng token)
     * GET /api/promotions/limited/public
     */
    getLimitedPublicPromotions: async (): Promise<PromotionResponse[]> => {
        try {
            const response = await axiosPublic.get<PromotionResponse[]>(
                API_ENDPOINTS.PROMOTIONS.LIMITED_PUBLIC
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lưu promotion vào tài khoản
     * POST /api/promotions/accounts
     */
    savePromotionToAccount: async (
        data: SavePromotionRequest,
        token?: string
    ): Promise<void> => {
        try {
            await axiosClient.post(
                API_ENDPOINTS.PROMOTIONS.SAVE_TO_ACCOUNT,
                data,
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                }
            );
        } catch (error) {
            throw error;
        }
    },
};

export default promotionService;
