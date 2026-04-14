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
  return response.data || response;
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

export const getRevenue = async (period: string = "day", startDate?: string, endDate?: string): Promise<RevenueChartResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.REVENUE(period, startDate, endDate));
  return response.data;
};

const adminDashboardService = {
  getDashboardSummary,
  getRevenue,
  getAccountStatistics,
  getPaymentChannelStatistics,
  getAbandonedCarts,
};

export default adminDashboardService;
