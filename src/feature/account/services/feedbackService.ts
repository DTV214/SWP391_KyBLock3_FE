import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/apiConfig';

export interface FeedbackResponse {
    feedbackId: number;
    orderId: number;
    rating: number;
    comment: string | null;
    customerName: string | null;
}

export interface ApiResponse<T> {
    status: number;
    msg: string;
    data: T;
}

export interface CreateFeedbackRequest {
    rating: number;
    comment: string;
}

export interface UpdateFeedbackRequest {
    rating: number;
    comment: string;
}

export const feedbackService = {
    addFeedback: async (orderId: number, data: CreateFeedbackRequest): Promise<FeedbackResponse> => {
        const response = (await axiosClient.post(
            API_ENDPOINTS.FEEDBACKS.ADD_ORDER_FEEDBACK(orderId), 
            data
        )) as any;
        return response.data;
    },

    updateFeedback: async (feedbackId: number, data: UpdateFeedbackRequest): Promise<FeedbackResponse> => {
        const response = (await axiosClient.put(
            API_ENDPOINTS.FEEDBACKS.UPDATE_FEEDBACK(feedbackId), 
            data
        )) as any;
        return response.data;
    },

    deleteFeedback: async (feedbackId: number): Promise<void> => {
        await axiosClient.delete(API_ENDPOINTS.FEEDBACKS.DELETE_FEEDBACK(feedbackId));
    },

    getProductFeedbacks: async (productId: number): Promise<FeedbackResponse[]> => {
        const response = (await axiosClient.get(
            API_ENDPOINTS.FEEDBACKS.GET_PRODUCT_FEEDBACKS(productId)
        )) as any;
        return response.data || [];
    }
};
