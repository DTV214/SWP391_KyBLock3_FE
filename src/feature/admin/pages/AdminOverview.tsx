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
import {
  DollarSign,
  Gift,
  Loader2,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import RevenueChart from "../components/RevenueChart";
import CustomerEfficiencyWidget from "../components/CustomerEfficiencyWidget";
import VatSegmentChart from "../components/VatSegmentChart";
import ProductAssociationsWidget from "../components/ProductAssociationsWidget";
import { DashboardInsightsContainer } from "../components/insights/DashboardInsightsContainer";
import MonthlyComparisonChart from "../components/MonthlyComparisonChart";
import CategoryPerformanceCharts from "../components/CategoryPerformanceCharts";
import TopTrendingProducts from "../components/TopTrendingProducts";
import { CustomerCareInsights } from "../components/insights/CustomerCareInsights";
import TopProductFinancials from "../components/TopProductFinancials";
import { orderService, type OrderResponse } from "@/feature/checkout/services/orderService";
import adminDashboardService, {
  type DashboardSummary,
  type DashboardHighlights,
} from "../services/adminDashboardService";

export default function AdminOverview() {
  const navigate = useNavigate();
  const revenueChartSectionRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [actualRevenueTotal, setActualRevenueTotal] = useState<number | null>(
    null,
  );
  const [insightsData, setInsightsData] = useState<DashboardHighlights | null>(
    null,
  );
  const [isNewCustomersModalOpen, setIsNewCustomersModalOpen] = useState(false);
  const [newCustomersPeriod, setNewCustomersPeriod] = useState<
    "day" | "month" | "year"
  >("day");
  const [newCustomersStartDate, setNewCustomersStartDate] = useState("");
  const [newCustomersEndDate, setNewCustomersEndDate] = useState("");
  const [newCustomersLoading, setNewCustomersLoading] = useState(false);
  const [newCustomersError, setNewCustomersError] = useState<string | null>(
    null,
  );
  const [newCustomersSummary, setNewCustomersSummary] = useState<
    DashboardSummary["newAccounts"] | null
  >(null);
  const [vatOrders, setVatOrders] = useState<OrderResponse[]>([]);
  const [vatLoading, setVatLoading] = useState(true);
  const [vatError, setVatError] = useState<string | null>(null);

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
        const [summaryResult, actualRevenueResult, insightsResult] = await Promise.allSettled([
          adminDashboardService.getDashboardSummary(),
          adminDashboardService.getActualRevenue(),
          adminDashboardService.getDashboardInsights(),
        ]);

        if (summaryResult.status !== "fulfilled") {
          throw summaryResult.reason;
        }

        if (actualRevenueResult.status === "fulfilled") {
          setActualRevenueTotal(actualRevenueResult.value.totalRevenue);
        } else {
          setActualRevenueTotal(null);
        }

        if (insightsResult.status === "fulfilled") {
          setInsightsData(insightsResult.value);
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

    void fetchData();
  }, []);

  useEffect(() => {
    const loadVatOrders = async () => {
      try {
        setVatLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setVatOrders([]);
          setVatError("Không tìm thấy phiên đăng nhập để tải dữ liệu VAT.");
          return;
        }

        const firstPageData = await orderService.getAllOrders(1, token);
        let allOrdersData = [...firstPageData.data];

        if (firstPageData.totalPages > 1) {
          for (let page = 2; page <= firstPageData.totalPages; page++) {
            const pageData = await orderService.getAllOrders(page, token);
            allOrdersData = [...allOrdersData, ...pageData.data];
          }
        }

        setVatOrders(allOrdersData);
        setVatError(null);
      } catch (err) {
        console.error("Failed to load VAT chart data:", err);
        setVatOrders([]);
        setVatError("Không thể tải dữ liệu biểu đồ VAT.");
      } finally {
        setVatLoading(false);
      }
    };

    void loadVatOrders();
  }, []);

  useEffect(() => {
    if (data?.newAccounts) {
      setNewCustomersSummary(data.newAccounts);
      const period =
        data.newAccounts.period === "month" || data.newAccounts.period === "year"
          ? data.newAccounts.period
          : "day";
      setNewCustomersPeriod(period);
    }
  }, [data?.newAccounts]);

  const handleApplyNewCustomersFilter = async () => {
    try {
      if (
        newCustomersStartDate &&
        newCustomersEndDate &&
        newCustomersStartDate > newCustomersEndDate
      ) {
        setNewCustomersError(
          "Ngày bắt đầu không được lớn hơn ngày kết thúc.",
        );
        return;
      }

      setNewCustomersLoading(true);
      setNewCustomersError(null);

      const summary = await adminDashboardService.getDashboardSummary(
        newCustomersPeriod,
        newCustomersStartDate || undefined,
        newCustomersEndDate || undefined,
      );

      setNewCustomersSummary(
        summary.newAccounts ?? {
          period: newCustomersPeriod,
          data: [],
          totalCount: 0,
        },
      );
    } catch (err) {
      console.error("Failed to load new customers data:", err);
      setNewCustomersError(
        "Không thể tải dữ liệu khách hàng mới theo bộ lọc đã chọn.",
      );
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
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-tet-accent" size={48} />
        <p className="animate-pulse text-gray-500">
          Đang tải dữ liệu tổng quan...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-red-700">Đã có lỗi xảy ra</h2>
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const currencyValueClassName =
    "overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.48rem,1.95vw,2.2rem)] font-bold leading-none tracking-tight text-tet-primary";
  const numberValueClassName =
    "whitespace-nowrap text-[clamp(2rem,2.15vw,2.55rem)] font-bold leading-none tracking-tight text-tet-primary";

  const stats = [
    {
      label: "Tổng doanh thu",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(data.revenue?.totalRevenueBeforeDiscount ?? 0),
      icon: <DollarSign size={24} />,
      color: "from-amber-500 to-orange-600",
      valueClassName: currencyValueClassName,
      onClick: handleScrollToRevenueChart,
    },
    {
      label: "Tổng doanh thu thực nhận",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(data.revenue?.totalRevenue ?? 0),
      icon: <DollarSign size={24} />,
      color: "from-green-500 to-emerald-600",
      valueClassName: currencyValueClassName,
      onClick: handleScrollToRevenueChart,
    },
    {
      label: "Tổng lợi nhuận",
      value:
        actualRevenueTotal == null
          ? "Chưa có dữ liệu"
          : new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(actualRevenueTotal),
      icon: <Wallet size={24} />,
      color: "from-teal-500 to-cyan-600",
      valueClassName: currencyValueClassName,
      onClick: handleScrollToRevenueChart,
    },
    {
      label: "Đơn hàng",
      value: (data.orders?.total ?? 0).toString(),
      description: "Số đơn hàng đã đặt",
      icon: <ShoppingCart size={24} />,
      color: "from-blue-500 to-cyan-600",
      valueClassName: numberValueClassName,
      onClick: () => navigate("/admin/orders"),
    },
    {
      label: "Sản phẩm",
      value: (data.totalProducts ?? 0).toString(),
      description: "Số sản phẩm trong hệ thống",
      icon: <Package size={24} />,
      color: "from-purple-500 to-pink-600",
      valueClassName: numberValueClassName,
      onClick: () => navigate("/admin/products"),
    },
    {
      label: "Khách hàng mới",
      value: (data.newAccounts?.totalCount ?? 0).toString(),
      description: "Số khách hàng mới trong kỳ",
      icon: <Users size={24} />,
      color: "from-orange-500 to-red-600",
      valueClassName: numberValueClassName,
      onClick: () => setIsNewCustomersModalOpen(true),
    },
    {
      label: "Tỉ lệ chuyển đổi",
      value: `${data.conversionRate ?? 0}%`,
      description: `${data.accountsWithOrders ?? 0} / ${data.totalCustomerAccounts ?? 0} khách đã mua`,
      icon: <TrendingUp size={24} />,
      color: "from-violet-500 to-purple-600",
      valueClassName: numberValueClassName,
    },
  ];

  const quickActions = [
    { label: "Thêm sản phẩm", icon: <Package size={20} />, path: "/admin/products" },
    { label: "Tạo giỏ mẫu", icon: <Gift size={20} />, path: "/admin/templates" },
    { label: "Thêm danh mục", icon: <Tag size={20} />, path: "/admin/categories" },
    { label: "Tạo cấu hình", icon: <Settings size={20} />, path: "/admin/configs" },
  ];

  return (
    <div className="space-y-5 xl:space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-tet-primary via-[#8f2d1b] to-tet-accent px-6 py-7 text-white shadow-[0_24px_60px_-38px_rgba(122,22,14,0.6)] sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-48 bg-gradient-to-r from-black/10 to-transparent" />
        <div className="relative">
          <h1 className="mb-2 text-3xl font-serif font-bold lg:text-[2.25rem]">
            Chào mừng trở lại, Admin! 👋
          </h1>
          <p className="max-w-2xl text-sm text-white/90 md:text-[15px]">
            Tổng quan hoạt động kinh doanh hôm nay
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => (
          <button
            type="button"
            key={`stat-${index}`}
            onClick={stat.onClick}
            className="group relative flex min-h-[198px] w-full min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg xl:p-7"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`}
            />
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg shadow-black/5`}
              >
                {stat.icon}
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <p className={stat.valueClassName} title={String(stat.value)}>
                {stat.value}
              </p>
              <p className="text-[15px] font-semibold leading-6 text-gray-700">
                {stat.label}
              </p>
              {stat.description ? (
                <p className="min-h-[2.5rem] text-sm leading-5 text-gray-400">
                  {stat.description}
                </p>
              ) : (
                <div className="min-h-[2.5rem]" />
              )}
            </div>
          </button>
        ))}
      </div>

      <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm xl:p-6">
        <h3 className="mb-4 text-lg font-serif font-bold text-tet-primary">
          Thao tác nhanh
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="group flex min-h-[118px] flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-gray-200 bg-gradient-to-b from-white to-[#fff8eb] p-4 transition-all hover:border-tet-accent hover:bg-tet-secondary/30 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tet-secondary text-tet-accent transition-transform group-hover:scale-110">
                {action.icon}
              </div>
              <span className="text-center text-xs font-bold text-tet-primary">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div
        ref={revenueChartSectionRef}
        className="grid grid-cols-1 gap-6 scroll-mt-40 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)] 2xl:grid-cols-[minmax(0,1.72fr)_minmax(360px,0.98fr)]"
      >
        <div className="min-w-0">
          <RevenueChart />
        </div>
        <div className="min-w-0">
          <CustomerEfficiencyWidget />
        </div>
      </div>

      <DashboardInsightsContainer />

      {insightsData && (
        <CustomerCareInsights data={insightsData} />
      )}

      <MonthlyComparisonChart />
      <TopTrendingProducts />
      <TopProductFinancials initialProducts={data?.topProducts || []} />
      <CategoryPerformanceCharts />

      {vatLoading ? (
        <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex min-h-[220px] items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="animate-spin" size={18} />
            Đang tải dữ liệu VAT...
          </div>
        </section>
      ) : vatError ? (
        <section className="rounded-[2rem] border border-red-100 bg-red-50 p-6 shadow-sm">
          <p className="text-sm text-red-600">{vatError}</p>
        </section>
      ) : (
        <VatSegmentChart
          orders={vatOrders}
          subtitlePrefix="Toàn bộ đơn hàng hiện tại:"
        />
      )}

      <ProductAssociationsWidget />

      <section className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 p-5 xl:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-2 text-lg font-bold text-tet-primary">
              Trạng thái hệ thống
            </h3>
            <p className="text-sm text-gray-600">
              Tất cả dịch vụ đang hoạt động bình thường
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse" />
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

          <section className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-tet-primary">
                  Biểu đồ khách hàng mới
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tổng khách mới: {newCustomersSummary?.totalCount ?? 0} khách |
                  Kỳ: {newCustomersSummary?.period ?? newCustomersPeriod}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewCustomersModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Kỳ
                <select
                  value={newCustomersPeriod}
                  onChange={(e) =>
                    setNewCustomersPeriod(
                      e.target.value as "day" | "month" | "year",
                    )
                  }
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
                className="mt-[22px] h-10 rounded-xl bg-tet-primary text-sm font-bold text-white hover:opacity-95 disabled:opacity-60"
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
                <div className="flex h-full items-center justify-center gap-2 rounded-2xl bg-gray-50 text-sm text-gray-500">
                  <Loader2 className="animate-spin" size={18} />
                  Đang tải dữ liệu khách hàng mới...
                </div>
              ) : newCustomersChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={newCustomersChartData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="newCustomersGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
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
                <div className="flex h-full items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-500">
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
