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
  }) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.LIST, {
      params,
    });
    return response;
  },

  createManual: async (payload: ManualQuotationRequest) => {
    const response = await axiosClient.post(
      `${BASE_URL}/quotations/manual`,
      payload,
    );
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
};
