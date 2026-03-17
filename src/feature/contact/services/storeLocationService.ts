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
  phoneNumber: string | null;
  openHoursText: string | null;
  isActive: boolean;
}

export interface StoreLocationUpsertPayload {
  name: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  openHoursText: string;
  isActive: boolean;
}

interface DeleteStoreLocationResult {
  success: boolean;
}

export type TravelMode =
  | "driving"
  | "walking"
  | "bicycling"
  | "transit";

export interface DirectionToStorePayload {
  fromLat: number;
  fromLng: number;
  travelMode: TravelMode;
}

interface DirectionToStoreResult {
  storeLocationId: number;
  url: string;
}

const getAllStoreLocations = async (): Promise<StoreLocation[]> => {
  const response = (await axiosClient.get(
    API_ENDPOINTS.STORE_LOCATIONS.LIST,
  )) as ApiResponse<StoreLocation[]>;
  return response.data;
};

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

const createStoreLocation = async (
  payload: StoreLocationUpsertPayload,
): Promise<StoreLocation> => {
  const response = (await axiosClient.post(
    API_ENDPOINTS.STORE_LOCATIONS.CREATE,
    payload,
  )) as ApiResponse<StoreLocation>;
  return response.data;
};

const updateStoreLocation = async (
  id: number,
  payload: StoreLocationUpsertPayload,
): Promise<StoreLocation> => {
  const response = (await axiosClient.put(
    API_ENDPOINTS.STORE_LOCATIONS.UPDATE(id),
    payload,
  )) as ApiResponse<StoreLocation>;
  return response.data;
};

const deleteStoreLocation = async (
  id: number,
): Promise<DeleteStoreLocationResult> => {
  const response = (await axiosClient.delete(
    API_ENDPOINTS.STORE_LOCATIONS.DELETE(id),
  )) as ApiResponse<DeleteStoreLocationResult>;
  return response.data;
};

const getDirectionsToStore = async (
  storeLocationId: number,
  payload: DirectionToStorePayload,
): Promise<DirectionToStoreResult> => {
  const response = (await axiosClient.post(
    API_ENDPOINTS.DIRECTIONS.TO_STORE(storeLocationId),
    payload,
  )) as ApiResponse<DirectionToStoreResult>;
  return response.data;
};

export const storeLocationService = {
  getAllStoreLocations,
  getActiveStoreLocations,
  getStoreLocationById,
  createStoreLocation,
  updateStoreLocation,
  deleteStoreLocation,
  getDirectionsToStore,
};
