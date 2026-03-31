import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './apiConfig';
import { inventoryAdminService } from './inventoryAdminService';
import { stockUtils } from '@/lib/stockUtils';

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

// --- FormData helpers (for endpoints that accept [FromForm]) ---

const buildCreateNormalFormData = (product: CreateSingleProductRequest): FormData => {
  const form = new FormData();
  if (product.categoryid != null) form.append('categoryid', String(product.categoryid));
  form.append('sku', product.sku);
  form.append('productname', product.productname);
  if (product.description) form.append('description', product.description);
  form.append('price', String(product.price));
  form.append('unit', String(product.unit));
  if (product.imageUrl) form.append('imageUrl', product.imageUrl);
  return form;
};

const buildUpdateNormalFormData = (product: Product): FormData => {
  const form = new FormData();
  if (product.categoryid != null) form.append('categoryid', String(product.categoryid));
  if (product.sku) form.append('sku', product.sku);
  if (product.productname) form.append('productname', product.productname);
  if (product.description) form.append('description', product.description);
  if (product.price != null) form.append('price', String(product.price));
  if (product.unit != null) form.append('unit', String(product.unit));
  if (product.status) form.append('status', product.status);
  if (product.imageUrl) form.append('imageUrl', product.imageUrl);
  return form;
};

const buildUpdateCustomFormData = (basket: UpdateComboProductRequest): FormData => {
  const form = new FormData();
  if (basket.productname) form.append('productname', basket.productname);
  if (basket.description != null) form.append('description', basket.description);
  if (basket.status) form.append('status', basket.status);
  if (basket.imageUrl) form.append('imageUrl', basket.imageUrl);
  return form;
};

const buildCreateComboFormData = (basket: CreateComboProductRequest): FormData => {
  const form = new FormData();
  if (basket.configid != null) form.append('configid', String(basket.configid));
  form.append('productname', basket.productname);
  if (basket.description) form.append('description', basket.description);
  if (basket.status) form.append('status', basket.status);
  if (basket.imageUrl) form.append('imageUrl', basket.imageUrl);
  basket.productDetails.forEach((pd, i) => {
    if (pd.productid != null) form.append(`productDetails[${i}].productid`, String(pd.productid));
    if (pd.quantity != null) form.append(`productDetails[${i}].quantity`, String(pd.quantity));
  });
  return form;
};

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
    const params = buildCreateNormalFormData(product);
    console.log('[createNormal] → POST', API_ENDPOINTS.PRODUCTS.CREATE_NORMAL);
    const response = await axiosClient.post(API_ENDPOINTS.PRODUCTS.CREATE_NORMAL, params, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Create custom basket (Customer)
  createCustom: async (basket: CreateComboProductRequest, token: string) => {
    const params = buildCreateComboFormData(basket);
    const response = await axiosClient.post(API_ENDPOINTS.PRODUCTS.CREATE_CUSTOM, params, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Create template basket (Admin/Staff)
  createTemplate: async (basket: CreateComboProductRequest, token: string) => {
    const params = buildCreateComboFormData(basket);
    const response = await axiosClient.post(API_ENDPOINTS.PRODUCTS.CREATE_TEMPLATE, params, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Update normal product (Admin/Staff)
  updateNormal: async (id: number | string, product: Product, token: string) => {
    const params = buildUpdateNormalFormData(product);
    console.log('[updateNormal] → PUT', API_ENDPOINTS.PRODUCTS.UPDATE_NORMAL(id));
    const response = await axiosClient.put(API_ENDPOINTS.PRODUCTS.UPDATE_NORMAL(id), params, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Update custom basket
  updateCustom: async (id: number | string, basket: UpdateComboProductRequest, token: string) => {
    const params = buildUpdateCustomFormData(basket);
    console.log('[updateCustom] → PUT', API_ENDPOINTS.PRODUCTS.UPDATE_CUSTOM(id));
    const response = await axiosClient.put(API_ENDPOINTS.PRODUCTS.UPDATE_CUSTOM(id), params, {
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
      const params = buildCreateComboFormData(data);
      const response = await axiosClient.post(
        API_ENDPOINTS.PRODUCTS.TEMPLATES,
        params,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response;
    },

    // Get all admin baskets
    getAdminBaskets: async () => {
      const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.ADMIN_BASKETS);
      return response;
    },

    // Get ACTIVE admin/staff baskets for shop page (public)
    getShopBaskets: async () => {
      const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.SHOP_BASKETS);
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

    // Hard delete template + associated ProductDetails permanently
    hardDelete: async (id: number | string, token: string) => {
      const response = await axiosClient.delete(
        API_ENDPOINTS.PRODUCTS.HARD_DELETE(id),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response;
    },
  },

  // --- NEW: FE-only Available Products for Customer ---
  getAvailableProductsForCustomer: async () => {
    try {
      // 1. Fetch products and stocks in parallel
      const [productsRes, stocks] = await Promise.all([
        axiosClient.get(API_ENDPOINTS.PRODUCTS.LIST),
        inventoryAdminService.getAllStocks()
      ]);

      const allProducts: ProductDto[] = (productsRes as any)?.data?.data ?? (productsRes as any)?.data ?? [];

      // 2. Filter products based on stock availability
      return stockUtils.filterInStockProducts(allProducts, stocks);
    } catch (error) {
      console.error("[productService] Error fetching available products:", error);
      throw error;
    }
  },

  getAvailableShopBasketsForCustomer: async () => {
    try {
      const [basketsRes, stocks] = await Promise.all([
        axiosClient.get(API_ENDPOINTS.PRODUCTS.SHOP_BASKETS),
        inventoryAdminService.getAllStocks()
      ]);

      const allBaskets: ProductDto[] = (basketsRes as any)?.data?.data ?? (basketsRes as any)?.data ?? [];
      
      // Filter baskets based on stock availability
      return stockUtils.filterInStockProducts(allBaskets, stocks);
    } catch (error) {
      console.error("[productService] Error fetching available shop baskets:", error);
      throw error;
    }
  }
};
