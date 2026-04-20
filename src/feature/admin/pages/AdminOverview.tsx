import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  X,
} from "lucide-react";
import adminDashboardService, { type DashboardSummary } from "../services/adminDashboardService";

export default function AdminOverview() {
  const navigate = useNavigate();
  const revenueChartSectionRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [actualRevenueTotal, setActualRevenueTotal] = useState<number | null>(null);
  const [isNewCustomersModalOpen, setIsNewCustomersModalOpen] = useState(false);
  const [newCustomersPeriod, setNewCustomersPeriod] = useState<"day" | "month" | "year">("day");
  const [newCustomersStartDate, setNewCustomersStartDate] = useState("");
  const [newCustomersEndDate, setNewCustomersEndDate] = useState("");
  const [newCustomersLoading, setNewCustomersLoading] = useState(false);
  const [newCustomersError, setNewCustomersError] = useState<string | null>(null);
  const [newCustomersSummary, setNewCustomersSummary] = useState<DashboardSummary["newAccounts"] | null>(null);

  const handleScrollToRevenueChart = () => {
    revenueChartSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

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

  useEffect(() => {
    if (data?.newAccounts) {
      setNewCustomersSummary(data.newAccounts);
      const period = data.newAccounts.period === "month" || data.newAccounts.period === "year"
        ? data.newAccounts.period
        : "day";
      setNewCustomersPeriod(period);
    }
  }, [data?.newAccounts]);

  const handleApplyNewCustomersFilter = async () => {
    try {
      if (newCustomersStartDate && newCustomersEndDate && newCustomersStartDate > newCustomersEndDate) {
        setNewCustomersError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
        return;
      }

      setNewCustomersLoading(true);
      setNewCustomersError(null);

      const summary = await adminDashboardService.getDashboardSummary(
        newCustomersPeriod,
        newCustomersStartDate || undefined,
        newCustomersEndDate || undefined,
      );

      setNewCustomersSummary(summary.newAccounts ?? {
        period: newCustomersPeriod,
        data: [],
        totalCount: 0,
      });
    } catch (err) {
      console.error("Failed to load new customers data:", err);
      setNewCustomersError("Không thể tải dữ liệu khách hàng mới theo bộ lọc đã chọn.");
    } finally {
      setNewCustomersLoading(false);
    }
  };

  const newCustomersChartData = useMemo(() => {
    if (!newCustomersSummary?.data) {
      return [];
    }

    return newCustomersSummary.data.map((item) => {
      const parsedDate = new Date(item.date);
      const label = Number.isNaN(parsedDate.getTime())
        ? item.date
        : parsedDate.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          });

      return {
        date: item.date,
        label,
        count: item.count,
      };
    });
  }, [newCustomersSummary?.data]);

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
      }).format(data.revenue?.totalRevenueBeforeDiscount ?? 0),
      change: "+0%",
      trend: "up",
      icon: <DollarSign size={24} />,
      color: "from-amber-500 to-orange-600",
      valueClassName: "text-[clamp(1.05rem,1.6vw,1.7rem)] leading-tight break-words",
      onClick: handleScrollToRevenueChart,
    },
    {
      label: "Tổng doanh thu thực nhận",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(data.revenue?.totalRevenue ?? 0),
      change: "+0%",
      trend: "up",
      icon: <DollarSign size={24} />,
      color: "from-green-500 to-emerald-600",
      valueClassName: "text-[clamp(1.05rem,1.6vw,1.7rem)] leading-tight break-words",
      onClick: handleScrollToRevenueChart,
    },
    {
      label: "Tổng Lợi nhuận",
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
      valueClassName: "text-[clamp(1.05rem,1.6vw,1.7rem)] leading-tight break-words",
      onClick: handleScrollToRevenueChart,
    },
    {
      label: "Đơn hàng",
      value: (data.orders?.total ?? 0).toString(),
      change: "+0%",
      trend: "up",
      icon: <ShoppingCart size={24} />,
      color: "from-blue-500 to-cyan-600",
      valueClassName: "text-[clamp(1.35rem,1.9vw,1.9rem)] leading-tight",
      onClick: () => navigate("/admin/orders"),
    },
    {
      label: "Sản phẩm",
      value: (data.totalProducts ?? 0).toString(),
      change: "+0%",
      trend: "up",
      icon: <Package size={24} />,
      color: "from-purple-500 to-pink-600",
      valueClassName: "text-[clamp(1.35rem,1.9vw,1.9rem)] leading-tight",
      onClick: () => navigate("/admin/products"),
    },
    {
      label: "Khách hàng mới",
      value: (data.newAccounts?.totalCount ?? 0).toString(),
      change: "+0%",
      trend: "up",
      icon: <Users size={24} />,
      color: "from-orange-500 to-red-600",
      onClick: () => setIsNewCustomersModalOpen(true),
    },
  ];

  const revenueStats = stats.slice(0, 3);
  const businessStats = stats.slice(3);

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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenueStats.map((stat, index) => (
            <button
              type="button"
              key={`revenue-${index}`}
              onClick={stat.onClick}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all min-w-0 text-left w-full cursor-pointer"
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
              <div className="mb-1 overflow-x-auto">
                <p className="text-lg xl:text-xl 2xl:text-2xl font-bold text-tet-primary whitespace-nowrap leading-tight min-w-max">
                  {stat.value}
                </p>
              </div>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {businessStats.map((stat, index) => (
            <button
              type="button"
              key={`business-${index}`}
              onClick={stat.onClick}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all min-w-0 text-left w-full cursor-pointer"
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
              <div className="mb-1 overflow-x-auto">
                <p className="text-lg xl:text-xl 2xl:text-2xl font-bold text-tet-primary whitespace-nowrap leading-tight min-w-max">
                  {stat.value}
                </p>
              </div>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </button>
          ))}
        </div>
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

      <div ref={revenueChartSectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {isNewCustomersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng popup"
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsNewCustomersModalOpen(false)}
          />

          <section className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-tet-primary">
                  Biểu đồ khách hàng mới
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Tổng khách mới: {newCustomersSummary?.totalCount ?? 0} khách | Kỳ: {newCustomersSummary?.period ?? newCustomersPeriod}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewCustomersModalOpen(false)}
                className="h-10 w-10 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Kỳ
                <select
                  value={newCustomersPeriod}
                  onChange={(e) => setNewCustomersPeriod(e.target.value as "day" | "month" | "year")}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                >
                  <option value="day">Theo ngày</option>
                  <option value="month">Theo tháng</option>
                  <option value="year">Theo năm</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Từ ngày
                <input
                  type="date"
                  value={newCustomersStartDate}
                  onChange={(e) => setNewCustomersStartDate(e.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Đến ngày
                <input
                  type="date"
                  value={newCustomersEndDate}
                  onChange={(e) => setNewCustomersEndDate(e.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>

              <button
                type="button"
                onClick={handleApplyNewCustomersFilter}
                disabled={newCustomersLoading}
                className="h-10 mt-[22px] rounded-xl bg-tet-primary text-white text-sm font-bold hover:opacity-95 disabled:opacity-60"
              >
                {newCustomersLoading ? "Đang tải..." : "Áp dụng"}
              </button>
            </div>

            {newCustomersError && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                {newCustomersError}
              </div>
            )}

            <div className="h-[360px]">
              {newCustomersLoading ? (
                <div className="h-full flex items-center justify-center rounded-2xl bg-gray-50 text-gray-500 text-sm gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Đang tải dữ liệu khách hàng mới...
                </div>
              ) : newCustomersChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={newCustomersChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="newCustomersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value} khách`, "Khách mới"]}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#F97316"
                      strokeWidth={3}
                      fill="url(#newCustomersGradient)"
                      activeDot={{ r: 5, fill: "#F97316" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center rounded-2xl bg-gray-50 text-gray-500 text-sm">
                  Chưa có dữ liệu khách hàng mới trong khoảng thời gian này.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
