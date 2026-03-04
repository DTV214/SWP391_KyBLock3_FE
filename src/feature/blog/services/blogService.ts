import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

// Định nghĩa interface bám sát 100% DTO từ Backend
export interface BlogDto {
  blogId: number;
  title: string;
  content: string;
  authorName: string | null;
  creationDate: string;
}

// Interface cho response wrapper của Backend
export interface ApiResponse<T> {
  status: number;
  msg: string;
  data: T;
}

export const blogService = {
  // Hàm GET danh sách Blogs
  getAllBlogs: async (): Promise<BlogDto[]> => {
    try {
      // Ép kiểu chuẩn xác 100%, không dùng any
      const response = await axiosClient.get<
        ApiResponse<BlogDto[]>,
        ApiResponse<BlogDto[]>
      >(API_ENDPOINTS.BLOGS.LIST);

      // Bóc tách dữ liệu thật từ trường 'data'
      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return [];
    } catch (error: unknown) {
      console.error("Lỗi khi lấy danh sách blog:", error);
      throw error;
    }
  },

  // Hàm GET chi tiết 1 Blog theo ID
  getBlogById: async (id: string | number): Promise<BlogDto | null> => {
    try {
      // Ép kiểu chuẩn xác 100% cho 1 object
      const response = await axiosClient.get<
        ApiResponse<BlogDto>,
        ApiResponse<BlogDto>
      >(API_ENDPOINTS.BLOGS.DETAIL(id));

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      console.error(`Lỗi khi lấy chi tiết blog ${id}:`, error);
      throw error;
    }
  },
};
