// Central export for all API services
export { API_ENDPOINTS } from './apiConfig';
export { productService } from './productService';
export { categoryService } from './categoryService';
export { configService, configDetailService } from './configService';
export { configDetailService as configDetailServiceAPI } from './configDetailService';
export { productDetailService } from './productDetailService';

// Re-export types
export type { Product, CloneBasketRequest, ValidationStatus } from './productService';
export type { Category } from './categoryService';
export type { ProductConfig, ConfigDetail } from './configService';
export type { ProductDetailRequest, ProductDetailResponse } from './productDetailService';

// DTOs (aligned with backend)
export type { ProductDto, StockDto, ProductDetailResponseDto } from './dtos/product.dto';
export type { ProductConfigDto } from './dtos/productConfig.dto';