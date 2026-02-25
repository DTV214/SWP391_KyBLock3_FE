import axiosClient from "@/api/axiosClient";
import BASE_URL, { API_ENDPOINTS } from "@/api/apiConfig";

export interface QuotationProduct {
  productid: number;
  categoryid?: number | null;
  sku?: string | null;
  productname: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  status: string;
  unit?: number | null;
  isCustom?: boolean;
}

export interface ProductListResponse {
  data: QuotationProduct[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export interface ProductStockInfo {
  stockId: number;
  productId: number;
  productName: string;
  quantity: number;
  expiryDate?: string | null;
  status: string;
  productionDate?: string | null;
  lastUpdated?: string | null;
}

export interface QuotationProductDetail extends QuotationProduct {
  configid?: number | null;
  accountid?: number | null;
  stocks?: ProductStockInfo[] | null;
  totalQuantity?: number | null;
  productDetails?: unknown;
}

export interface ManualQuotationItem {
  productId: number;
  quantity: number;
}

export interface ManualQuotationRequest {
  company: string;
  address: string;
  email: string;
  phone: string;
  desiredPriceNote?: string;
  note?: string;
  items: ManualQuotationItem[];
}

export interface ManualQuotationResponse {
  quotationId: number;
  status: string;
  quotationType: string;
  desiredBudget?: number | null;
  totalPrice?: number | null;
  revision: number;
}

export interface QuotationSummary {
  quotationId: number;
  status: string;
  requestDate: string;
  company: string;
  totalPrice?: number | null;
  revision: number;
}

export interface QuotationFee {
  quotationFeeId: number;
  quotationItemId: number;
  isSubtracted: number;
  price: number;
  description?: string;
}

export interface QuotationLine {
  quotationItemId: number;
  productId: number;
  sku?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  originalLineTotal: number;
  subtractTotal: number;
  addTotal: number;
  finalLineTotal: number;
  fees?: QuotationFee[];
}

export interface QuotationMessage {
  quotationMessageId: number;
  fromRole: string;
  fromAccountId?: number | null;
  toRole?: string | null;
  actionType: string;
  message: string;
  createdAt: string;
  metaJson?: string | null;
}

export interface QuotationDetail {
  quotationId: number;
  accountId: number;
  orderId?: number | null;
  status: string;
  quotationType: string;
  revision: number;
  requestDate: string;
  submittedAt?: string | null;
  staffReviewedAt?: string | null;
  adminReviewedAt?: string | null;
  customerRespondedAt?: string | null;
  staffReviewerId?: number | null;
  adminReviewerId?: number | null;
  company: string;
  address: string;
  email: string;
  phone: string;
  desiredPriceNote?: string | null;
  note?: string | null;
  totalOriginal?: number | null;
  totalSubtract?: number | null;
  totalAdd?: number | null;
  totalAfterDiscount?: number | null;
  totalDiscountAmount?: number | null;
  lines: QuotationLine[];
  messages?: QuotationMessage[];
}

export interface CreateQuotationFeeRequest {
  staffAccountId?: number;
  quotationItemId: number;
  isSubtracted: number;
  price: number;
  description?: string;
}

export interface UpdateQuotationFeeRequest {
  staffAccountId?: number;
  quotationFeeId: number;
  isSubtracted: number;
  price: number;
  description?: string;
}

export interface AdminQuotationDecisionRequest {
  adminAccountId?: number;
  message?: string;
}

export interface CustomerQuotationDecisionRequest {
  accountId?: number;
  message?: string;
}

export const quotationService = {
  getProducts: async (params?: {
    search?: string;
    categories?: number[];
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    pageNumber?: number;
    pageSize?: number;
    status?: string;
  }) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.LIST, {
      params,
    });
    return response;
  },

  getProductById: async (id: number | string) => {
    const response = await axiosClient.get(`${BASE_URL}/products/${id}`);
    return response;
  },

  createManual: async (payload: ManualQuotationRequest) => {
    const response = await axiosClient.post(`${BASE_URL}/quotations/manual`, payload);
    return response;
  },

  getMyQuotations: async (status?: string) => {
    const response = await axiosClient.get(`${BASE_URL}/quotations`, {
      params: status ? { status } : undefined,
    });
    return response;
  },

  getQuotationById: async (id: number | string) => {
    const response = await axiosClient.get(`${BASE_URL}/quotations/${id}`);
    return response;
  },

  submitQuotation: async (id: number | string) => {
    const response = await axiosClient.post(`${BASE_URL}/quotations/${id}/submit`, {});
    return response;
  },

  customerAcceptQuotation: async (
    id: number | string,
    payload: CustomerQuotationDecisionRequest,
  ) => {
    const response = await axiosClient.post(`${BASE_URL}/quotations/${id}/customer-accept`, payload);
    return response;
  },

  customerRejectQuotation: async (
    id: number | string,
    payload: CustomerQuotationDecisionRequest,
  ) => {
    const response = await axiosClient.post(`${BASE_URL}/quotations/${id}/customer-reject`, payload);
    return response;
  },

  getStaffQuotations: async (status?: string) => {
    const response = await axiosClient.get(`${BASE_URL}/staff/quotations`, {
      params: status ? { status } : undefined,
    });
    return response;
  },

  getStaffQuotationById: async (id: number | string) => {
    const response = await axiosClient.get(`${BASE_URL}/staff/quotations/${id}`);
    return response;
  },

  startStaffReview: async (id: number | string) => {
    const response = await axiosClient.post(`${BASE_URL}/staff/quotations/${id}/start-review`, {});
    return response;
  },

  sendStaffQuotationToAdmin: async (id: number | string, message?: string) => {
    const response = await axiosClient.post(`${BASE_URL}/staff/quotations/${id}/send-admin`, null, {
      params: message ? { message } : undefined,
    });
    return response;
  },

  getStaffItemFees: async (id: number | string, itemId: number | string) => {
    const response = await axiosClient.get(`${BASE_URL}/staff/quotations/${id}/items/${itemId}/fees`);
    return response;
  },

  createStaffFee: async (id: number | string, payload: CreateQuotationFeeRequest) => {
    const response = await axiosClient.post(`${BASE_URL}/staff/quotations/${id}/fees`, payload);
    return response;
  },

  updateStaffFee: async (
    id: number | string,
    feeId: number | string,
    payload: UpdateQuotationFeeRequest,
  ) => {
    const response = await axiosClient.put(`${BASE_URL}/staff/quotations/${id}/fees/${feeId}`, payload);
    return response;
  },

  deleteStaffFee: async (id: number | string, feeId: number | string) => {
    const response = await axiosClient.delete(`${BASE_URL}/staff/quotations/${id}/fees/${feeId}`);
    return response;
  },

  getAdminQuotations: async (status?: string) => {
    const response = await axiosClient.get(`${BASE_URL}/admin/quotations`, {
      params: status ? { status } : undefined,
    });
    return response;
  },

  getAdminQuotationById: async (id: number | string) => {
    const response = await axiosClient.get(`${BASE_URL}/admin/quotations/${id}`);
    return response;
  },

  approveAdminQuotation: async (id: number | string, payload: AdminQuotationDecisionRequest) => {
    const response = await axiosClient.post(`${BASE_URL}/admin/quotations/${id}/approve`, payload);
    return response;
  },

  rejectAdminQuotation: async (id: number | string, payload: AdminQuotationDecisionRequest) => {
    const response = await axiosClient.post(`${BASE_URL}/admin/quotations/${id}/reject`, payload);
    return response;
  },
};

