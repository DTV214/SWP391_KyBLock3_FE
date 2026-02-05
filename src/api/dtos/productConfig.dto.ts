// DTO mapped from TetGift.BLL.Dtos.ProductConfigDto (server returns camelCase JSON)

import type { ProductDto } from './product.dto';

export interface ConfigDetailDto {
  configdetailid?: number;
  configid: number;
  categoryid: number;
  categoryName?: string;
  quantity: number;
}

// Request types for API calls (exact C# DTO casing)
export interface CreateConfigDetailRequest {
  Configid: number;
  Categoryid: number;
  Quantity: number;
  CategoryName: string;
}

export interface UpdateConfigDetailRequest {
  Configdetailid: number;
  Configid: number;
  Categoryid: number;
  Quantity: number;
  CategoryName: string;
}

export interface ProductConfigDto {
  configid?: number;
  configname: string;
  suitablesuggestion?: string;
  totalunit?: number;
  imageurl?: string;
  configDetails?: ConfigDetailDto[];
  products?: ProductDto[];
}
