// DTOs mapped from TetGift.BLL.Dtos (server returns camelCase JSON)

export interface StockDto {
  stockId: number;
  productId: number;
  productName: string;
  quantity: number;
  expiryDate?: string | null;
  status: string;
  productionDate?: string | null;
  lastUpdated?: string | null;
}

export interface ProductDto {
  productid?: number;
  categoryid?: number;
  configid?: number;
  accountid?: number;
  sku?: string;
  productname?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  status?: string;
  stocks?: StockDto[];
  totalQuantity?: number;
  unit?: number;
  isCustom?: boolean;
  productDetails?: ProductDetailResponseDto[];
}

export interface ProductDetailResponseDto {
  productdetailid?: number;
  productparentid?: number;
  productid?: number;
  categoryid?: number;
  productname?: string;
  unit?: number;
  price?: number;
  imageurl?: string;
  quantity?: number;
  childProduct?: ProductDto;
}
