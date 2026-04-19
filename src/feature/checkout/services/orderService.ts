import axiosClient from "../../../api/axiosClient";
import { API_ENDPOINTS } from "../../../api/apiConfig";

// DTO interfaces for Order
export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  note?: string | null;
  promotionCode?: string | null;
  requireVatInvoice: boolean;
  vatCompanyName?: string | null;
  vatCompanyTaxCode?: string | null;
  vatCompanyAddress?: string | null;
  vatInvoiceEmail?: string | null;
}

export interface ProductDetail {
  productdetailid: number;
  // Backward-compat field name used in some older payloads
  productDetailid?: number;
  productparentid?: number | null;
  productid?: number | null;
  categoryid?: number | null;
  productname?: string | null;
  unit?: number | null;
  price?: number | null;
  imageurl?: string | null;
  quantity?: number | null;
  childProduct?: unknown | null;
}

export interface OrderItem {
  orderDetailId: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  amount: number;
  imageUrl: string;
  productDetails?: ProductDetail[] | null;
}

export interface FeedbackResponse {
  feedbackId: number;
  orderId: number;
  rating: number;
  comment: string | null;
  customerName: string | null;
}

export interface OrderResponse {
  orderId: number;
  accountId: number;
  orderDateTime: string;
  totalPrice: number;
  discountValue: number;
  finalPrice: number;
  actualRevenue?: number | null;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  note: string;
  promotionCode: string;
  shippedDate?: string | null;
  isQuotation?: number | null;

  requireVatInvoice: boolean;
  vatRate: number;
  vatAmount: number;
  finalPayableAmount: number;
  vatCompanyName?: string | null;
  vatCompanyTaxCode?: string | null;
  vatCompanyAddress?: string | null;
  vatInvoiceEmail?: string | null;

  feedback?: FeedbackResponse | null;
  items: OrderItem[];
}

export interface UpdateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  note: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
}

export interface AllocateStockResponse {
  message: string;
}

// Paginated Response
export interface PaginatedOrderResponse {
  data: OrderResponse[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
};

const unwrapApiData = <T>(response: unknown): T => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as { data?: unknown }).data !== undefined
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
};

const normalizeProductDetail = (detail: Partial<ProductDetail>): ProductDetail => {
  const productDetailId = toNumber(
    detail.productdetailid ?? detail.productDetailid,
    0,
  );

  return {
    productdetailid: productDetailId,
    productDetailid: productDetailId,
    productparentid:
      detail.productparentid == null ? null : toNumber(detail.productparentid),
    productid: detail.productid == null ? null : toNumber(detail.productid),
    categoryid:
      detail.categoryid == null ? null : toNumber(detail.categoryid),
    productname: detail.productname ?? null,
    unit: detail.unit == null ? null : toNumber(detail.unit),
    price: detail.price == null ? null : toNumber(detail.price),
    imageurl: detail.imageurl ?? null,
    quantity: detail.quantity == null ? null : toNumber(detail.quantity),
    childProduct: detail.childProduct ?? null,
  };
};

const normalizeOrderItem = (item: Partial<OrderItem>): OrderItem => {
  const quantity = toNumber(item.quantity, 0);
  const amount = toNumber(item.amount, 0);
  const price =
    item.price == null
      ? quantity > 0
        ? Math.round(amount / quantity)
        : 0
      : toNumber(item.price, 0);

  return {
    orderDetailId: toNumber(item.orderDetailId, 0),
    productId: toNumber(item.productId, 0),
    productName: item.productName ?? "",
    sku: item.sku ?? "",
    quantity,
    price,
    amount,
    imageUrl: item.imageUrl ?? "",
    productDetails: Array.isArray(item.productDetails)
      ? item.productDetails.map(normalizeProductDetail)
      : null,
  };
};

const normalizeOrderResponse = (order: Partial<OrderResponse>): OrderResponse => {
  const totalPrice = toNumber(order.totalPrice, 0);
  const discountValue = toNumber(order.discountValue, 0);
  const computedFinalPrice = Math.max(totalPrice - discountValue, 0);
  const finalPrice = toNumber(order.finalPrice, computedFinalPrice);
  const requireVatInvoice = toBoolean(order.requireVatInvoice, false);
  const vatRate = toNumber(order.vatRate, requireVatInvoice ? 0.08 : 0);
  const fallbackVatAmount = requireVatInvoice
    ? Math.round(finalPrice * vatRate)
    : 0;
  const vatAmount = toNumber(order.vatAmount, fallbackVatAmount);
  const finalPayableAmount = toNumber(
    order.finalPayableAmount,
    finalPrice + vatAmount,
  );

  return {
    orderId: toNumber(order.orderId, 0),
    accountId: toNumber(order.accountId, 0),
    orderDateTime: order.orderDateTime ?? "",
    totalPrice,
    discountValue,
    finalPrice,
    actualRevenue:
      order.actualRevenue == null ? null : toNumber(order.actualRevenue),
    status: order.status ?? "",
    customerName: order.customerName ?? "",
    customerPhone: order.customerPhone ?? "",
    customerEmail: order.customerEmail ?? "",
    customerAddress: order.customerAddress ?? "",
    note: order.note ?? "",
    promotionCode: order.promotionCode ?? "",
    shippedDate: order.shippedDate ?? null,
    isQuotation: order.isQuotation == null ? null : toNumber(order.isQuotation),
    requireVatInvoice,
    vatRate,
    vatAmount,
    finalPayableAmount,
    vatCompanyName: order.vatCompanyName ?? null,
    vatCompanyTaxCode: order.vatCompanyTaxCode ?? null,
    vatCompanyAddress: order.vatCompanyAddress ?? null,
    vatInvoiceEmail: order.vatInvoiceEmail ?? null,
    feedback: order.feedback ?? null,
    items: Array.isArray(order.items)
      ? order.items.map(normalizeOrderItem)
      : [],
  };
};

