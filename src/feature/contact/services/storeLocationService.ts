import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

export interface ApiResponse<T> {
  status: number;
  msg: string;
  data: T;
}

export interface StoreLocation {
  storeLocationId: number;
  name: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  openHoursText: string;
  isActive: boolean;
}

const getActiveStoreLocations = async (): Promise<StoreLocation[]> => {
  const response = (await axiosClient.get(
    API_ENDPOINTS.STORE_LOCATIONS.ACTIVE,
  )) as ApiResponse<StoreLocation[]>;
  return response.data;
};

const getStoreLocationById = async (id: number): Promise<StoreLocation> => {
  const response = (await axiosClient.get(
    API_ENDPOINTS.STORE_LOCATIONS.DETAIL(id),
  )) as ApiResponse<StoreLocation>;
  return response.data;
};

export const storeLocationService = {
  getActiveStoreLocations,
  getStoreLocationById,
};
