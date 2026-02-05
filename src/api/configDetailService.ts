import axios from "axios";
import { API_ENDPOINTS } from "./apiConfig";
import type { ConfigDetailDto, CreateConfigDetailRequest, UpdateConfigDetailRequest } from "./dtos/productConfig.dto";

export const configDetailService = {
  /**
   * Get all ConfigDetails for a specific ProductConfig
   */
  async getByConfig(configId: number): Promise<ConfigDetailDto[]> {
    const response = await axios.get(API_ENDPOINTS.CONFIG_DETAILS.BY_CONFIG(configId));
    
    // Handle ApiResponse wrapper
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * Create a new ConfigDetail
   */
  async create(detail: CreateConfigDetailRequest, token: string): Promise<void> {
    console.log('[configDetailService.create] Request details:', {
      url: API_ENDPOINTS.CONFIG_DETAILS.CREATE,
      payload: detail,
      payloadStringified: JSON.stringify(detail)
    });
    
    await axios.post(
      API_ENDPOINTS.CONFIG_DETAILS.CREATE,
      detail,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  },

  /**
   * Update an existing ConfigDetail
   */
  async update(detail: UpdateConfigDetailRequest, token: string): Promise<void> {
    await axios.put(
      API_ENDPOINTS.CONFIG_DETAILS.UPDATE,
      detail,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  },

  /**
   * Delete a ConfigDetail
   */
  async delete(id: number, token: string): Promise<void> {
    await axios.delete(API_ENDPOINTS.CONFIG_DETAILS.DELETE(id), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
