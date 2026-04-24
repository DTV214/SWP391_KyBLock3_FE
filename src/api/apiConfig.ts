// Backend base URL (.NET 8)
// src/api/apiConfig.ts
// Prefer configuring via Vite env:
// - VITE_API_BASE_URL=http://localhost:5280/api
// - VITE_API_BASE_URL=http://14.225.207.221:5000/api

// 1. Vite env typing
interface ViteEnv {
  VITE_API_BASE_URL?: string;
}
// const ENV_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
const ENV_BASE_URL = (import.meta as unknown as { env: ViteEnv }).env
  ?.VITE_API_BASE_URL;
// Fallback to current production server if env is not set
const BASE_URL = (ENV_BASE_URL?.trim() || "http://14.225.207.221:5002/api").replace(/\/+$/, "");
// const ROOT_URL = BASE_URL.replace(/\/api$/i, "");

// const BASE_URL = (ENV_BASE_URL?.trim() || "https://localhost:7056/api").replace(
//   /\/+$/,
//   "",
// );
// const BASE_URL = (ENV_BASE_URL?.trim() || "http://localhost:5280/api").replace(/\/+$/, "");
// Change .env for local/deploy without touching this file.
export const API_ENDPOINTS = {
  AUTH: {
    // Match the Swagger endpoint format exactly
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER_REQUEST_OTP: `${BASE_URL}/auth/register/request-otp`,
    REGISTER_VERIFY_OTP: `${BASE_URL}/auth/register/verify-otp`,
    FORGOT_PASSWORD_REQUEST_OTP: `${BASE_URL}/auth/forgot-password/request-otp`,
    FORGOT_PASSWORD_RESET: `${BASE_URL}/auth/forgot-password/reset`,
  },
  CONTACTS: {
    PUBLIC_CREATE: `${BASE_URL}/contacts`,
    ADMIN_LIST: `${BASE_URL}/contacts/admin`,
    ADMIN_UPDATE: (id: string | number) => `${BASE_URL}/contacts/admin/${id}`,
    ADMIN_DELETE: (id: string | number) => `${BASE_URL}/contacts/admin/${id}`,
  },

  INVENTORY: {
    LOW_STOCK: (threshold: number = 10) =>
      `${BASE_URL}/inventories/low-stock?threshold=${threshold}`,

    
    STOCKS: `${BASE_URL}/inventories/stocks`,
    STOCK_DETAIL: (id: string | number) =>
      `${BASE_URL}/inventories/stocks/${id}`,
    CREATE_STOCK: `${BASE_URL}/inventories/stocks`,
    UPDATE_STOCK: (id: string | number) =>
      `${BASE_URL}/inventories/stocks/${id}`,
    DELETE_STOCK: (id: string | number) =>
      `${BASE_URL}/inventories/stocks/${id}`,

    // Lấy tồn kho theo Product
    STOCKS_BY_PRODUCT: (productId: string | number) =>
      `${BASE_URL}/inventories/products/${productId}/stocks`,
    // Lịch sử di chuyển kho
    STOCK_MOVEMENTS: `${BASE_URL}/inventories/movements`,
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
    SHOP_BASKETS: `${BASE_URL}/products/shop`,
    CUSTOM_PRODUCT_BY_ID: (id: string | number) =>
      `${BASE_URL}/products/custom/${id}`,
    CLONE_TEMPLATE: (templateId: string | number) =>
      `${BASE_URL}/products/templates/${templateId}/clone`,
    SET_AS_TEMPLATE: (id: string | number) =>
      `${BASE_URL}/products/${id}/set-as-template`,
    REMOVE_TEMPLATE: (id: string | number) =>
      `${BASE_URL}/products/${id}/remove-template`,
    HARD_DELETE: (id: string | number) => `${BASE_URL}/products/${id}/hard`,
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
    HARD_DELETE: (id: string | number) => `${BASE_URL}/configs/${id}/hard`,
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
    MY_ORDERS: `${BASE_URL}/orders/me`,
    INVOICE: (orderId: string | number) => `${BASE_URL}/orders/${orderId}/invoice`,
    UPDATE_SHIPPING_INFO: (orderId: string | number) =>
      `${BASE_URL}/orders/${orderId}/shipping-info`,
    UPDATE_STATUS: (orderId: string | number) =>
      `${BASE_URL}/orders/${orderId}/status`,
    ALLOCATE_STOCK: (orderId: string | number) =>
      `${BASE_URL}/orders/${orderId}/allocate-stock`,
    CANCEL: (orderId: string | number) =>
      `${BASE_URL}/orders/${orderId}/cancel`,
  },

  // Payments endpoints
  PAYMENTS: {
    CREATE: `${BASE_URL}/payments`,
    BY_ORDER: (orderId: string | number) =>
      `${BASE_URL}/payments/order/${orderId}`,
    MY_PAYMENTS: `${BASE_URL}/payments/my-payments`,
    // PAY_BY_WALLET: `${BASE_URL}/payments/wallet/pay`,
    VNPAY_RETURN: `${BASE_URL}/payments/vnpay-return`,
  },

  // // Wallet endpoints
  // WALLET: {
  //   GET: `${BASE_URL}/wallet`,
  // },

  // Promotions endpoints
  PROMOTIONS: {
    LIST: `${BASE_URL}/promotions`,
    BY_ACCOUNT: `${BASE_URL}/promotions/accounts`,
    CREATE: `${BASE_URL}/promotions`,
    DETAIL: (id: string | number) => `${BASE_URL}/promotions/${id}`,
    UPDATE: (id: string | number) => `${BASE_URL}/promotions/${id}`,
    DELETE: (id: string | number) => `${BASE_URL}/promotions/${id}`,
    GET_BY_CODE: (code: string) => `${BASE_URL}/promotions/code/${code}`,
    LIMITED: `${BASE_URL}/promotions/limited`,
    LIMITED_PUBLIC: `${BASE_URL}/promotions/limited/public`,
    SAVE_TO_ACCOUNT: `${BASE_URL}/promotions/accounts`,
  },

  BLOGS: {
    LIST: `${BASE_URL}/blogs`,
    DETAIL: (id: string | number) => `${BASE_URL}/blogs/${id}`,
    CREATE: `${BASE_URL}/blogs`,
    UPDATE: (id: string | number) => `${BASE_URL}/blogs/${id}`,
    DELETE: (id: string | number) => `${BASE_URL}/blogs/${id}`,
  },
  CHAT: {
    USER_CONVERSATION: `${BASE_URL}/chat/conversation`,
    USER_MESSAGES: (conversationId: string | number) =>
      `${BASE_URL}/chat/messages/me/${conversationId}`,
    USER_SEND: `${BASE_URL}/chat/send`,
    ADMIN_ALL_CONVERSATIONS: `${BASE_URL}/chat/all`,
    ADMIN_MESSAGES: (conversationId: string | number) =>
      `${BASE_URL}/chat/messages/${conversationId}`,
    ADMIN_REPLY: (conversationId: string | number) =>
      `${BASE_URL}/chat/reply/${conversationId}`,
    READ: (conversationId: string | number) =>
      `${BASE_URL}/chat/read/${conversationId}`,
    BACKOFFICE_ORDER_DETAIL: (orderId: string | number) =>
      `${BASE_URL}/orders/${orderId}`,
  },
  STORE_LOCATIONS: {
    LIST: `${BASE_URL}/store-locations`,
    ACTIVE: `${BASE_URL}/store-locations/active`,
    DETAIL: (id: string | number) => `${BASE_URL}/store-locations/${id}`,
    CREATE: `${BASE_URL}/store-locations`,
    UPDATE: (id: string | number) => `${BASE_URL}/store-locations/${id}`,
    DELETE: (id: string | number) => `${BASE_URL}/store-locations/${id}`,
  },
  DIRECTIONS: {
    TO_STORE: (storeLocationId: string | number) =>
      `${BASE_URL}/directions/to-store/${storeLocationId}`,
  },
  // Admin Accounts endpoints
  ADMIN_ACCOUNTS: {
    LIST: `${BASE_URL}/admin/accounts`,
    CREATE: `${BASE_URL}/admin/accounts`,
    DETAIL: (id: string | number) => `${BASE_URL}/admin/accounts/${id}`,
    DELETE: (id: string | number) => `${BASE_URL}/admin/accounts/${id}`,
    UPDATE_STATUS: (id: string | number) =>
      `${BASE_URL}/admin/accounts/${id}/status`,
  },
  // AI Chatbot endpoint
  AI_CHAT: {
    SEND: `${BASE_URL}/aichat`,
  },
  // Media upload endpoint
  MEDIA: {
    UPLOAD: `${BASE_URL}/media/upload`,
    DELETE: `${BASE_URL}/media/delete`,
  },
  DASHBOARD: {
    SUMMARY: (
      period: string = "month",
      startDate?: string,
      endDate?: string,
    ) => {
      let url = `${BASE_URL}/dashboards/summary?period=${period}`;
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
      return url;
    },
    REVENUE: (period: string = "day", startDate?: string, endDate?: string) => {
      let url = `${BASE_URL}/dashboards/revenue?period=${period}`;
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
      return url;
    },
    ACTUAL_REVENUE: (
      period: string = "day",
      startDate?: string,
      endDate?: string,
    ) => {
      let url = `${BASE_URL}/dashboards/actual-revenue?period=${period}`;
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
      return url;
    },
    MONTHLY_ORDER_REVENUE_COMPARISON: (
      year: number,
      month: number,
      compareYear: number,
      compareMonth: number,
    ) => {
      const params = [
        `Year=${encodeURIComponent(String(year))}`,
        `Month=${encodeURIComponent(String(month))}`,
        `CompareYear=${encodeURIComponent(String(compareYear))}`,
        `CompareMonth=${encodeURIComponent(String(compareMonth))}`,
      ];
      return `${BASE_URL}/dashboard-comparisons/monthly-order-revenue?${params.join("&")}`;
    },
    MONTHLY_ACTUAL_REVENUE_COMPARISON: (
      year: number,
      month: number,
      compareYear: number,
      compareMonth: number,
    ) => {
      const params = [
        `Year=${encodeURIComponent(String(year))}`,
        `Month=${encodeURIComponent(String(month))}`,
        `CompareYear=${encodeURIComponent(String(compareYear))}`,
        `CompareMonth=${encodeURIComponent(String(compareMonth))}`,
      ];
      return `${BASE_URL}/dashboard-comparisons/monthly-actual-revenue?${params.join("&")}`;
    },
    YEARLY_ORDER_REVENUE_COMPARISON: (
      year: number,
      compareYear: number,
    ) => {
      const params = [
        `Year=${encodeURIComponent(String(year))}`,
        `CompareYear=${encodeURIComponent(String(compareYear))}`,
      ];
      return `${BASE_URL}/dashboard-comparisons/yearly-order-revenue-comparison?${params.join("&")}`;
    },
    YEARLY_ACTUAL_REVENUE_COMPARISON: (
      year: number,
      compareYear: number,
    ) => {
      const params = [
        `Year=${encodeURIComponent(String(year))}`,
        `CompareYear=${encodeURIComponent(String(compareYear))}`,
      ];
      return `${BASE_URL}/dashboard-comparisons/yearly-actual-revenue-comparison?${params.join("&")}`;
    },
    CATEGORY_PERFORMANCE: (
      period: string,
      date?: string,
      year?: number,
      month?: number,
    ) => {
      const params = [`period=${encodeURIComponent(period)}`];
      if (date) params.push(`date=${encodeURIComponent(date)}`);
      if (year != null) params.push(`year=${encodeURIComponent(String(year))}`);
      if (month != null) params.push(`month=${encodeURIComponent(String(month))}`);
      return `${BASE_URL}/dashboard-rankings/category-performance?${params.join("&")}`;
    },
    CATEGORY_PRODUCTS_PERFORMANCE: (
      categoryId: string | number,
      period: string,
      date?: string,
      year?: number,
      month?: number,
    ) => {
      const params = [
        `categoryId=${encodeURIComponent(String(categoryId))}`,
        `period=${encodeURIComponent(period)}`,
      ];
      if (date) params.push(`date=${encodeURIComponent(date)}`);
      if (year != null) params.push(`year=${encodeURIComponent(String(year))}`);
      if (month != null) params.push(`month=${encodeURIComponent(String(month))}`);
      return `${BASE_URL}/dashboard-rankings/category-products-performance?${params.join("&")}`;
    },
    ACCOUNT_STATS: (
      period: string = "day",
      startDate?: string,
      endDate?: string,
    ) => {
      let url = `${BASE_URL}/dashboards/accounts?period=${period}`;
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
      return url;
    },
    PAYMENT_CHANNELS: (startDate?: string, endDate?: string) => {
      let url = `${BASE_URL}/dashboards/payment-channels`;
      const params = [];
      if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      return url;
    },
    ABANDONED_CARTS: (days?: number) => {
      let url = `${BASE_URL}/dashboards/abandoned-carts`;
      if (days) url += `?days=${days}`;
      return url;
    },
    CUSTOMER_STATISTICS: (startDate?: string, endDate?: string) => {
      let url = `${BASE_URL}/dashboards/customer-statistics`;
      const params = [];
      if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      return url;
    },
    INSIGHTS: (startDate?: string, endDate?: string) => {
      let url = `${BASE_URL}/dashboards/insights`;
      const params = [];
      if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      return url;
    },
  },
  STATISTICS: {
    PRODUCT: (productId: string | number) =>
      `${BASE_URL}/statistics/product/${productId}`,
    EVENT_TREND: (month: number) =>
      `${BASE_URL}/statistics/event-trend?month=${encodeURIComponent(String(month))}`,
  },
  ASSOCIATIONS: {
    PRODUCT_ASSOCIATIONS: (
      productId: string | number,
      top: number = 10,
      minSupport: number = 1,
    ) => {
      const params = [
        `productId=${encodeURIComponent(String(productId))}`,
        `top=${encodeURIComponent(String(top))}`,
        `minSupport=${encodeURIComponent(String(minSupport))}`,
      ];
      return `${BASE_URL}/admin/associations/product-associations?${params.join("&")}`;
    },
  },
  // Feedbacks endpoints
  FEEDBACKS: {
    ADD_ORDER_FEEDBACK: (orderId: string | number) =>
      `${BASE_URL}/orders/${orderId}/feedback`,
    UPDATE_FEEDBACK: (feedbackId: string | number) =>
      `${BASE_URL}/feedbacks/${feedbackId}`,
    DELETE_FEEDBACK: (feedbackId: string | number) =>
      `${BASE_URL}/feedbacks/${feedbackId}`,
    GET_PRODUCT_FEEDBACKS: (productId: string | number) =>
      `${BASE_URL}/products/${productId}/feedbacks`,
  },
};

export default BASE_URL;
