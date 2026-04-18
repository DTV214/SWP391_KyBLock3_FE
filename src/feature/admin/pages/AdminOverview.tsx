import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RevenueChart from "../components/RevenueChart";
import CustomerEfficiencyWidget from "../components/CustomerEfficiencyWidget";
import { DashboardInsightsContainer } from "../components/insights/DashboardInsightsContainer";
import MonthlyComparisonChart from "../components/MonthlyComparisonChart";
import YearlyComparisonBarChart from "../components/YearlyComparisonBarChart";
import CategoryPerformanceCharts from "../components/CategoryPerformanceCharts";
import TopTrendingProducts from "../components/TopTrendingProducts";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Wallet,
  ArrowUp,
  ArrowDown,
  Gift,
  Tag,
  Settings,
  Loader2,
} from "lucide-react";
import adminDashboardService, { type DashboardSummary } from "../services/adminDashboardService";

export default function AdminOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [actualRevenueTotal, setActualRevenueTotal] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryResult, actualRevenueResult] = await Promise.allSettled([
          adminDashboardService.getDashboardSummary(),
          adminDashboardService.getActualRevenue(),
        ]);

        if (summaryResult.status !== "fulfilled") {
          throw summaryResult.reason;
        }

        if (actualRevenueResult.status === "fulfilled") {
          setActualRevenueTotal(actualRevenueResult.value.totalRevenue);
        } else {
          setActualRevenueTotal(null);
        }

        setData(summaryResult.value);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-tet-accent" size={48} />
        <p className="text-gray-500 animate-pulse">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center">
        <h2 className="text-xl font-bold text-red-700 mb-2">Đã có lỗi xảy ra</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const stats = [
    {
      label: "Tổng doanh thu",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(data.revenue?.totalRevenue ?? 0),
      change: "+0%",
      trend: "up",
      icon: <DollarSign size={24} />,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Tổng doanh thu thực nhận",
      value: actualRevenueTotal == null
        ? "Chưa có dữ liệu"
        : new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(actualRevenueTotal),
      change: "+0%",
      trend: "up",
      icon: <Wallet size={24} />,
      color: "from-teal-500 to-cyan-600",
    },
    {
      label: "Đơn hàng",
      value: (data.orders?.total ?? 0).toString(),
      change: "+0%",
      trend: "up",
      icon: <ShoppingCart size={24} />,
      color: "from-blue-500 to-cyan-600",
    },
    {
      label: "Sản phẩm",
      value: (data.totalProducts ?? 0).toString(),
      change: "+0%",
      trend: "up",
      icon: <Package size={24} />,
      color: "from-purple-500 to-pink-600",
    },
    {
      label: "Khách hàng mới",
      value: (data.newAccounts?.totalCount ?? 0).toString(),
      change: "+0%",
      trend: "up",
      icon: <Users size={24} />,
      color: "from-orange-500 to-red-600",
    },
  ];

  const quickActions = [
    { label: "Thêm sản phẩm", icon: <Package size={20} />, path: "/admin/products" },
    { label: "Tạo giỏ mẫu", icon: <Gift size={20} />, path: "/admin/templates" },
    { label: "Thêm danh mục", icon: <Tag size={20} />, path: "/admin/categories" },
    { label: "Tạo cấu hình", icon: <Settings size={20} />, path: "/admin/configs" },
  ];


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-tet-primary to-tet-accent p-8 rounded-3xl shadow-lg text-white">
        <h1 className="text-3xl font-serif font-bold mb-2">
          Chào mừng trở lại, Admin! 👋
        </h1>
        <p className="text-white/90 text-sm">
          Tổng quan hoạt động kinh doanh hôm nay
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}
              >
                {stat.icon}
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                  stat.trend === "up"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUp size={12} />
                ) : (
                  <ArrowDown size={12} />
                )}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-tet-primary mb-1">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-serif font-bold text-tet-primary mb-4">
          Thao tác nhanh
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-tet-accent hover:bg-tet-secondary/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-tet-secondary flex items-center justify-center text-tet-accent group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <span className="text-xs font-bold text-tet-primary">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* PO Insights Banner */}
      <DashboardInsightsContainer />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="lg:col-span-1">
          <CustomerEfficiencyWidget />
        </div>
      </div>

      <MonthlyComparisonChart />
      <YearlyComparisonBarChart />
      <TopTrendingProducts />
      <CategoryPerformanceCharts />

      {/* System Status */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-3xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-tet-primary mb-2">
              Trạng thái hệ thống
            </h3>
            <p className="text-sm text-gray-600">
              Tất cả dịch vụ đang hoạt động bình thường
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