const normalizePaginatedOrderResponse = (
  payload: Partial<PaginatedOrderResponse>,
): PaginatedOrderResponse => {
  return {
    data: Array.isArray(payload.data)
      ? payload.data.map(normalizeOrderResponse)
      : [],
    currentPage: toNumber(payload.currentPage, 1),
    totalPages: toNumber(payload.totalPages, 1),
    totalItems: toNumber(payload.totalItems, 0),
    pageSize: toNumber(payload.pageSize, 10),
  };
};

/**
 * Create a new order from cart.
 * POST /api/orders
 */
export const createOrder = async (
  request: CreateOrderRequest,
  token?: string,
): Promise<OrderResponse> => {
  const response = await axiosClient.post(API_ENDPOINTS.ORDERS.CREATE, request, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return normalizeOrderResponse(unwrapApiData<Partial<OrderResponse>>(response));
};

/**
 * Get current user's orders (paginated).
 * GET /api/orders/me?pageNumber=1&pageSize=10
 */
export const getMyOrders = async (
  pageNumber = 1,
  token?: string,
): Promise<PaginatedOrderResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.ORDERS.MY_ORDERS, {
    params: {
      pageNumber,
      pageSize: 10,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return normalizePaginatedOrderResponse(
    unwrapApiData<Partial<PaginatedOrderResponse>>(response),
  );
};

/**
 * Get all orders (admin, paginated).
 * GET /api/orders?pageNumber=1&pageSize=10
 */
export const getAllOrders = async (
  pageNumber = 1,
  token?: string,
): Promise<PaginatedOrderResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.ORDERS.LIST, {
    params: {
      pageNumber,
      pageSize: 10,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return normalizePaginatedOrderResponse(
    unwrapApiData<Partial<PaginatedOrderResponse>>(response),
  );
};

/**
 * Get order by ID.
 * GET /api/orders/{orderId}
 */
export const getOrderById = async (
  orderId: number,
  token?: string,
): Promise<OrderResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.ORDERS.DETAIL(orderId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return normalizeOrderResponse(unwrapApiData<Partial<OrderResponse>>(response));
};

// Update shipping info.
export const updateOrderShippingInfo = async (
  orderId: number,
  payload: UpdateOrderRequest,
  token?: string,
): Promise<OrderResponse> => {
  const response = await axiosClient.put(
    API_ENDPOINTS.ORDERS.UPDATE_SHIPPING_INFO(orderId),
    payload,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  return normalizeOrderResponse(unwrapApiData<Partial<OrderResponse>>(response));
};

/**
 * Update order status.
 * PUT /api/orders/{orderId}/status
 */
export const updateOrderStatus = async (
  orderId: number,
  status: string,
  token?: string,
): Promise<OrderResponse> => {
  const response = await axiosClient.put(
    API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
    { status } as UpdateOrderStatusRequest,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  return normalizeOrderResponse(unwrapApiData<Partial<OrderResponse>>(response));
};

export const allocateOrderStock = async (
  orderId: number,
  token?: string,
): Promise<AllocateStockResponse> => {
  const response = await axiosClient.post(
    API_ENDPOINTS.ORDERS.ALLOCATE_STOCK(orderId),
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  return unwrapApiData<AllocateStockResponse>(response);
};

/**
 * Cancel order.
 * DELETE /api/orders/{orderId}/cancel
 */
export const cancelOrder = async (
  orderId: number,
  token?: string,
): Promise<OrderResponse> => {
  const response = await axiosClient.delete(API_ENDPOINTS.ORDERS.CANCEL(orderId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return normalizeOrderResponse(unwrapApiData<Partial<OrderResponse>>(response));
};

/**
 * Download invoice PDF.
 * GET /api/orders/{orderId}/invoice
 */
export const downloadInvoice = async (
  orderId: number,
  token?: string,
): Promise<void> => {
  return downloadPdfByUrl(
    API_ENDPOINTS.ORDERS.INVOICE(orderId),
    orderId,
    token,
    "HoaDon",
  );
};

const downloadPdfByUrl = async (
  requestUrl: string,
  orderId: number,
  token: string | undefined,
  filePrefix: string,
): Promise<void> => {
  const response = await axiosClient.get(
    requestUrl,
    {
      responseType: "blob",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  const fileBlob = unwrapApiData<Blob>(response);

  // Safety check: avoid downloading HTML fallback as a PDF file.
  if (fileBlob.type && fileBlob.type.includes("text/html")) {
    throw new Error(
      "Tinh nang in hoa don chua duoc deploy len may chu, hoac don hang khong ton tai.",
    );
  }

  const blob = new Blob([fileBlob], { type: "application/pdf" });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.setAttribute(
    "download",
    `${filePrefix}_${orderId.toString().padStart(6, "0")}.pdf`,
  );
  document.body.appendChild(link);
  link.click();

  if (link.parentNode) {
    link.parentNode.removeChild(link);
  }
  window.URL.revokeObjectURL(objectUrl);
};

// Export all as object for easier importing
export const orderService = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderShippingInfo,
  updateOrderStatus,
  allocateOrderStock,
  cancelOrder,
  downloadInvoice,
};
