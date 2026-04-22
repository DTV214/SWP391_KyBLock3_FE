import { useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Loader2,
  Package,
  Search,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import adminDashboardService, {
  type HighlightProduct,
} from "../services/adminDashboardService";

interface TopProductFinancialsProps {
  initialProducts?: HighlightProduct[];
}

type Period = "day" | "week" | "month" | "custom";
type SortKey = keyof HighlightProduct;
type SortDirection = "asc" | "desc";

type RevenueShareRow = {
  name: string;
  revenue: number;
  share: number;
  color: string;
};

const CHART_COLORS = [
  "#4F46E5",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#0EA5E9",
  "#94A3B8",
];

export default function TopProductFinancials({
  initialProducts = [],
}: TopProductFinancialsProps) {
  const [products, setProducts] = useState<HighlightProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const startDateRef = useRef("");
  const endDateRef = useRef("");
  const isFirstMount = useRef(true);
  const isFetching = useRef(false);

  startDateRef.current = startDate;
  endDateRef.current = endDate;

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "totalRevenue",
    direction: "desc",
  });

  const formatMoney = (value: number) =>
    `${Math.trunc(Number(value) || 0).toLocaleString("vi-VN")} đ`;

  const fetchProducts = async (p: string, sDate?: string, eDate?: string) => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      setLoading(true);
      const summary = await adminDashboardService.getDashboardSummary(
        p,
        sDate,
        eDate,
      );
      setProducts(summary.topProducts || []);
    } catch (err) {
      console.error("Failed to fetch top products financials:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const handleApplyCustomFilter = () => {
    const sDate = startDateRef.current;
    const eDate = endDateRef.current;
    if (!sDate || !eDate) return;
    void fetchProducts("day", sDate, eDate);
  };

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
    }

    if (period === "custom") return;

    const today = new Date().toISOString().split("T")[0];

    if (period === "day") {
      void fetchProducts("day", today, today);
    } else if (period === "week") {
      const start = new Date(Date.now() - 6 * 86400000)
        .toISOString()
        .split("T")[0];
      void fetchProducts("day", start, today);
    } else if (period === "month") {
      const start = new Date(Date.now() - 29 * 86400000)
        .toISOString()
        .split("T")[0];
      void fetchProducts("day", start, today);
    }
  }, [period]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const sortedProducts = useMemo(() => {
    const sortableItems = [...products];

    return sortableItems.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      if (aString < bString) return sortConfig.direction === "asc" ? -1 : 1;
      if (aString > bString) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, sortConfig]);

  const revenueShareData = useMemo<RevenueShareRow[]>(() => {
    const rankedByRevenue = [...products]
      .filter((product) => product.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalRevenue = rankedByRevenue.reduce(
      (sum, product) => sum + product.totalRevenue,
      0,
    );

    if (totalRevenue <= 0) return [];

    const topFive = rankedByRevenue.slice(0, 5);
    const otherRevenue = rankedByRevenue
      .slice(5)
      .reduce((sum, product) => sum + product.totalRevenue, 0);

    const rows = topFive.map((product, index) => ({
      name: product.productName,
      revenue: product.totalRevenue,
      share: (product.totalRevenue / totalRevenue) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    if (otherRevenue > 0) {
      rows.push({
        name: "Khác",
        revenue: otherRevenue,
        share: (otherRevenue / totalRevenue) * 100,
        color: CHART_COLORS[5],
      });
    }

    return rows;
  }, [products]);

  const chartTotalRevenue = useMemo(
    () => revenueShareData.reduce((sum, item) => sum + item.revenue, 0),
    [revenueShareData],
  );

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp size={12} className="ml-1 text-indigo-600" />
    ) : (
      <ChevronDown size={12} className="ml-1 text-indigo-600" />
    );
  };

  const RevenueShareTooltip = ({ active, payload }: any) => {
    const row = payload?.[0]?.payload as RevenueShareRow | undefined;
    if (!active || !row) return null;

    return (
      <div className="min-w-[220px] rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
        <p className="text-sm font-bold text-tet-primary">{row.name}</p>
        <div className="mt-3 space-y-1.5 text-sm text-gray-600">
          <p className="flex justify-between gap-4">
            <span>Doanh thu</span>
            <span className="font-semibold text-gray-900">
              {formatMoney(row.revenue)}
            </span>
          </p>
          <p className="flex justify-between gap-4">
            <span>Tỷ trọng</span>
            <span className="font-semibold text-gray-900">
              {row.share.toFixed(1)}%
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-600 shadow-sm transition-transform hover:scale-105">
            <TrendingUp size={22} />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-tet-primary">
              Hiệu quả kinh doanh Top Sản phẩm
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Phân tích chi tiết doanh thu và lợi nhuận của các sản phẩm bán chạy
              nhất.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-end gap-4 lg:w-auto sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <Calendar size={14} className="text-gray-300" />
            <span>Khoảng thời gian:</span>
          </div>

          <div className="flex w-full flex-col items-end gap-3 sm:w-auto sm:flex-row sm:items-center">
            {period === "custom" && (
              <div className="mr-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="cursor-pointer border-none bg-transparent text-xs font-bold text-gray-600 focus:ring-0"
                />
                <span className="text-gray-300">|</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="cursor-pointer border-none bg-transparent text-xs font-bold text-gray-600 focus:ring-0"
                />
                <button
                  onClick={handleApplyCustomFilter}
                  disabled={!startDate || !endDate || loading}
                  className="ml-1 rounded-lg bg-indigo-600 p-1.5 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                  title="Áp dụng bộ lọc ngày"
                >
                  <Search size={14} />
                </button>
              </div>
            )}

            <div className="flex w-full overflow-x-auto rounded-xl bg-gray-100 p-1 sm:w-auto">
              {(["day", "week", "month", "custom"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                    period === p
                      ? "bg-white text-tet-primary shadow-sm"
                      : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
                  }`}
                >
                  {p === "day"
                    ? "Hôm nay"
                    : p === "week"
                      ? "7 Ngày"
                      : p === "month"
                        ? "30 Ngày"
                        : "Khung thời gian"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <div className="relative -mx-6 overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <span className="text-xs font-bold text-indigo-600 animate-pulse">
                  Đang cập nhật...
                </span>
              </div>
            </div>
          )}

          <div className="inline-block min-w-full align-middle px-6">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="w-16 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    STT
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-indigo-600"
                    onClick={() => handleSort("productName")}
                  >
                    <div className="flex cursor-pointer items-center">
                      Sản phẩm <SortIcon columnKey="productName" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-indigo-600"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex cursor-pointer items-center justify-end">
                      Giá bán <SortIcon columnKey="price" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-indigo-600"
                    onClick={() => handleSort("importPrice")}
                  >
                    <div className="flex cursor-pointer items-center justify-end">
                      Giá nhập <SortIcon columnKey="importPrice" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-indigo-600"
                    onClick={() => handleSort("totalRevenue")}
                  >
                    <div className="flex cursor-pointer items-center justify-end">
                      Doanh thu <SortIcon columnKey="totalRevenue" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-indigo-600"
                    onClick={() => handleSort("totalProfit")}
                  >
                    <div className="flex cursor-pointer items-center justify-end">
                      Lợi nhuận <SortIcon columnKey="totalProfit" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-indigo-600"
                    onClick={() => handleSort("totalQuantity")}
                  >
                    <div className="flex cursor-pointer items-center justify-end">
                      Đã bán <SortIcon columnKey="totalQuantity" />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 bg-white">
                {sortedProducts.length > 0 ? (
                  sortedProducts.map((product, index) => (
                    <tr
                      key={product.productId}
                      className="group transition-colors hover:bg-indigo-50/30"
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-[11px] font-black text-gray-400 transition-all group-hover:bg-indigo-100 group-hover:text-indigo-600">
                          {index + 1}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-100 shadow-sm transition-colors group-hover:border-indigo-200">
                              <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/40?text=P";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-400">
                              <Package size={18} />
                            </div>
                          )}
                          <span
                            className="max-w-[180px] truncate text-sm font-bold text-gray-700"
                            title={product.productName}
                          >
                            {product.productName}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <span className="text-sm font-bold text-tet-accent">
                          {formatMoney(product.price)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-gray-500">
                        {formatMoney(product.importPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <span className="text-sm font-black text-emerald-700">
                          {formatMoney(product.totalRevenue)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <span className="text-sm font-black text-amber-700">
                          {formatMoney(product.totalProfit)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-sm font-black text-blue-700">
                            {product.totalQuantity.toLocaleString("vi-VN")}
                          </span>
                          <ShoppingCart
                            size={14}
                            className="text-blue-300 transition-colors group-hover:text-blue-500"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Package size={40} className="animate-bounce opacity-20" />
                        <p className="text-sm font-medium">
                          Không tìm thấy dữ liệu trong khoảng thời gian này
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-bold text-tet-primary">
              Cơ cấu doanh thu Top 5
            </p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Tỷ trọng doanh thu của 5 sản phẩm dẫn đầu, phần còn lại gộp vào mục
              Khác.
            </p>
          </div>

          <div className="relative h-[300px]">
            {revenueShareData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueShareData}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={112}
                    paddingAngle={3}
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={2}
                    labelLine={false}
                    label={({ percent }) =>
                      percent && percent >= 0.06
                        ? `${(percent * 100).toFixed(1)}%`
                        : ""
                    }
                  >
                    {revenueShareData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<RevenueShareTooltip />} />
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-gray-500 text-[11px] font-semibold uppercase tracking-[0.2em]"
                  >
                    Tổng doanh thu
                  </text>
                  <text
                    x="50%"
                    y="55%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-tet-primary text-base font-black"
                  >
                    {formatMoney(chartTotalRevenue)}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-indigo-100 bg-white/80 px-4 text-center text-sm font-medium text-gray-500">
                Chưa có dữ liệu doanh thu để hiển thị biểu đồ tỷ trọng.
              </div>
            )}
          </div>

          {revenueShareData.length > 0 && (
            <div className="mt-4 space-y-2">
              {revenueShareData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {item.name}
                      </p>
                      <p className="text-xs font-medium text-gray-500">
                        {formatMoney(item.revenue)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    {item.share.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {sortedProducts.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-inner lg:grid-cols-4">
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <DollarSign size={10} /> Tổng doanh thu Top 10
            </p>
            <p className="text-lg font-black leading-none text-emerald-700">
              {formatMoney(sortedProducts.reduce((sum, p) => sum + p.totalRevenue, 0))}
            </p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <Wallet size={10} /> Tổng lợi nhuận Top 10
            </p>
            <p className="text-lg font-black leading-none text-amber-700">
              {formatMoney(sortedProducts.reduce((sum, p) => sum + p.totalProfit, 0))}
            </p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <ShoppingCart size={10} /> Tổng số lượng bán
            </p>
            <p className="text-lg font-black leading-none text-blue-700">
              {sortedProducts
                .reduce((sum, p) => sum + p.totalQuantity, 0)
                .toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <Package size={10} /> Sản phẩm tốt nhất
            </p>
            <p className="truncate pt-1 text-sm font-bold leading-none text-tet-primary">
              {sortedProducts[0]?.productName || "-"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
