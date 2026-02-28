// URL cơ sở của Backend .NET 8
// src/api/apiConfig.ts
// Prefer configuring via Vite env:
// - VITE_API_BASE_URL=http://localhost:5280/api
// - VITE_API_BASE_URL=http://14.225.207.221:5000/api

// 1. Định nghĩa Interface chuẩn cho biến môi trường của Vite
interface ViteEnv {
  VITE_API_BASE_URL?: string;
}
// const ENV_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
const ENV_BASE_URL = (import.meta as unknown as { env: ViteEnv }).env
  ?.VITE_API_BASE_URL;
// Fallback to current production server if env is not set
const BASE_URL = (ENV_BASE_URL?.trim() || "http://14.225.207.221:5000/api").replace(/\/+$/, "");

// const BASE_URL = (ENV_BASE_URL?.trim() || "https://localhost:7056/api").replace(/\/+$/, "");

// Điều này giúp bạn chỉ cần đổi file .env khi chạy local / deploy.
export const API_ENDPOINTS = {
  AUTH: {
    // Khớp chính xác với Swagger trong ảnh bạn cung cấp
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER_REQUEST_OTP: `${BASE_URL}/auth/register/request-otp`,
    REGISTER_VERIFY_OTP: `${BASE_URL}/auth/register/verify-otp`,
  },
  // Products endpoints
  PRODUCTS: {
    LIST: `${BASE_URL}/products`,
    DETAIL: (id: string | number) => `${BASE_URL}/products/${id}`,
    BY_ACCOUNT: `${BASE_URL}/products/account`,
    DRAFTS: `${BASE_URL}/products/drafts`,
    MY_BASKETS: `${BASE_URL}/products/my-baskets`,

    // Create endpoints
    CREATE_NORMAL: `${BASE_URL}/products/normal`,
    CREATE_CUSTOM: `${BASE_URL}/products/custom`,
    CREATE_TEMPLATE: `${BASE_URL}/products/templates`,

    // Update endpoints
    UPDATE_NORMAL: (id: string | number) => `${BASE_URL}/products/normal/${id}`,
    UPDATE_CUSTOM: (id: string | number) => `${BASE_URL}/products/${id}/custom`,

    // Delete endpoint
    DELETE: (id: string | number) => `${BASE_URL}/products/${id}`,

    // Validation
    VALIDATION_STATUS: (id: string | number) =>
      `${BASE_URL}/products/${id}/validation-status`,

    // Template endpoints
    TEMPLATES: `${BASE_URL}/products/templates`,
    ADMIN_BASKETS: `${BASE_URL}/products/admin-baskets`,
    CUSTOM_PRODUCT_BY_ID: (id: string | number) =>
      `${BASE_URL}/products/custom/${id}`,
    CLONE_TEMPLATE: (templateId: string | number) =>
      `${BASE_URL}/products/templates/${templateId}/clone`,
    SET_AS_TEMPLATE: (id: string | number) =>
      `${BASE_URL}/products/${id}/set-as-template`,
    REMOVE_TEMPLATE: (id: string | number) =>
      `${BASE_URL}/products/${id}/remove-template`,
  },

  // Product Categories endpoints
  CATEGORIES: {
    LIST: `${BASE_URL}/categories`,
    CREATE: `${BASE_URL}/categories`,
    UPDATE: `${BASE_URL}/categories`,
    DELETE: (id: string | number) => `${BASE_URL}/categories/${id}`,
  },

  // Product Configs endpoints
  CONFIGS: {
    LIST: `${BASE_URL}/configs`,
    DETAIL: (id: string | number) => `${BASE_URL}/configs/${id}`,
    CREATE: `${BASE_URL}/configs`,
    UPDATE: `${BASE_URL}/configs`,
    DELETE: (id: string | number) => `${BASE_URL}/configs/${id}`,
  },

  // Product Details endpoints (items in basket)
  PRODUCT_DETAILS: {
    CREATE: `${BASE_URL}/product/details`,
    UPDATE: `${BASE_URL}/product/details`,
    DELETE: (id: string | number) => `${BASE_URL}/product/details/${id}`,
    BY_PARENT: (parentId: string | number) =>
      `${BASE_URL}/product/details/parent/${parentId}`,
  },

  // Config Details endpoints (config rules)
  CONFIG_DETAILS: {
    CREATE: `${BASE_URL}/config/details`,
    UPDATE: `${BASE_URL}/config/details`,
    DELETE: (id: string | number) => `${BASE_URL}/config/details/${id}`,
    BY_CONFIG: (configId: string | number) =>
      `${BASE_URL}/config/details/config/${configId}`,
  },

  USER: {
    PROFILE: `${BASE_URL}/profile`,
  },

  // Carts endpoints
  CARTS: {
    GET: `${BASE_URL}/carts`,
    GET_ITEMS_COUNT: `${BASE_URL}/carts/count`,
    ADD_TO_CART: `${BASE_URL}/carts/items`,
    UPDATE_ITEM: (cartDetailId: string | number) =>
      `${BASE_URL}/carts/items/${cartDetailId}`,
    REMOVE_ITEM: (cartDetailId: string | number) =>
      `${BASE_URL}/carts/items/${cartDetailId}`,
    CLEAR: `${BASE_URL}/carts/clear`,
  },

  // Orders endpoints
  ORDERS: {
    CREATE: `${BASE_URL}/orders`,
    LIST: `${BASE_URL}/orders`,
    DETAIL: (orderId: string | number) => `${BASE_URL}/orders/${orderId}`,
    MY_ORDERS: `${BASE_URL}/orders/my-orders`,
    UPDATE_SHIPPING_INFO: (orderId: string | number) =>
      `${BASE_URL}/orders/${orderId}/shipping-info`,
    CANCEL: (orderId: string | number) =>
      `${BASE_URL}/orders/${orderId}/cancel`,
  },

  // Payments endpoints
  PAYMENTS: {
    CREATE: `${BASE_URL}/payments`,
    BY_ORDER: (orderId: string | number) =>
      `${BASE_URL}/payments/order/${orderId}`,
    PAY_BY_WALLET: `${BASE_URL}/payments/wallet/pay`,
    VNPAY_RETURN: `${BASE_URL}/payments/vnpay-return`,
  },

  // Wallet endpoints
  WALLET: {
    GET: `${BASE_URL}/wallet`,
  },

  // Promotions endpoints
  PROMOTIONS: {
    GET_BY_CODE: (code: string) => `${BASE_URL}/promotions/code/${code}`,
  },
  // Thêm vào bên trong const API_ENDPOINTS = { ... }
  BLOGS: {
    LIST: `${BASE_URL}/blogs`,
    DETAIL: (id: string | number) => `${BASE_URL}/blogs/${id}`,
    CREATE: `${BASE_URL}/blogs`,
    UPDATE: (id: string | number) => `${BASE_URL}/blogs/${id}`,
    DELETE: (id: string | number) => `${BASE_URL}/blogs/${id}`,
  },
};

export default BASE_URL;
