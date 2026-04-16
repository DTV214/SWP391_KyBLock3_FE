import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";

export interface DashboardSummary {
  revenue: {
    period: string;
    data: Array<{
      date: string;
      revenue: number;
      orderCount: number;
    }>;
    totalRevenue: number;
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
  topProducts?: Array<{
    name: string;
    sold: number;
    revenue: number;
    image: string;
  }>;
}

export const getDashboardSummary = async (period: string = "month", startDate?: string, endDate?: string): Promise<DashboardSummary> => {
  const response: any = await axiosClient.get(API_ENDPOINTS.DASHBOARD.SUMMARY(period, startDate, endDate));
  const data: DashboardSummary = (response?.data || response) as DashboardSummary;

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

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

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
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.CUSTOMER_STATISTICS(startDate, endDate));
  return response.data;
};

const adminDashboardService = {
  getDashboardSummary,
  getRevenue,
  getActualRevenue,
  getMonthlyOrderRevenueComparison,
  getMonthlyActualRevenueComparison,
  getYearlyOrderRevenueComparison,
  getYearlyActualRevenueComparison,
  getAccountStatistics,
  getPaymentChannelStatistics,
  getAbandonedCarts,
  getCustomerOrderStatistics,
};

export default adminDashboardService;
