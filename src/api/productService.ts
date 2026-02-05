import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './apiConfig';

import type {
  ProductDto,
  ProductDetailResponseDto,
  StockDto as StockDtoServer,
} from './dtos/product.dto';

// Types (DTO-aligned)
export type Product = ProductDto;
export type ProductDetailResponse = ProductDetailResponseDto;
export type StockDto = StockDtoServer;

export interface CreateSingleProductRequest {
  categoryid?: number;
  accountid?: number;
  sku: string;
  productname: string;
  description?: string;
  imageUrl?: string;
  price: number;
  unit: number;
  createStockRequest?: any;
}

export interface CreateComboProductRequest {
  configid?: number;
  accountid?: number;
  productname: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  productDetails: ProductDetailRequest[];
}

export interface ProductDetailRequest {
  productid?: number;
  quantity?: number;
}

export interface UpdateComboProductRequest {
  productname?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  productDetails?: ProductDetailRequest[];
}

export interface CustomerBasketDto {
  productid: number;
  configid?: number;
  configName?: string;
  productname: string;
  description?: string;
  imageUrl?: string;
  status: string;
  totalPrice: number;
  totalWeight: number;
  createdDate?: string;
  productDetails: BasketProductDetailDto[];
}

export interface BasketProductDetailDto {
  productdetailid: number;
  productid: number;
  productname: string;
  sku?: string;
  price: number;
  unit: number;
  quantity: number;
  imageUrl?: string;
  totalQuantityInStock: number;
  subtotal: number;
}

export interface CloneBasketRequest {
  customName?: string;
}

export interface ValidationStatus {
  productid: number;
  productname: string;
  currentWeight?: number;
  maxWeight?: number;
  weightExceeded: boolean;
  warnings: string[];
  categoryStatus: Record<string, {
    categoryId: number;
    categoryName: string;
    currentCount: number;
    requiredCount: number;
    isSatisfied: boolean;
  }>;
  isValid: boolean;
}

// Product Service
export const productService = {
  // Get all products
  getAll: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.LIST);
    return response;
  },

  // Get product by ID
  getById: async (id: number | string) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.DETAIL(id));
    return response;
  },

  // Get products by account (logged in user)
  getByAccount: async (token: string) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.BY_ACCOUNT, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Get draft baskets
  getDrafts: async (token: string) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.DRAFTS, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Get customer's custom baskets with details
  getMyBaskets: async (token: string) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.MY_BASKETS, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Create normal product (Admin/Staff)
  createNormal: async (product: CreateSingleProductRequest, token: string) => {
    const response = await axiosClient.post(API_ENDPOINTS.PRODUCTS.CREATE_NORMAL, product, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Create custom basket (Customer)
  createCustom: async (basket: CreateComboProductRequest, token: string) => {
    const response = await axiosClient.post(API_ENDPOINTS.PRODUCTS.CREATE_CUSTOM, basket, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Create template basket (Admin/Staff)
  createTemplate: async (basket: CreateComboProductRequest, token: string) => {
    const response = await axiosClient.post(API_ENDPOINTS.PRODUCTS.CREATE_TEMPLATE, basket, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Update normal product (Admin/Staff)
  updateNormal: async (id: number | string, product: Product, token: string) => {
    const response = await axiosClient.put(API_ENDPOINTS.PRODUCTS.UPDATE_NORMAL(id), product, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Update custom basket
  updateCustom: async (id: number | string, basket: UpdateComboProductRequest, token: string) => {
    const response = await axiosClient.put(API_ENDPOINTS.PRODUCTS.UPDATE_CUSTOM(id), basket, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Delete product (Admin/Staff)
  delete: async (id: number | string, token: string) => {
    const response = await axiosClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id), {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Get validation status
  getValidationStatus: async (id: number | string) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.VALIDATION_STATUS(id));
    return response;
  },

  // Get custom product by ID with full details (for editing)
  getCustomProductById: async (id: number | string) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.CUSTOM_PRODUCT_BY_ID(id));
    return response;
  },

  // Template operations
  templates: {
    // Get all templates
    getAll: async () => {
      const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.TEMPLATES);
      return response;
    },

    // Create template (Admin/Staff)
    create: async (data: CreateComboProductRequest, token: string) => {
      const response = await axiosClient.post(
        API_ENDPOINTS.PRODUCTS.TEMPLATES,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response;
    },

    // Get all admin baskets
    getAdminBaskets: async () => {
      const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.ADMIN_BASKETS);
      return response;
    },

    // Clone template
    clone: async (templateId: number | string, request: CloneBasketRequest, token: string) => {
      const response = await axiosClient.post(
        API_ENDPOINTS.PRODUCTS.CLONE_TEMPLATE(templateId),
        request,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response;
    },

    // Set as template (Admin/Staff)
    setAsTemplate: async (id: number | string, token: string) => {
      const response = await axiosClient.post(
        API_ENDPOINTS.PRODUCTS.SET_AS_TEMPLATE(id),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response;
    },

    // Remove template (Admin/Staff)
    removeTemplate: async (id: number | string, token: string) => {
      const response = await axiosClient.delete(
        API_ENDPOINTS.PRODUCTS.REMOVE_TEMPLATE(id),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response;
    },
  },
};
