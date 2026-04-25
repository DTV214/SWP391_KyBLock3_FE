import React, { useEffect, useState } from "react";
import { Crown, ShoppingCart, Target, AlertTriangle, TrendingDown, DollarSign, Calendar, AlertCircle, UserX } from "lucide-react";
import adminDashboardService from "../../services/adminDashboardService";
import type { DashboardHighlights, CustomerOrderStatistics } from "../../services/adminDashboardService";
import { HighlightCard } from "./HighlightCard";
import { DashboardDetailModal, type DetailType } from "./DashboardDetailModal";

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

  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailType, setSelectedDetailType] = useState<DetailType>("VIP");
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Don't fetch if custom filter is selected but dates are empty
    if (filterType === "custom" && !customStart && !customEnd) return;

    fetchInsights();
  }, [filterType, customStart, customEnd]);

  const fetchInsights = async () => {
    const { start, end } = getDateRange(filterType, customStart, customEnd);
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

  const handleCardClick = async (type: DetailType, title: string) => {
    const { start, end } = getDateRange(filterType, customStart, customEnd);
    setSelectedDetailType(type);
    setModalTitle(title);
    setIsDetailModalOpen(true);
    setModalLoading(true);

    try {
      if (["VIP", "FREQUENT", "CANCELER"].includes(type)) {
        const stats = await adminDashboardService.getCustomerOrderStatistics(start, end);
        let sorted: CustomerOrderStatistics[] = [];
        if (type === "VIP") sorted = [...stats].sort((a, b) => b.totalSpentAllTime - a.totalSpentAllTime);
        else if (type === "FREQUENT") sorted = [...stats].sort((a, b) => b.totalOrders - a.totalOrders);
        else if (type === "CANCELER") sorted = [...stats].sort((a, b) => b.cancelledOrders - a.cancelledOrders);
        setModalData(sorted.slice(0, 10));
      } else if (type === "BEST_SELLER") {
        const summary = await adminDashboardService.getDashboardSummary("all", start, end);
        setModalData(summary.topProducts || []);
      } else if (type === "ABANDONED") {
        const summary = await adminDashboardService.getDashboardSummary("all", start, end);
        setModalData(summary.abandonedCarts?.carts || []);
      } else if (type === "WORST_SELLER") {
        // Mocking or needing specific endpoint. For now focus on Best Sellers.
        setModalData([]);
      }
    } catch (err) {
      console.error("Error fetching modal data:", err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm xl:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h2 className="text-lg font-serif font-bold text-tet-primary flex items-center gap-2">
          <Target className="text-tet-accent" size={20} />
          Phân tích Chuyên sâu · Business Insights
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`insight-skeleton-${i}`} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
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
        <div className="space-y-4">
          {/* Row 1 — Hiệu suất kinh doanh */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.topSpender && (
              <HighlightCard
                title="🏆 Top Chi tiêu — V.I.P"
                value={formatCurrency(data.topSpender.totalValue)}
                subtitle={`${data.topSpender.fullName} (${data.topSpender.orderCount} đơn)`}
                icon={Crown}
                colorScheme="yellow"
                onClick={() => handleCardClick("VIP", "Top 10 Khách hàng V.I.P — Chi tiêu cao nhất")}
              />
            )}

            {data.mostFrequentBuyer && (
              <HighlightCard
                title="🔄 Tần suất mua hàng cao nhất"
                value={`${data.mostFrequentBuyer.orderCount} đơn`}
                subtitle={data.mostFrequentBuyer.fullName}
                icon={ShoppingCart}
                colorScheme="blue"
                onClick={() => handleCardClick("FREQUENT", "Top 10 Khách hàng — Mua hàng thường xuyên nhất")}
              />
            )}

            {data.topSellingProduct && (
              <HighlightCard
                title="📦 Sản phẩm bán chạy #1"
                value={data.topSellingProduct.productName}
                subtitle={`Bán được: ${data.topSellingProduct.totalQuantity} — Thu: ${formatCurrency(data.topSellingProduct.totalRevenue)}`}
                icon={Target}
                colorScheme="green"
                onClick={() => handleCardClick("BEST_SELLER", "Top 10 Sản phẩm — Doanh số cao nhất")}
              />
            )}
            {data.topCanceler && (
              <HighlightCard
                title="🚫 Khách hàng hay hủy đơn"
                value={`${data.topCanceler.totalValue} đơn hủy`}
                subtitle={`${data.topCanceler.fullName}`}
                icon={UserX}
                colorScheme="red"
                onClick={() => handleCardClick("CANCELER", "Top 10 Khách hàng — Hủy đơn nhiều nhất")}
              />
            )}
            
          </div>

          
        </div>
      )}

      <DashboardDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        type={selectedDetailType}
        title={modalTitle}
        data={modalData}
        loading={modalLoading}
      />
    </section>
  );
};
