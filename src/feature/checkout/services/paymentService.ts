import axiosClient from "../../../api/axiosClient";
import { API_ENDPOINTS } from "../../../api/apiConfig";

export interface CreatePaymentRequest {
  orderId: number;
  paymentMethod: "VNPAY" | "MOMO"; // Đã xóa WALLET
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
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  type: string;
  paymentMethod: string;
  isPayOnline: boolean;
  transactionNo: string | null;
  createdDate: string | null;
}

export const createPayment = async (
  request: CreatePaymentRequest,
  token?: string,
): Promise<CreatePaymentResponse> => {
  const response = await axiosClient.post<CreatePaymentResponse>(
    API_ENDPOINTS.PAYMENTS.CREATE,
    request,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  return response.data;
};

export const getPaymentsByOrder = async (
  orderId: number,
  token?: string,
): Promise<PaymentTransaction[]> => {
  try {
    const response = await axiosClient.get<PaymentTransaction[]>(
      API_ENDPOINTS.PAYMENTS.BY_ORDER(orderId),
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching payment transactions:", error);
    return [];
  }
};

export const verifyVNPayReturn = async (
  queryParams: URLSearchParams,
  token?: string,
): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> => {
  try {
    const response = await axiosClient.get(
      `${API_ENDPOINTS.PAYMENTS.VNPAY_RETURN}?${queryParams.toString()}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    const isSuccess = response.data?.success === true;

    return {
      success: isSuccess,
      data: response.data,
      error: isSuccess
        ? undefined
        : response.data?.message || "Payment verification failed",
    };
  } catch (error: unknown) {
    let errorMessage = "Payment verification failed";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "response" in error
    ) {
      const apiError = error as { response?: { data?: { message?: string } } };
      errorMessage = apiError.response?.data?.message || errorMessage;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const paymentService = {
  createPayment,
  getPaymentsByOrder,
  verifyVNPayReturn,
};
