import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/apiConfig';

// DTO interfaces for Payment
export interface CreatePaymentRequest {
    orderId: number;
    paymentMethod: 'VNPAY' | 'MOMO';
}

export interface CreatePaymentResponse {
    paymentId: number;
    orderId: number;
    amount: number;
    paymentLink: string;
    paymentUrl: string;
    status: string;
    createdAt: string;
}

export interface PaymentTransaction {
    paymentId: number;
    orderId: number;
    walletId: number | null;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    type: string;
    paymentMethod: string;
    isPayOnline: boolean;
    transactionNo: string | null;
    createdDate: string | null;
}

/**
 * Tạo thanh toán
 * POST /api/payments
 */
export const createPayment = async (
    request: CreatePaymentRequest,
    token?: string
): Promise<CreatePaymentResponse> => {
    const response = await axiosClient.post<CreatePaymentResponse>(
        API_ENDPOINTS.PAYMENTS.CREATE,
        request,
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
   * Lấy danh sách giao dịch thanh toán của đơn hàng
   * GET /api/payments/order/{orderId}
   */
export const getPaymentsByOrder = async (
    orderId: number,
    token?: string
): Promise<PaymentTransaction[]> => {
    try {
        const response = await axiosClient.get<PaymentTransaction[]>(
            API_ENDPOINTS.PAYMENTS.BY_ORDER(orderId),
            {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching payment transactions:', error);
        return [];
    }
}

/**
 * Thanh toán bằng ví
 * POST /api/payments/wallet/pay
 */
export const paymentByWallet = async (
    orderId: number,
    token?: string
): Promise<PaymentTransaction> => {
    const response = await axiosClient.post<PaymentTransaction>(
        API_ENDPOINTS.PAYMENTS.PAY_BY_WALLET,
        { orderId },
        {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
    );
    return response.data;
};

/**
 * Xác thực kết quả thanh toán VNPay
 * GET /api/payments/vnpay-return?vnp_Amount=...&vnp_BankCode=...
 */
export const verifyVNPayReturn = async (
    queryParams: URLSearchParams,
    token?: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        const response = await axiosClient.get(
            `${API_ENDPOINTS.PAYMENTS.VNPAY_RETURN}?${queryParams.toString()}`,
            {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            }
        );

        console.log('VNPay verification response:', response);

        const isSuccess = response.data?.success === true;

        return {
            success: isSuccess,
            data: response.data,
            error: isSuccess ? undefined : (response.data?.message || 'Payment verification failed'),
        };
    } catch (error: any) {
        // Nếu có lỗi, trả về error
        return {
            success: false,
            error: error.response?.data?.message || 'Payment verification failed',
        };
    }
};

// Export all as object for easier importing
export const paymentService = {
    createPayment,
    getPaymentsByOrder,
    paymentByWallet,
    verifyVNPayReturn,
};
