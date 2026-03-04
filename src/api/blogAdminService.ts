import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

// --- DTOs (Data Transfer Objects) ---
export interface BlogDto {
  blogId: number;
  title: string;
  content: string;
  authorName: string | null;
  creationDate: string;
}

export interface CreateBlogRequest {
  title: string;
  content: string;
}

export interface UpdateBlogRequest {
  title: string;
  content: string;
}

export interface ApiResponse<T> {
  status: number;
  msg: string;
  data: T;
}

// Interface hứng message trả về từ BE khi Update/Delete thành công
export interface ActionMessage {
  message: string;
}

// --- API Service Dành Riêng Cho Admin ---
export const blogAdminService = {
  // 1. READ: Lấy danh sách Blogs
  getAllBlogs: async (): Promise<BlogDto[]> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<BlogDto[]>,
        ApiResponse<BlogDto[]>
      >(API_ENDPOINTS.BLOGS.LIST);

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return [];
    } catch (error: unknown) {
      console.error("Lỗi khi lấy danh sách blog:", error);
      throw error;
    }
  },

  // 2. READ: Lấy chi tiết 1 Blog theo ID
  getBlogById: async (id: string | number): Promise<BlogDto | null> => {
    try {
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

  // 3. CREATE: Thêm mới Blog
  createBlog: async (data: CreateBlogRequest): Promise<BlogDto | null> => {
    try {
      const response = await axiosClient.post<
        ApiResponse<BlogDto>,
        ApiResponse<BlogDto>
      >(API_ENDPOINTS.BLOGS.CREATE, data);

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      console.error("Lỗi khi tạo mới blog:", error);
      throw error;
    }
  },

  // 4. UPDATE: Cập nhật Blog
  updateBlog: async (
    id: string | number,
    data: UpdateBlogRequest,
  ): Promise<ApiResponse<ActionMessage>> => {
    try {
      const response = await axiosClient.put<
        ApiResponse<ActionMessage>,
        ApiResponse<ActionMessage>
      >(API_ENDPOINTS.BLOGS.UPDATE(id), data);
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi cập nhật blog ${id}:`, error);
      throw error;
    }
  },

  // 5. DELETE: Xóa Blog
  deleteBlog: async (
    id: string | number,
  ): Promise<ApiResponse<ActionMessage>> => {
    try {
      const response = await axiosClient.delete<
        ApiResponse<ActionMessage>,
        ApiResponse<ActionMessage>
      >(API_ENDPOINTS.BLOGS.DELETE(id));
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi xóa blog ${id}:`, error);
      throw error;
    }
  },
};
