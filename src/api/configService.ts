import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './apiConfig';

import type { ProductConfigDto } from './dtos/productConfig.dto';
import type { ProductDto } from './dtos/product.dto';

export type ProductConfig = ProductConfigDto;

type ApiResponse<T> = {
  status: number;
  msg: string;
  data: T;
};

type ApiResponsePascal<T> = {
  Status: number;
  Msg: string;
  Data: T;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const toString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  return value == null ? undefined : String(value);
};

const mapProductDetailResponseDto = (raw: any): import('./dtos/product.dto').ProductDetailResponseDto => {
  if (!raw || typeof raw !== 'object') return {};

  const childProductRaw = raw.childProduct ?? raw.ChildProduct;
  const childProduct = childProductRaw ? mapProductDto(childProductRaw) : undefined;

  return {
    productdetailid: toNumber(
      raw.productdetailid ?? raw.Productdetailid ?? raw.productDetailId ?? raw.ProductDetailId,
    ),
    productparentid: toNumber(
      raw.productparentid ?? raw.Productparentid ?? raw.productParentId ?? raw.ProductParentId,
    ),
    productid: toNumber(raw.productid ?? raw.Productid ?? raw.productId ?? raw.ProductId),
    productname: toString(raw.productname ?? raw.Productname ?? raw.productName ?? raw.ProductName),
    unit: toNumber(raw.unit ?? raw.Unit),
    price: toNumber(raw.price ?? raw.Price),
    imageurl: toString(raw.imageurl ?? raw.Imageurl ?? raw.imageUrl ?? raw.ImageUrl),
    quantity: toNumber(raw.quantity ?? raw.Quantity),
    childProduct,
  };
};

const mapProductDto = (raw: any): ProductDto => {
  if (!raw || typeof raw !== 'object') return {};

  const productDetailsRaw = raw.productDetails ?? raw.ProductDetails;
  const productDetails = Array.isArray(productDetailsRaw)
    ? productDetailsRaw.map(mapProductDetailResponseDto)
    : undefined;

  const stocksRaw = raw.stocks ?? raw.Stocks;
  const stocks = Array.isArray(stocksRaw) ? stocksRaw : undefined;

  return {
    productid: toNumber(raw.productid ?? raw.Productid ?? raw.productId ?? raw.ProductId),
    categoryid: toNumber(raw.categoryid ?? raw.Categoryid ?? raw.categoryId ?? raw.CategoryId),
    configid: toNumber(raw.configid ?? raw.Configid ?? raw.configId ?? raw.ConfigId),
    accountid: toNumber(raw.accountid ?? raw.Accountid ?? raw.accountId ?? raw.AccountId),
    sku: toString(raw.sku ?? raw.Sku),
    productname: toString(raw.productname ?? raw.Productname ?? raw.productName ?? raw.ProductName),
    description: toString(raw.description ?? raw.Description),
    imageUrl: toString(raw.imageUrl ?? raw.ImageUrl ?? raw.imageurl ?? raw.Imageurl),
    price: toNumber(raw.price ?? raw.Price),
    status: toString(raw.status ?? raw.Status),
    unit: toNumber(raw.unit ?? raw.Unit),
    isCustom: typeof (raw.isCustom ?? raw.IsCustom) === 'boolean' ? (raw.isCustom ?? raw.IsCustom) : undefined,
    totalQuantity: toNumber(raw.totalQuantity ?? raw.TotalQuantity),
    stocks,
    productDetails,
  };
};

const mapProductConfigDto = (raw: any): ProductConfigDto => {
  if (!raw || typeof raw !== 'object') {
    return { configname: '' };
  }

  const productsRaw = raw.products ?? raw.Products;
  const configDetailsRaw = raw.configDetails ?? raw.ConfigDetails;
  
  // Debug: log if products is missing
  if ((import.meta as any)?.env?.DEV && !productsRaw) {
    console.warn('[mapProductConfigDto] Missing products/Products in raw:', {
      configname: raw.configname ?? raw.Configname,
      rawKeys: Object.keys(raw),
      rawProductsField: raw.products,
      rawProductsFieldPascal: raw.Products,
    });
  }
  
  const products = Array.isArray(productsRaw) ? productsRaw.map(mapProductDto) : undefined;
  const configDetails = Array.isArray(configDetailsRaw) 
    ? configDetailsRaw.map((cd: any) => ({
        configdetailid: toNumber(cd.configdetailid ?? cd.Configdetailid ?? cd.configDetailId ?? cd.ConfigDetailId) ?? 0,
        configid: toNumber(cd.configid ?? cd.Configid ?? cd.configId ?? cd.ConfigId) ?? 0,
        categoryid: toNumber(cd.categoryid ?? cd.Categoryid ?? cd.categoryId ?? cd.CategoryId) ?? 0,
        categoryName: toString(cd.categoryName ?? cd.CategoryName) ?? '',
        quantity: toNumber(cd.quantity ?? cd.Quantity) ?? 0,
      }))
    : undefined;

  return {
    configid: toNumber(raw.configid ?? raw.Configid ?? raw.configId ?? raw.ConfigId),
    configname: toString(raw.configname ?? raw.Configname ?? raw.configName ?? raw.ConfigName) ?? '',
    suitablesuggestion: toString(
      raw.suitablesuggestion ?? raw.Suitablesuggestion ?? raw.suitableSuggestion ?? raw.SuitableSuggestion,
    ),
    totalunit: toNumber(raw.totalunit ?? raw.Totalunit ?? raw.totalUnit ?? raw.TotalUnit),
    imageurl: toString(raw.imageurl ?? raw.Imageurl ?? raw.imageUrl ?? raw.ImageUrl),
    configDetails,
    products,
  };
};

