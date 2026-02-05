import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './apiConfig';

export interface ProductDetailRequest {
  productdetailid?: number;
  productparentid?: number;
  productid?: number;
  quantity?: number;
}

export interface ProductDetailResponse {
  productdetailid: number;
  productparentid: number;
  productid: number;
  quantity: number;
  productname?: string;
  unit?: number;
  price?: number;
}

export const productDetailService = {
  // Get product details by parent ID (basket ID)
  getByParent: async (parentId: number | string) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCT_DETAILS.BY_PARENT(parentId));
    return response;
  },

  // Add product to basket
  create: async (detail: ProductDetailRequest, token: string) => {
    const response = await axiosClient.post(API_ENDPOINTS.PRODUCT_DETAILS.CREATE, detail, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Update product quantity in basket
  update: async (detail: ProductDetailRequest, token: string) => {
    const response = await axiosClient.put(API_ENDPOINTS.PRODUCT_DETAILS.UPDATE, detail, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Remove product from basket
  delete: async (id: number | string, token: string) => {
    const response = await axiosClient.delete(API_ENDPOINTS.PRODUCT_DETAILS.DELETE(id), {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },
};
