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
    carts: Array<any>;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
  };
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Array<{
    id: string;
    customer: string;
    total: number;
    status: string;
    statusColor: string;
    date: string;
  }>;
  topProducts: Array<{
    name: string;
    sold: number;
    revenue: number;
    image: string;
  }>;
}

export const getDashboardSummary = async (period: string = "month"): Promise<DashboardSummary> => {
  const response: any = await axiosClient.get(API_ENDPOINTS.DASHBOARD.SUMMARY(period));
  const data = response.data || response;

  // Fallback if backend does not yet return these fields in production
  if (data.totalProducts === undefined || data.totalProducts === null || data.totalProducts === 0) {
    try {
      const prodRes: any = await axiosClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}?pageNumber=1&pageSize=1`);
      data.totalProducts = prodRes?.data?.totalItems || prodRes?.totalItems || 0;
    } catch {
      data.totalProducts = 0;
    }
  }

  if (data.totalCustomers === undefined || data.totalCustomers === null || data.totalCustomers === 0) {
    try {
      // @ts-ignore - resolve endpoint dynamically
      const adminAccEndpoint = (API_ENDPOINTS as any).ADMIN_ACCOUNTS?.LIST || API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '/admin/accounts');
      const accRes: any = await axiosClient.get(adminAccEndpoint);
      // Depending on interceptor and wrapper
      const accounts = accRes?.data?.data || accRes?.data || accRes || [];
      if (Array.isArray(accounts)) {
        const customersOnly = accounts.filter((a: any) => a.role === "CUSTOMER");
        data.totalCustomers = customersOnly.length;
      } else {
        data.totalCustomers = 0;
      }
    } catch {
      data.totalCustomers = 0;
    }
  }

  return data;
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
};

export default adminDashboardService;
