import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

// --- DTOs cho phần Low Stock ---
export interface LowStockReportDto {
  productId: number;
  sku: string;
  productName: string;
  totalStockQuantity: number;
  status: string; // "Critical" hoặc "Low Stock"
}

// --- DTOs cho phần CRUD Stocks (Lô hàng) ---
export interface StockDto {
  stockId: number;
  productId: number;
  productName: string | null;
  quantity: number;
  expiryDate: string | null;
  status: string | null;
  productionDate: string | null;
  lastUpdated: string | null;
}

export interface CreateStockRequest {
  productId: number;
  quantity: number;
  productionDate: string; // ISO String (VD: 2026-03-04T14:05:20.011Z)
  expiryDate: string; // ISO String
}

export interface UpdateStockRequest {
  quantity: number;
  expiryDate: string; // ISO String
  productionDate: string; // ISO String
  status: string;
}

// Interface Wrapper chung của hệ thống
export interface ApiResponse<T> {
  status: number;
  msg: string;
  data: T;
}

export interface ActionMessage {
  message: string;
}

// --- API Service ---
export const inventoryAdminService = {
  // 1. Lấy danh sách cảnh báo tồn kho thấp
  getLowStockReport: async (
    threshold: number = 10,
  ): Promise<LowStockReportDto[]> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<LowStockReportDto[]>,
        ApiResponse<LowStockReportDto[]>
      >(API_ENDPOINTS.INVENTORY.LOW_STOCK(threshold));

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return [];
    } catch (error: unknown) {
      console.error("Lỗi khi lấy báo cáo tồn kho:", error);
      throw error;
    }
  },

  // 2. Lấy toàn bộ danh sách lô hàng (Tất cả Stock)
  getAllStocks: async (): Promise<StockDto[]> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<StockDto[]>,
        ApiResponse<StockDto[]>
      >(API_ENDPOINTS.INVENTORY.STOCKS);

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return [];
    } catch (error: unknown) {
      console.error("Lỗi khi lấy danh sách lô hàng:", error);
      throw error;
    }
  },

  // 3. Lấy danh sách lô hàng theo ID Sản phẩm
  getStocksByProductId: async (productId: number): Promise<StockDto[]> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<StockDto[]>,
        ApiResponse<StockDto[]>
      >(API_ENDPOINTS.INVENTORY.STOCKS_BY_PRODUCT(productId));

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return [];
    } catch (error: unknown) {
      console.error(`Lỗi khi lấy tồn kho của sản phẩm ${productId}:`, error);
      throw error;
    }
  },

  // 4. Tạo lô nhập kho mới
  createStock: async (data: CreateStockRequest): Promise<StockDto | null> => {
    try {
      const response = await axiosClient.post<
        ApiResponse<StockDto>,
        ApiResponse<StockDto>
      >(API_ENDPOINTS.INVENTORY.CREATE_STOCK, data);

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      console.error("Lỗi khi tạo lô hàng mới:", error);
      throw error;
    }
  },

  // 5. Cập nhật thông tin lô hàng
  updateStock: async (
    id: number,
    data: UpdateStockRequest,
  ): Promise<ApiResponse<ActionMessage>> => {
    try {
      const response = await axiosClient.put<
        ApiResponse<ActionMessage>,
        ApiResponse<ActionMessage>
      >(API_ENDPOINTS.INVENTORY.UPDATE_STOCK(id), data);
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi cập nhật lô hàng ${id}:`, error);
      throw error;
    }
  },

  // 6. Xóa lô hàng
  deleteStock: async (id: number): Promise<ApiResponse<ActionMessage>> => {
    try {
      const response = await axiosClient.delete<
        ApiResponse<ActionMessage>,
        ApiResponse<ActionMessage>
      >(API_ENDPOINTS.INVENTORY.DELETE_STOCK(id));
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi xóa lô hàng ${id}:`, error);
      throw error;
    }
  },
};
