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

export const getRevenue = async (period: string = "day", startDate?: string, endDate?: string): Promise<RevenueChartResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.REVENUE(period, startDate, endDate));
  return normalizeRevenueResponse(response);
};

export const getActualRevenue = async (period: string = "day", startDate?: string, endDate?: string): Promise<RevenueChartResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.ACTUAL_REVENUE(period, startDate, endDate));
  return normalizeRevenueResponse(response);
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
  successRate: number;
}

export const getCustomerOrderStatistics = async (): Promise<CustomerOrderStatistics[]> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.CUSTOMER_STATISTICS);
  return response.data;
};

const adminDashboardService = {
  getDashboardSummary,
  getRevenue,
  getActualRevenue,
  getAccountStatistics,
  getPaymentChannelStatistics,
  getAbandonedCarts,
  getCustomerOrderStatistics,
};

export default adminDashboardService;
