import axiosClient from "../../../api/axiosClient";
import { API_ENDPOINTS } from "../../../api/apiConfig";

export interface CreatePaymentRequest {
  orderId: number;
  paymentMethod?: string | null;
}

export interface PaymentResponseDto {
  paymentId: number;
  orderId: number;
  amount: number;
  baseAmount: number;
  vatAmount: number;
  finalPayableAmount: number;
  requireVatInvoice: boolean;
  paymentUrl: string;
  // Backward-compat field used by older FE code paths
  paymentLink?: string;
  status: string;
  createdDate?: string | null;
  // Backward-compat field used by older payloads
  createdAt?: string | null;
}

export type CreatePaymentResponse = PaymentResponseDto;

export interface PaymentHistoryDto {
  paymentId: number;
  orderId?: number | null;
  walletId?: number | null;
  amount: number;
  baseAmount: number;
  vatAmount: number;
  finalPayableAmount: number;
  requireVatInvoice: boolean;
  status: string;
  type?: string | null;
  paymentMethod?: string | null;
  isPayOnline: boolean;
  transactionNo?: string | null;
  createdDate?: string | null;
}

export type PaymentTransaction = PaymentHistoryDto;

export interface PaymentResultDto {
  success: boolean;
  paymentId: number;
  orderId: number;
  transactionNo?: string | null;
  message: string;
  amount: number;
  baseAmount: number;
  vatAmount: number;
  finalPayableAmount: number;
  requireVatInvoice: boolean;
  bankCode?: string | null;
  responseCode?: string | null;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
};

const unwrapApiData = <T>(response: unknown): T => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as { data?: unknown }).data !== undefined
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
};

const normalizePaymentResponse = (
  payload: Partial<PaymentResponseDto>,
): PaymentResponseDto => {
  const amount = toNumber(payload.amount, 0);
  const baseAmount = toNumber(payload.baseAmount, amount);
  const vatAmount = toNumber(payload.vatAmount, Math.max(amount - baseAmount, 0));
  const finalPayableAmount = toNumber(
    payload.finalPayableAmount,
    amount || baseAmount + vatAmount,
  );
  const paymentUrl = payload.paymentUrl ?? payload.paymentLink ?? "";
  const createdDate = payload.createdDate ?? payload.createdAt ?? null;

  return {
    paymentId: toNumber(payload.paymentId, 0),
    orderId: toNumber(payload.orderId, 0),
    amount: amount || finalPayableAmount,
    baseAmount,
    vatAmount,
    finalPayableAmount: finalPayableAmount || amount,
    requireVatInvoice: toBoolean(payload.requireVatInvoice, false),
    paymentUrl,
    paymentLink: paymentUrl || undefined,
    status: payload.status ?? "PENDING",
    createdDate,
    createdAt: createdDate,
  };
};

const normalizePaymentHistory = (
  payload: Partial<PaymentHistoryDto>,
): PaymentHistoryDto => {
  const amount = toNumber(payload.amount, 0);
  const baseAmount = toNumber(payload.baseAmount, amount);
  const vatAmount = toNumber(payload.vatAmount, Math.max(amount - baseAmount, 0));
  const finalPayableAmount = toNumber(
    payload.finalPayableAmount,
    amount || baseAmount + vatAmount,
  );

  return {
    paymentId: toNumber(payload.paymentId, 0),
    orderId: payload.orderId == null ? null : toNumber(payload.orderId, 0),
    walletId: payload.walletId == null ? null : toNumber(payload.walletId, 0),
    amount: amount || finalPayableAmount,
    baseAmount,
    vatAmount,
    finalPayableAmount: finalPayableAmount || amount,
    requireVatInvoice: toBoolean(payload.requireVatInvoice, false),
    status: payload.status ?? "PENDING",
    type: payload.type ?? null,
    paymentMethod: payload.paymentMethod ?? null,
    isPayOnline: toBoolean(payload.isPayOnline, true),
    transactionNo: payload.transactionNo ?? null,
    createdDate: payload.createdDate ?? null,
  };
};

const normalizePaymentResult = (
  payload: Partial<PaymentResultDto>,
): PaymentResultDto => {
  const amount = toNumber(payload.amount, 0);
  const baseAmount = toNumber(payload.baseAmount, amount);
  const vatAmount = toNumber(payload.vatAmount, Math.max(amount - baseAmount, 0));
  const finalPayableAmount = toNumber(
    payload.finalPayableAmount,
    amount || baseAmount + vatAmount,
  );

  return {
    success: toBoolean(payload.success, false),
    paymentId: toNumber(payload.paymentId, 0),
    orderId: toNumber(payload.orderId, 0),
    transactionNo: payload.transactionNo ?? null,
    message: payload.message ?? "Payment verification failed",
    amount: amount || finalPayableAmount,
    baseAmount,
    vatAmount,
    finalPayableAmount: finalPayableAmount || amount,
    requireVatInvoice: toBoolean(payload.requireVatInvoice, false),
    bankCode: payload.bankCode ?? null,
    responseCode: payload.responseCode ?? null,
  };
};

export const createPayment = async (
  request: CreatePaymentRequest,
  token?: string,
): Promise<CreatePaymentResponse> => {
  const response = await axiosClient.post(API_ENDPOINTS.PAYMENTS.CREATE, request, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return normalizePaymentResponse(
    unwrapApiData<Partial<PaymentResponseDto>>(response),
  );
};

export const getPaymentsByOrder = async (
  orderId: number,
  token?: string,
): Promise<PaymentTransaction[]> => {
  try {
    const response = await axiosClient.get(API_ENDPOINTS.PAYMENTS.BY_ORDER(orderId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const payload = unwrapApiData<Partial<PaymentHistoryDto>[]>(response);
    return Array.isArray(payload) ? payload.map(normalizePaymentHistory) : [];
  } catch (error) {
    console.error("Error fetching payment transactions:", error);
    return [];
  }
};

export const getMyPayments = async (token?: string): Promise<PaymentHistoryDto[]> => {
  const response = await axiosClient.get(API_ENDPOINTS.PAYMENTS.MY_PAYMENTS, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const payload = unwrapApiData<Partial<PaymentHistoryDto>[]>(response);
  return Array.isArray(payload) ? payload.map(normalizePaymentHistory) : [];
};

export const verifyVNPayReturn = async (
  queryParams: URLSearchParams,
  token?: string,
): Promise<{
  success: boolean;
  data?: PaymentResultDto;
  error?: string;
}> => {
  try {
    const response = await axiosClient.get(
      `${API_ENDPOINTS.PAYMENTS.VNPAY_RETURN}?${queryParams.toString()}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    const payload = normalizePaymentResult(
      unwrapApiData<Partial<PaymentResultDto>>(response),
    );
    const isSuccess = payload.success === true;

    return {
      success: isSuccess,
      data: payload,
      error: isSuccess ? undefined : payload.message || "Payment verification failed",
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
  getMyPayments,
  verifyVNPayReturn,
};
