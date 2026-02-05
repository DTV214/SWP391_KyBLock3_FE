import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './apiConfig';

export interface Category {
  categoryid?: number;
  categoryname: string;
}

export const categoryService = {
  // Get all categories
  getAll: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.CATEGORIES.LIST);
    return response;
  },

  // Create category (Admin/Staff)
  create: async (category: Category, token: string) => {
    const response = await axiosClient.post(API_ENDPOINTS.CATEGORIES.CREATE, category, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Update category (Admin/Staff)
  update: async (id: number | string, category: Category, token: string) => {
    const response = await axiosClient.put(API_ENDPOINTS.CATEGORIES.UPDATE, {
      categoryid: id,
      categoryname: category.categoryname
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Delete category (Admin/Staff)
  delete: async (id: number | string, token: string) => {
    const response = await axiosClient.delete(API_ENDPOINTS.CATEGORIES.DELETE(id), {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },
};