const unwrap = <T>(payload: unknown): T => {
  // axiosClient interceptor already returns response.data
  // Backend might return wrapped { status, msg, data } (camel) or { Status, Msg, Data } (pascal)
  const maybeCamel = payload as Partial<ApiResponse<T>> | null;
  if (maybeCamel && typeof maybeCamel === 'object' && 'data' in maybeCamel) {
    return (maybeCamel as ApiResponse<T>).data;
  }

  const maybePascal = payload as Partial<ApiResponsePascal<T>> | null;
  if (maybePascal && typeof maybePascal === 'object' && 'Data' in maybePascal) {
    return (maybePascal as ApiResponsePascal<T>).Data;
  }

  return payload as T;
};

export interface ConfigDetail {
  configdetailid?: number;
  configid: number;
  categoryid: number;
  categoryName?: string;
  productId: number;
  productName?: string;
  quantity: number;
}

export const configService = {
  // Get all configs
  getAll: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.CONFIGS.LIST);
    return response;
  },

  // Get all configs (typed + unwrapped to ProductConfigDto[])
  getAllConfig: async (): Promise<ProductConfigDto[]> => {
    const payload = await axiosClient.get(API_ENDPOINTS.CONFIGS.LIST);
    const unwrapped = unwrap<unknown>(payload);
    const list = Array.isArray(unwrapped) ? unwrapped : unwrapped ? [unwrapped] : [];
    const mapped = list.map(mapProductConfigDto);

    // Debug to quickly see what BE actually returns vs what FE uses
    if ((import.meta as any)?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.log('[configService.getAllConfig] raw payload:', payload);
      // eslint-disable-next-line no-console
      console.log('[configService.getAllConfig] unwrapped list:', list);
      // eslint-disable-next-line no-console
      console.log('[configService.getAllConfig] mapped ProductConfigDto[]:', mapped);
      // eslint-disable-next-line no-console
      if (mapped.length > 0) {
        console.log('[configService.getAllConfig] First config nested structure:');
        console.log('  - configname:', mapped[0].configname);
        console.log('  - products count:', mapped[0].products?.length ?? 0);
        if (mapped[0].products && mapped[0].products.length > 0) {
          const firstProduct = mapped[0].products[0];
          console.log('  - first product:', firstProduct.productname, '(status:', firstProduct.status + ')');
          console.log('  - productDetails count:', firstProduct.productDetails?.length ?? 0);
          if (firstProduct.productDetails && firstProduct.productDetails.length > 0) {
            const firstDetail = firstProduct.productDetails[0];
            console.log('    - first detail childProduct:', firstDetail.childProduct?.productname, '(quantity:', firstDetail.quantity + ')');
          }
        }
      }
    }

    return mapped;
  },

  // Get config by ID (typed + unwrapped to ProductConfigDto)
  getById: async (id: number | string): Promise<ProductConfigDto | null> => {
    const payload = await axiosClient.get(API_ENDPOINTS.CONFIGS.DETAIL(id));
    const unwrapped = unwrap<unknown>(payload);
    
    if (!unwrapped || typeof unwrapped !== 'object') return null;
    
    const mapped = mapProductConfigDto(unwrapped);
    
    // Debug log
    if ((import.meta as any)?.env?.DEV) {
      console.log('[configService.getById] raw payload:', payload);
      console.log('[configService.getById] unwrapped:', unwrapped);
      console.log('[configService.getById] mapped ProductConfigDto:', mapped);
    }
    
    return mapped;
  },

  // Create config (Admin/Staff)
  create: async (config: any, token: string): Promise<{ configid?: number }> => {
    // Expecting: { configname, description, categoryQuantities: { [categoryId]: quantity } }
    const response = await axiosClient.post(API_ENDPOINTS.CONFIGS.CREATE, config, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Extract configid from ApiResponse<{ configid: number }>
    const unwrapped = unwrap<any>(response);
    return unwrapped || {};
  },

  // Update config (Admin/Staff)
  update: async (id: number | string, config: any, token: string) => {
    // Expecting: { configname, description, categoryQuantities: { [categoryId]: quantity } }
    const response = await axiosClient.put(`${API_ENDPOINTS.CONFIGS.UPDATE}/${id}`, config, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Delete config (Admin/Staff)
  delete: async (id: number | string, token: string) => {
    const response = await axiosClient.delete(API_ENDPOINTS.CONFIGS.DELETE(id), {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },
};

export const configDetailService = {
  // Get config details by config ID
  getByConfig: async (configId: number | string) => {
    const response = await axiosClient.get(API_ENDPOINTS.CONFIG_DETAILS.BY_CONFIG(configId));
    return response;
  },

  // Create config detail (Admin/Staff)
  create: async (detail: ConfigDetail, token: string) => {
    const response = await axiosClient.post(API_ENDPOINTS.CONFIG_DETAILS.CREATE, detail, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Update config detail (Admin/Staff)
  update: async (detail: ConfigDetail, token: string) => {
    const response = await axiosClient.put(API_ENDPOINTS.CONFIG_DETAILS.UPDATE, detail, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },

  // Delete config detail (Admin/Staff)
  delete: async (id: number | string, token: string) => {
    const response = await axiosClient.delete(API_ENDPOINTS.CONFIG_DETAILS.DELETE(id), {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  },
};
