import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

export interface DashboardSummary {
  revenue: {
    period: string;
    data: Array<{
      date: string;
      revenue: number;
      revenueBeforeDiscount?: number;
      orderCount: number;
    }>;
    totalRevenue: number;
    totalRevenueBeforeDiscount?: number;
    totalOrders: number;
  };
  paymentChannels: {
    data: Array<{
      channel: string;
      count: number;
      totalAmount: number;
      percentage: number;
    }>;
    total: {
      channel: string;
      count: number;
      totalAmount: number;
      percentage: number;
    };
  };
  abandonedCarts: {
    totalCarts: number;
    totalValue: number;
    averageCartValue: number;
    carts: Array<{
      cartId: number;
      accountId: number;
      totalValue: number;
      itemCount: number;
    }>;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
  };
  newAccounts: {
    period: string;
    data: Array<{
      date: string;
      count: number;
    }>;
    totalCount: number;
  };
  // Metrics from summary endpoint
  totalCustomerAccounts?: number;
  accountsWithOrders?: number;
  conversionRate?: number;
  totalProducts?: number;
  totalCustomers?: number;
  recentOrders?: Array<{
    id: string;
    customer: string;
    total: number;
    status: string;
    statusColor: string;
    date: string;
  }>;
  topProducts?: HighlightProduct[];
}

