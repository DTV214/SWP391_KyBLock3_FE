import React, { useEffect, useState } from "react";
import { Crown, ShoppingCart, Target, AlertTriangle, TrendingDown, DollarSign, Calendar, AlertCircle } from "lucide-react";
import adminDashboardService from "../../services/adminDashboardService";
import type { DashboardHighlights } from "../../services/adminDashboardService";
import { HighlightCard } from "./HighlightCard";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

type FilterType = "all" | "day" | "week" | "month" | "custom";

const FILTER_LABELS: Record<FilterType, string> = {
  all: "Tất cả",
  day: "Hôm nay",
  week: "Tuần này",
  month: "Tháng này",
  custom: "Tùy chọn",
};

const getDateRange = (filter: FilterType, customStart: string, customEnd: string): { start?: string; end?: string } => {
  const now = new Date();
  if (filter === "day") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (filter === "week") {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now); start.setDate(now.getDate() + diff); start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: new Date().toISOString() };
  }
  if (filter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (filter === "custom") {
    return {
      start: customStart ? new Date(customStart).toISOString() : undefined,
      end: customEnd ? new Date(customEnd + "T23:59:59").toISOString() : undefined,
    };
  }
  return {};
};

export const DashboardInsightsContainer: React.FC = () => {
  const [data, setData] = useState<DashboardHighlights | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    const { start, end } = getDateRange(filterType, customStart, customEnd);
    // Don't fetch if custom filter is selected but dates are empty
    if (filterType === "custom" && !customStart && !customEnd) return;

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminDashboardService.getDashboardInsights(start, end);
        setData(res);
      } catch (err) {
        console.error("Error fetching dashboard insights:", err);
        setError("Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [filterType, customStart, customEnd]);

  return (
    <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h2 className="text-lg font-serif font-bold text-tet-primary flex items-center gap-2">
          <Target className="text-tet-accent" size={20} />
          Phân tích chuyên sâu (PO Insights)
        </h2>

        {/* Quick Date Filter */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 rounded-xl self-start sm:self-auto">
          {(["all", "day", "week", "month", "custom"] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex-shrink-0 ${
                filterType === t
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
              }`}
            >
              {FILTER_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Inputs */}
      {filterType === "custom" && (
        <div className="flex flex-wrap items-center gap-3 bg-tet-secondary/10 px-4 py-3 rounded-xl border border-tet-accent/20 mb-5">
          <div className="flex items-center gap-2 text-tet-primary font-medium">
            <Calendar size={16} className="text-tet-accent" />
            <span className="text-sm">Chọn thời gian:</span>
          </div>
          <div className="flex items-center gap-2 text-sm flex-1">
            <input
              type="date"
              className="border rounded-lg px-3 py-1.5 outline-none text-gray-700 focus:border-tet-accent transition-colors text-sm"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span className="text-gray-400 font-medium">→</span>
            <input
              type="date"
              className="border rounded-lg px-3 py-1.5 outline-none text-gray-700 focus:border-tet-accent transition-colors text-sm"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 bg-red-50 rounded-2xl border border-red-100">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-red-600 font-semibold text-sm">{error}</p>
          <button
            onClick={() => setFilterType(filterType)} // re-trigger effect
            className="text-xs text-red-500 underline hover:text-red-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.topSpender && (
            <HighlightCard
              title="Khách V.I.P (Chi nhiều nhất)"
              value={formatCurrency(data.topSpender.totalValue)}
              subtitle={`${data.topSpender.fullName} (${data.topSpender.orderCount} đơn)`}
              icon={Crown}
              colorScheme="yellow"
            />
          )}

          {data.mostFrequentBuyer && (
            <HighlightCard
              title="Khách chăm mua nhất"
              value={`${data.mostFrequentBuyer.orderCount} đơn`}
              subtitle={data.mostFrequentBuyer.fullName}
              icon={ShoppingCart}
              colorScheme="blue"
            />
          )}

          {data.topSellingProduct && (
            <HighlightCard
              title="Sản phẩm đắt hàng nhất"
              value={data.topSellingProduct.productName}
              subtitle={`Bán được: ${data.topSellingProduct.totalQuantity} — Thu: ${formatCurrency(data.topSellingProduct.totalRevenue)}`}
              icon={Target}
              colorScheme="green"
            />
          )}

          <HighlightCard
            title="Tỷ lệ hủy đơn"
            value={`${data.cancellationStats.cancellationRate}%`}
            subtitle={`Hủy: ${data.cancellationStats.cancelledOrders} / Chốt: ${data.cancellationStats.validOrders}`}
            icon={AlertTriangle}
            colorScheme="red"
          />

          <HighlightCard
            title="Giá trị trung bình / Đơn (AOV)"
            value={formatCurrency(data.averageOrderValue)}
            subtitle="Doanh thu / Tổng đơn thành công"
            icon={DollarSign}
            colorScheme="indigo"
          />

          {data.underperformingProduct && (
            <HighlightCard
              title="Sản phẩm bán ế (Cần xả)"
              value={data.underperformingProduct.productName}
              subtitle={`Chỉ bán được: ${data.underperformingProduct.totalQuantity} trong kỳ`}
              icon={TrendingDown}
              colorScheme="red"
            />
          )}

          <HighlightCard
            title="Thất thoát Giỏ hàng"
            value={formatCurrency(data.abandonedCartValue.totalLostValue)}
            subtitle={`${data.abandonedCartValue.cartCount} giỏ hàng bị bỏ`}
            icon={ShoppingCart}
            colorScheme="yellow"
          />
        </div>
      )}
    </section>
  );
};