export const getDashboardSummary = async (period: string = "month", startDate?: string, endDate?: string): Promise<DashboardSummary> => {
  const response: any = await axiosClient.get(
    API_ENDPOINTS.DASHBOARD.SUMMARY(period, startDate, endDate),
  );
  const root = response?.data ?? response;
  const summaryRoot =
    root?.revenue ||
    root?.orders ||
    root?.newAccounts ||
    root?.paymentChannels ||
    root?.abandonedCarts
      ? root
      : (root?.data ?? root?.Data ?? root);

  const toSafeNumber = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const revenueRoot = summaryRoot?.revenue ?? summaryRoot?.Revenue ?? {};
  const revenueDataSource = Array.isArray(revenueRoot?.data)
    ? revenueRoot.data
    : Array.isArray(revenueRoot?.Data)
      ? revenueRoot.Data
      : [];
  const totalRevenueBeforeDiscountFromData = revenueDataSource.reduce(
    (sum: number, item: any) =>
      sum +
      toSafeNumber(
        item?.revenueBeforeDiscount ??
          item?.RevenueBeforeDiscount ??
          item?.totalBeforeDiscount ??
          item?.TotalBeforeDiscount,
      ),
    0,
  );
  const paymentChannelsRoot =
    summaryRoot?.paymentChannels ?? summaryRoot?.PaymentChannels ?? {};
  const paymentChannelsTotalAmount = toSafeNumber(
    paymentChannelsRoot?.total?.totalAmount ??
      paymentChannelsRoot?.Total?.TotalAmount ??
      paymentChannelsRoot?.totalAmount ??
      paymentChannelsRoot?.TotalAmount,
  );
  const totalRevenueBeforeDiscount =
    toSafeNumber(
      revenueRoot?.totalRevenueBeforeDiscount ??
        revenueRoot?.TotalRevenueBeforeDiscount,
    ) ||
    totalRevenueBeforeDiscountFromData ||
    paymentChannelsTotalAmount;
  const data: DashboardSummary = {
    ...(summaryRoot as DashboardSummary),
    revenue: {
      ...revenueRoot,
      totalRevenue: toSafeNumber(
        revenueRoot?.totalRevenue ?? revenueRoot?.TotalRevenue,
      ),
      totalRevenueBeforeDiscount,
    },
    topProducts: Array.isArray(summaryRoot?.topProducts)
      ? summaryRoot.topProducts.map((p: any) => ({
          productId: toSafeNumber(p?.productId ?? p?.ProductId),
          productName: String(p?.productName ?? p?.ProductName ?? ""),
          imageUrl: p?.imageUrl ?? p?.ImageUrl,
          totalQuantity: toSafeNumber(p?.totalQuantity ?? p?.TotalQuantity),
          totalRevenue: toSafeNumber(p?.totalRevenue ?? p?.TotalRevenue),
          price: toSafeNumber(p?.price ?? p?.Price),
          importPrice: toSafeNumber(p?.importPrice ?? p?.ImportPrice),
          totalProfit: toSafeNumber(p?.totalProfit ?? p?.TotalProfit),
        }))
      : [],
  };

  // Fallback: some backend builds do not include totalProducts in summary.
  if (data.totalProducts == null || Number(data.totalProducts) <= 0) {
    try {
      const prodRes: any = await axiosClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}?pageNumber=1&pageSize=1`);
      const firstWrap = prodRes?.data || prodRes;
      const paged = firstWrap?.data || firstWrap;

      if (typeof paged?.totalItems === "number") {
        data.totalProducts = paged.totalItems;
      } else if (typeof firstWrap?.totalItems === "number") {
        data.totalProducts = firstWrap.totalItems;
      } else if (Array.isArray(paged)) {
        data.totalProducts = paged.length;
      } else {
        data.totalProducts = 0;
      }
    } catch {
      data.totalProducts = 0;
    }
  }

  return data;
};

export const getAccountStatistics = async (period: string = "day", startDate?: string, endDate?: string): Promise<any> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.ACCOUNT_STATS(period, startDate, endDate));
  return response.data;
};

export const getPaymentChannelStatistics = async (startDate?: string, endDate?: string): Promise<any> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.PAYMENT_CHANNELS(startDate, endDate));
  return response.data;
};

export const getAbandonedCarts = async (days?: number): Promise<any> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.ABANDONED_CARTS(days));
  return response.data;
};

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueChartResponse {
  period: string;
  data: RevenueDataPoint[];
  totalRevenue: number;
  totalOrders: number;
}

export interface MonthlyComparisonDataPoint {
  day: number;
  value: number;
}

export interface MonthlyComparisonMonthData {
  year: number;
  month: number;
  label: string;
  daysInMonth: number;
  total: number;
  data: MonthlyComparisonDataPoint[];
}

export interface MonthlyComparisonResponse {
  metric: "ORDER_REVENUE" | "ACTUAL_REVENUE" | string;
  xAxisDays: number[];
  baseMonth: MonthlyComparisonMonthData;
  compareMonth: MonthlyComparisonMonthData;
}

export interface YearlyComparisonDataPoint {
  month: number;
  value: number;
}

export interface YearlyComparisonYearData {
  year: number;
  label: string;
  total: number;
  data: YearlyComparisonDataPoint[];
}

export interface YearlyComparisonResponse {
  metric: "ORDER_REVENUE" | "ACTUAL_REVENUE" | string;
  xAxisMonths: number[];
  baseYear: YearlyComparisonYearData;
  compareYear: YearlyComparisonYearData;
}

export type DashboardRankingPeriod = "week" | "month" | "year";

export interface DashboardRankingParams {
  period: DashboardRankingPeriod;
  date?: string;
  year?: number;
  month?: number;
}

export interface DashboardRankingRange {
  period: DashboardRankingPeriod | string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface CategoryPerformanceItem {
  categoryId: number;
  categoryName: string;
  revenue: number;
  profit: number;
  quantitySold: number;
}

export interface CategoryPerformanceResponse {
  range: DashboardRankingRange;
  totalRevenue: number;
  totalProfit: number;
  totalQuantitySold: number;
  data: CategoryPerformanceItem[];
}

export interface ProductPerformanceItem extends CategoryPerformanceItem {
  productId: number;
  productName: string;
}

export interface CategoryProductsPerformanceResponse {
  range: DashboardRankingRange;
  categoryId: number;
  categoryName: string;
  totalRevenue: number;
  totalProfit: number;
  totalQuantitySold: number;
  data: ProductPerformanceItem[];
}

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const unwrapRankingPayload = (raw: any): any => {
  const root = raw ?? {};

  if (
    root?.range ||
    root?.Range ||
    root?.totalRevenue != null ||
    root?.TotalRevenue != null ||
    Array.isArray(root?.data) ||
    Array.isArray(root?.Data)
  ) {
    return root;
  }

  const nested = root?.data ?? root?.Data;

  if (
    nested?.range ||
    nested?.Range ||
    nested?.totalRevenue != null ||
    nested?.TotalRevenue != null ||
    Array.isArray(nested?.data) ||
    Array.isArray(nested?.Data)
  ) {
    return nested;
  }

  return root;
};

const normalizeRankingRange = (raw: any): DashboardRankingRange => ({
  period: String(raw?.period ?? raw?.Period ?? ""),
  label: String(raw?.label ?? raw?.Label ?? ""),
  startDate: String(raw?.startDate ?? raw?.StartDate ?? ""),
  endDate: String(raw?.endDate ?? raw?.EndDate ?? ""),
});

const normalizeRevenueResponse = (raw: any): RevenueChartResponse => {
  const container = raw?.data ?? raw;
  // actual-revenue currently returns data.totalActualRevenue = { period, data, totalRevenue, totalOrders }
  const root = container?.totalActualRevenue ?? container?.actualRevenue ?? container;
  const period = String(root?.period ?? root?.Period ?? "day");
  const source = Array.isArray(root?.data)
    ? root.data
    : Array.isArray(root?.Data)
      ? root.Data
      : [];

  const data: RevenueDataPoint[] = source.map((item: any) => ({
    date: String(item?.date ?? item?.Date ?? ""),
    revenue: toNumber(
      item?.revenue ??
      item?.Revenue ??
      item?.actualRevenue ??
      item?.ActualRevenue ??
      item?.value ??
      item?.Value,
    ),
    orderCount: toNumber(item?.orderCount ?? item?.OrderCount ?? 0),
  }));

  const totalRevenue = toNumber(
    root?.totalRevenue ?? root?.TotalRevenue ?? root?.totalActualRevenue ?? root?.TotalActualRevenue,
  );
  const totalOrders = toNumber(root?.totalOrders ?? root?.TotalOrders ?? 0);

  return { period, data, totalRevenue, totalOrders };
};

const normalizeMonthlyComparisonResponse = (raw: any): MonthlyComparisonResponse => {
  const container = raw?.data ?? raw;
  const root = container?.data ?? container;

  const xAxisDays = Array.isArray(root?.xAxisDays)
    ? root.xAxisDays.map((day: unknown) => toNumber(day))
    : [];

  const mapMonth = (monthRaw: any): MonthlyComparisonMonthData => {
    const dataRaw = Array.isArray(monthRaw?.data) ? monthRaw.data : [];
    return {
      year: toNumber(monthRaw?.year),
      month: toNumber(monthRaw?.month),
      label: String(monthRaw?.label ?? ""),
      daysInMonth: toNumber(monthRaw?.daysInMonth),
      total: toNumber(monthRaw?.total),
      data: dataRaw.map((point: any) => ({
        day: toNumber(point?.day),
        value: toNumber(point?.value),
      })),
    };
  };

  return {
    metric: String(root?.metric ?? ""),
    xAxisDays,
    baseMonth: mapMonth(root?.baseMonth),
    compareMonth: mapMonth(root?.compareMonth),
  };
};

const normalizeYearlyComparisonResponse = (raw: any): YearlyComparisonResponse => {
  const container = raw?.data ?? raw;
  const root = container?.data ?? container;

  const xAxisMonths = Array.isArray(root?.xAxisMonths)
    ? root.xAxisMonths.map((month: unknown) => toNumber(month))
    : [];

  const mapYear = (yearRaw: any): YearlyComparisonYearData => {
    const dataRaw = Array.isArray(yearRaw?.data) ? yearRaw.data : [];
    return {
      year: toNumber(yearRaw?.year),
      label: String(yearRaw?.label ?? ""),
      total: toNumber(yearRaw?.total),
      data: dataRaw.map((point: any) => ({
        month: toNumber(point?.month),
        value: toNumber(point?.value),
      })),
    };
  };

  return {
    metric: String(root?.metric ?? ""),
    xAxisMonths,
    baseYear: mapYear(root?.baseYear),
    compareYear: mapYear(root?.compareYear),
  };
};

const normalizeCategoryPerformanceResponse = (raw: any): CategoryPerformanceResponse => {
  const root = unwrapRankingPayload(raw);
  const source = Array.isArray(root?.data)
    ? root.data
    : Array.isArray(root?.Data)
      ? root.Data
      : [];

  return {
    range: normalizeRankingRange(root?.range ?? root?.Range),
    totalRevenue: toNumber(root?.totalRevenue ?? root?.TotalRevenue),
    totalProfit: toNumber(root?.totalProfit ?? root?.TotalProfit),
    totalQuantitySold: toNumber(root?.totalQuantitySold ?? root?.TotalQuantitySold),
    data: source.map((item: any) => ({
      categoryId: toNumber(item?.categoryId ?? item?.CategoryId),
      categoryName: String(item?.categoryName ?? item?.CategoryName ?? ""),
      revenue: toNumber(item?.revenue ?? item?.Revenue),
      profit: toNumber(item?.profit ?? item?.Profit),
      quantitySold: toNumber(item?.quantitySold ?? item?.QuantitySold),
    })),
  };
};

const normalizeCategoryProductsPerformanceResponse = (
  raw: any,
): CategoryProductsPerformanceResponse => {
  const root = unwrapRankingPayload(raw);
  const source = Array.isArray(root?.data)
    ? root.data
    : Array.isArray(root?.Data)
      ? root.Data
      : [];

  return {
    range: normalizeRankingRange(root?.range ?? root?.Range),
    categoryId: toNumber(root?.categoryId ?? root?.CategoryId),
    categoryName: String(root?.categoryName ?? root?.CategoryName ?? ""),
    totalRevenue: toNumber(root?.totalRevenue ?? root?.TotalRevenue),
    totalProfit: toNumber(root?.totalProfit ?? root?.TotalProfit),
    totalQuantitySold: toNumber(root?.totalQuantitySold ?? root?.TotalQuantitySold),
    data: source.map((item: any) => ({
      productId: toNumber(item?.productId ?? item?.ProductId),
      productName: String(item?.productName ?? item?.ProductName ?? ""),
      categoryId: toNumber(item?.categoryId ?? item?.CategoryId),
      categoryName: String(item?.categoryName ?? item?.CategoryName ?? ""),
      revenue: toNumber(item?.revenue ?? item?.Revenue),
      profit: toNumber(item?.profit ?? item?.Profit),
      quantitySold: toNumber(item?.quantitySold ?? item?.QuantitySold),
    })),
  };
};

export const getRevenue = async (period: string = "day", startDate?: string, endDate?: string): Promise<RevenueChartResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.REVENUE(period, startDate, endDate));
  return normalizeRevenueResponse(response);
};

export const getActualRevenue = async (period: string = "day", startDate?: string, endDate?: string): Promise<RevenueChartResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.ACTUAL_REVENUE(period, startDate, endDate));
  return normalizeRevenueResponse(response);
};

export const getMonthlyOrderRevenueComparison = async (
  year: number,
  month: number,
  compareYear: number,
  compareMonth: number,
): Promise<MonthlyComparisonResponse> => {
  const response = await axiosClient.get(
    API_ENDPOINTS.DASHBOARD.MONTHLY_ORDER_REVENUE_COMPARISON(
      year,
      month,
      compareYear,
      compareMonth,
    ),
  );
  return normalizeMonthlyComparisonResponse(response);
};

export const getMonthlyActualRevenueComparison = async (
  year: number,
  month: number,
  compareYear: number,
  compareMonth: number,
): Promise<MonthlyComparisonResponse> => {
  const response = await axiosClient.get(
    API_ENDPOINTS.DASHBOARD.MONTHLY_ACTUAL_REVENUE_COMPARISON(
      year,
      month,
      compareYear,
      compareMonth,
    ),
  );
  return normalizeMonthlyComparisonResponse(response);
};

export const getYearlyOrderRevenueComparison = async (
  year: number,
  compareYear: number,
): Promise<YearlyComparisonResponse> => {
  const response = await axiosClient.get(
    API_ENDPOINTS.DASHBOARD.YEARLY_ORDER_REVENUE_COMPARISON(year, compareYear),
  );
  return normalizeYearlyComparisonResponse(response);
};

export const getYearlyActualRevenueComparison = async (
  year: number,
  compareYear: number,
): Promise<YearlyComparisonResponse> => {
  const response = await axiosClient.get(
    API_ENDPOINTS.DASHBOARD.YEARLY_ACTUAL_REVENUE_COMPARISON(year, compareYear),
  );
  return normalizeYearlyComparisonResponse(response);
};

export const getCategoryPerformance = async (
  params: DashboardRankingParams,
): Promise<CategoryPerformanceResponse> => {
  const response = await axiosClient.get(
    API_ENDPOINTS.DASHBOARD.CATEGORY_PERFORMANCE(
      params.period,
      params.date,
      params.year,
      params.month,
    ),
  );
  return normalizeCategoryPerformanceResponse(response);
};

export const getCategoryProductsPerformance = async (
  categoryId: string | number,
  params: DashboardRankingParams,
): Promise<CategoryProductsPerformanceResponse> => {
  const response = await axiosClient.get(
    API_ENDPOINTS.DASHBOARD.CATEGORY_PRODUCTS_PERFORMANCE(
      categoryId,
      params.period,
      params.date,
      params.year,
      params.month,
    ),
  );
  return normalizeCategoryProductsPerformanceResponse(response);
};

export interface CustomerOrderStatistics {
  accountId: number;
  fullName: string | null;
  email: string | null;
  totalOrders: number;
  successfulOrders: number;
  cancelledOrders: number;
  processingOrders: number;
  totalSpent: number;
  totalSpentAllTime: number;
  successRate: number;
}

export const getCustomerOrderStatistics = async (startDate?: string, endDate?: string): Promise<CustomerOrderStatistics[]> => {
  const response: any = await axiosClient.get(API_ENDPOINTS.DASHBOARD.CUSTOMER_STATISTICS(startDate, endDate));
  const rawData = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
  
  return rawData.map((c: any) => {
    const totalOrders = toNumber(c?.totalOrders ?? c?.TotalOrders);
    const successfulOrders = toNumber(c?.successfulOrders ?? c?.SuccessfulOrders);
    // Nếu server không trả về successRate, tự tính: (thành công / tổng) * 100
    const rawSuccessRate = c?.successRate ?? c?.SuccessRate;
    const successRate = rawSuccessRate != null 
      ? toNumber(rawSuccessRate) 
      : (totalOrders > 0 ? Math.round((successfulOrders / totalOrders) * 100) : 0);

    return {
      accountId: toNumber(c?.accountId ?? c?.AccountId),
      fullName: String(c?.fullName ?? c?.FullName ?? ""),
      email: String(c?.email ?? c?.Email ?? ""),
      totalOrders,
      successfulOrders,
      cancelledOrders: toNumber(c?.cancelledOrders ?? c?.CancelledOrders),
      processingOrders: toNumber(c?.processingOrders ?? c?.ProcessingOrders),
      totalSpent: toNumber(c?.totalSpent ?? c?.TotalSpent),
      totalSpentAllTime: toNumber(c?.totalSpentAllTime ?? c?.TotalSpentAllTime),
      successRate
    };
  });
};

export interface HighlightCustomer {
  accountId: number;
  fullName: string;
  email: string;
  totalValue: number;
  orderCount: number;
}

export interface HighlightProduct {
  productId: number;
  productName: string;
  imageUrl: string | null;
  totalQuantity: number;
  totalRevenue: number;
  price: number;
  importPrice: number;
  totalProfit: number;
}

export interface EventTrendCategory {
  categoryId: number;
  categoryName: string;
  totalSold: number;
  percentage: number;
}

export interface EventTrendProduct {
  productId: number;
  productName: string;
  imageUrl: string | null;
  totalSold: number;
}

export interface EventTrendResponse {
  requestedMonth: number;
  dataYear: number;
  topCategories: EventTrendCategory[];
  topProducts: EventTrendProduct[];
}

export interface ProductAssociationItem {
  productId: number;
  productName: string;
  coPurchaseCount: number;
  supportPercentage: number;
}

export interface CancellationStats {
  cancelledOrders: number;
  validOrders: number;
  cancellationRate: number;
}

export interface AbandonedCartValue {
  cartCount: number;
  totalLostValue: number;
}

export interface InactiveCustomer {
  accountId: number;
  fullName: string;
  email: string;
  phone: string | null;
  lastOrderDate: string | null;
  daysSinceLastOrder: number;
}

export interface DashboardHighlights {
  topSpender: HighlightCustomer | null;
  mostFrequentBuyer: HighlightCustomer | null;
  topCanceler: HighlightCustomer | null;
  topSellingProduct: HighlightProduct | null;
  underperformingProduct: HighlightProduct | null;
  cancellationStats: CancellationStats;
  averageOrderValue: number;
  abandonedCartValue: AbandonedCartValue;
  inactiveCustomers: InactiveCustomer[];
}

export const getDashboardInsights = async (startDate?: string, endDate?: string): Promise<DashboardHighlights> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.INSIGHTS(startDate, endDate));
  return response.data;
};

const hasEventTrendShape = (value: any): boolean => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    value?.requestedMonth != null ||
    value?.RequestedMonth != null ||
    value?.dataYear != null ||
    value?.DataYear != null ||
    Array.isArray(value?.topCategories) ||
    Array.isArray(value?.TopCategories) ||
    Array.isArray(value?.topProducts) ||
    Array.isArray(value?.TopProducts)
  );
};

const unwrapEventTrendPayload = (raw: any): any => {
  let current = raw ?? {};
  const visited = new Set<any>();

  while (current && typeof current === "object" && !visited.has(current)) {
    if (hasEventTrendShape(current)) {
      return current;
    }

    visited.add(current);

    const nestedCandidate = [
      current?.data,
      current?.Data,
      current?.result,
      current?.Result,
      current?.payload,
      current?.Payload,
    ].find((candidate) => candidate && typeof candidate === "object");

    if (!nestedCandidate) {
      break;
    }

    current = nestedCandidate;
  }

  return current ?? {};
};

const normalizeEventTrendResponse = (
  raw: any,
  requestedMonth: number,
): EventTrendResponse => {
  const payload = unwrapEventTrendPayload(raw);

  const topCategoriesSource = Array.isArray(payload?.topCategories)
    ? payload.topCategories
    : Array.isArray(payload?.TopCategories)
      ? payload.TopCategories
      : [];

  const topProductsSource = Array.isArray(payload?.topProducts)
    ? payload.topProducts
    : Array.isArray(payload?.TopProducts)
      ? payload.TopProducts
      : [];

  return {
    requestedMonth:
      toNumber(payload?.requestedMonth ?? payload?.RequestedMonth) || requestedMonth,
    dataYear: toNumber(payload?.dataYear ?? payload?.DataYear),
    topCategories: topCategoriesSource.map((item: any) => ({
      categoryId: toNumber(item?.categoryId ?? item?.CategoryId),
      categoryName: String(item?.categoryName ?? item?.CategoryName ?? "").trim(),
      totalSold: toNumber(item?.totalSold ?? item?.TotalSold),
      percentage: toNumber(item?.percentage ?? item?.Percentage),
    })),
    topProducts: topProductsSource.map((item: any) => ({
      productId: toNumber(item?.productId ?? item?.ProductId),
      productName: String(item?.productName ?? item?.ProductName ?? "").trim(),
      imageUrl: typeof (item?.imageUrl ?? item?.ImageUrl) === "string"
        ? String(item?.imageUrl ?? item?.ImageUrl).trim()
        : null,
      totalSold: toNumber(item?.totalSold ?? item?.TotalSold),
    })),
  };
};

export const getEventTrend = async (
  month: number,
): Promise<EventTrendResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.STATISTICS.EVENT_TREND(month));
  return normalizeEventTrendResponse(response, month);
};

export const getProductAssociations = async (
  productId: number,
  top: number = 10,
  minSupport: number = 1,
): Promise<ProductAssociationItem[]> => {
  const response = await axiosClient.get(
    API_ENDPOINTS.ASSOCIATIONS.PRODUCT_ASSOCIATIONS(productId, top, minSupport),
  );
  const payload: any = response;

  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.Data)
        ? payload.Data
        : Array.isArray(payload?.result)
          ? payload.result
          : Array.isArray(payload?.Result)
            ? payload.Result
            : [];

  return source.map((item: any) => ({
    productId: toNumber(item?.productId ?? item?.ProductId),
    productName: String(item?.productName ?? item?.ProductName ?? "").trim(),
    coPurchaseCount: toNumber(item?.coPurchaseCount ?? item?.CoPurchaseCount),
    supportPercentage: toNumber(
      item?.supportPercentage ?? item?.SupportPercentage,
    ),
  }));
};

const adminDashboardService = {
  getDashboardSummary,
  getRevenue,
  getActualRevenue,
  getMonthlyOrderRevenueComparison,
  getMonthlyActualRevenueComparison,
  getYearlyOrderRevenueComparison,
  getYearlyActualRevenueComparison,
  getCategoryPerformance,
  getCategoryProductsPerformance,
  getAccountStatistics,
  getPaymentChannelStatistics,
  getAbandonedCarts,
  getCustomerOrderStatistics,
  getDashboardInsights,
  getEventTrend,
  getProductAssociations,
};

export default adminDashboardService;
