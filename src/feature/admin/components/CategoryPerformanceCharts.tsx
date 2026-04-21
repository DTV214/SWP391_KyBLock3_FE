import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Loader2 } from "lucide-react";
import adminDashboardService, {
  type CategoryPerformanceResponse,
  type CategoryProductsPerformanceResponse,
  type DashboardRankingParams,
  type DashboardRankingPeriod,
} from "../services/adminDashboardService";

type MetricKey = "revenue" | "profit" | "quantitySold";

type RankingRow = {
  id: number;
  name: string;
  categoryName?: string;
  revenue: number;
  profit: number;
  quantitySold: number;
  value: number;
  share: number;
};

const METRIC_OPTIONS: Array<{
  key: MetricKey;
  label: string;
  color: string;
}> = [
  { key: "revenue", label: "Doanh thu", color: "#C8102E" },
  { key: "profit", label: "Lợi nhuận", color: "#2563EB" },
  { key: "quantitySold", label: "Số lượng", color: "#059669" },
];

const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toMonthInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getDefaultControls = () => {
  const now = new Date();
  return {
    weekDate: toDateInputValue(now),
    monthInput: toMonthInputValue(now),
    yearInput: String(now.getFullYear()),
  };
};

const parseMonthInput = (
  value: string,
): { year: number; month: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (year < 1900 || year > 3000 || month < 1 || month > 12) return null;

  return { year, month };
};

const parseYearInput = (value: string): number | null => {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 3000) return null;
  return year;
};

const parseCategoryId = (value: string): number | null => {
  const categoryId = Number(value);
  if (!Number.isInteger(categoryId) || categoryId <= 0) return null;
  return categoryId;
};

const getMetricTotal = (
  payload:
    | CategoryPerformanceResponse
    | CategoryProductsPerformanceResponse
    | null,
  metric: MetricKey,
): number => {
  if (!payload) return 0;
  if (metric === "revenue") return payload.totalRevenue;
  if (metric === "profit") return payload.totalProfit;
  return payload.totalQuantitySold;
};

const getMetricValue = (
  item: Pick<RankingRow, "revenue" | "profit" | "quantitySold">,
  metric: MetricKey,
): number => item[metric];

const formatFullNumber = (value: number): string => {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  return `${sign}${numberFormatter.format(absolute)}`;
};

const truncateLabel = (value: string, maxLength = 24): string => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
};

const buildCategoryRows = (
  payload: CategoryPerformanceResponse | null,
  metric: MetricKey,
): RankingRow[] => {
  const total = getMetricTotal(payload, metric);

  return (payload?.data ?? [])
    .map((item) => {
      const value = getMetricValue(item, metric);
      return {
        id: item.categoryId,
        name: item.categoryName || "Danh mục chưa đặt tên",
        revenue: item.revenue,
        profit: item.profit,
        quantitySold: item.quantitySold,
        value,
        share: total ? (value / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);
};

const buildProductRows = (
  payload: CategoryProductsPerformanceResponse | null,
  metric: MetricKey,
): RankingRow[] => {
  const total = getMetricTotal(payload, metric);

  return (payload?.data ?? [])
    .map((item) => {
      const value = getMetricValue(item, metric);
      return {
        id: item.productId,
        name: item.productName || "Sản phẩm chưa đặt tên",
        categoryName: item.categoryName,
        revenue: item.revenue,
        profit: item.profit,
        quantitySold: item.quantitySold,
        value,
        share: total ? (value / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);
};

function SummaryStats({
  payload,
}: {
  payload: CategoryPerformanceResponse | CategoryProductsPerformanceResponse | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-xl bg-green-50 px-4 py-3 border border-green-100">
        <p className="text-xs font-semibold text-green-700">Tổng doanh thu</p>
        <p className="text-base font-bold text-green-900 mt-1">
          {currencyFormatter.format(payload?.totalRevenue ?? 0)}
        </p>
      </div>
      <div className="rounded-xl bg-blue-50 px-4 py-3 border border-blue-100">
        <p className="text-xs font-semibold text-blue-700">Tổng lợi nhuận</p>
        <p className="text-base font-bold text-blue-900 mt-1">
          {currencyFormatter.format(payload?.totalProfit ?? 0)}
        </p>
      </div>
      <div className="rounded-xl bg-emerald-50 px-4 py-3 border border-emerald-100">
        <p className="text-xs font-semibold text-emerald-700">Tổng số lượng</p>
        <p className="text-base font-bold text-emerald-900 mt-1">
          {numberFormatter.format(payload?.totalQuantitySold ?? 0)}
        </p>
      </div>
    </div>
  );
}

function DetailsList({
  metric,
  rows,
}: {
  metric: MetricKey;
  rows: RankingRow[];
}) {
  const metricOption =
    METRIC_OPTIONS.find((option) => option.key === metric) ?? METRIC_OPTIONS[0];

  return (
    <aside className="w-full lg:w-[300px] lg:shrink-0 xl:w-[340px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-tet-primary">Chi tiết</p>
          <p className="text-xs font-medium text-gray-500">{rows.length} mục</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: metricOption.color }}
          />
          {metricOption.label}
        </div>
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-tet-primary">
                  {index + 1}. {row.name}
                </p>
                {row.categoryName && (
                  <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
                    {row.categoryName}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-600">
                {row.share.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="font-semibold text-gray-500">Doanh thu</p>
                <p className="mt-0.5 truncate font-bold text-gray-800">
                  {currencyFormatter.format(row.revenue)}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-500">Lợi nhuận</p>
                <p className="mt-0.5 truncate font-bold text-gray-800">
                  {currencyFormatter.format(row.profit)}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-500">SL</p>
                <p className="mt-0.5 truncate font-bold text-gray-800">
                  {numberFormatter.format(row.quantitySold)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function PerformanceHorizontalChart({
  emptyText,
  error,
  loading,
  metric,
  rangeLabel,
  rows,
  title,
}: {
  emptyText: string;
  error: string | null;
  loading: boolean;
  metric: MetricKey;
  rangeLabel: string;
  rows: RankingRow[];
  title: string;
}) {
  const metricOption =
    METRIC_OPTIONS.find((option) => option.key === metric) ?? METRIC_OPTIONS[0];
  const chartRows = rows.slice(0, 8);
  const chartHeight = 320;

  const CustomTooltip = ({ active, payload }: any) => {
    const row = payload?.[0]?.payload as RankingRow | undefined;
    if (!active || !row) return null;

    return (
      <div className="min-w-[240px] rounded-xl border border-gray-100 bg-white p-4 shadow-lg">
        <p className="font-bold text-tet-primary">{row.name}</p>
        <div className="mt-3 space-y-1.5 text-sm text-gray-600">
          <p className="flex justify-between gap-4">
            <span>Doanh thu</span>
            <span className="font-semibold text-gray-900">
              {currencyFormatter.format(row.revenue)}
            </span>
          </p>
          <p className="flex justify-between gap-4">
            <span>Lợi nhuận</span>
            <span className="font-semibold text-gray-900">
              {currencyFormatter.format(row.profit)}
            </span>
          </p>
          <p className="flex justify-between gap-4">
            <span>Số lượng</span>
            <span className="font-semibold text-gray-900">
              {numberFormatter.format(row.quantitySold)}
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
    <div>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-tet-primary">{title}</h4>
          <p className="text-xs font-medium text-gray-500">
            {rangeLabel || "Chưa có khoảng thời gian"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: metricOption.color }}
          />
          {metricOption.label}
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="relative min-w-0 flex-1" style={{ height: chartHeight }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
              <Loader2 className="animate-spin text-tet-accent" size={32} />
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-center text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {!error && !loading && rows.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-4 text-center text-sm font-semibold text-gray-500">
              {emptyText}
            </div>
          )}

          {!error && chartRows.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartRows}
                layout="vertical"
                margin={{ top: 8, right: 20, left: 0, bottom: 8 }}
                barCategoryGap={10}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(value: number) =>
                    metric === "quantitySold"
                      ? numberFormatter.format(value)
                      : formatFullNumber(value)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#4b5563", fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(value: string) => truncateLabel(value, 18)}
                  width={126}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill={metricOption.color}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {rows.length > 0 && <DetailsList metric={metric} rows={rows} />}
      </div>
    </div>
  );
}

export default function CategoryPerformanceCharts() {
  const defaults = useMemo(getDefaultControls, []);

  const [period, setPeriod] = useState<DashboardRankingPeriod>("month");
  const [weekDate, setWeekDate] = useState(defaults.weekDate);
  const [monthInput, setMonthInput] = useState(defaults.monthInput);
  const [yearInput, setYearInput] = useState(defaults.yearInput);
  const [metric, setMetric] = useState<MetricKey>("revenue");
  const [categoryIdInput, setCategoryIdInput] = useState("");

  const [categoryData, setCategoryData] =
    useState<CategoryPerformanceResponse | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [productData, setProductData] =
    useState<CategoryProductsPerformanceResponse | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const activeParams = useMemo<DashboardRankingParams | null>(() => {
    if (period === "week") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weekDate)) return null;
      return { period, date: weekDate };
    }

    if (period === "month") {
      const parsed = parseMonthInput(monthInput);
      if (!parsed) return null;
      return { period, year: parsed.year, month: parsed.month };
    }

    const year = parseYearInput(yearInput);
    if (!year) return null;
    return { period, year };
  }, [monthInput, period, weekDate, yearInput]);

  const filterError = useMemo(() => {
    if (activeParams) return null;
    if (period === "week") return "Nhập date theo định dạng yyyy-MM-dd cho period=week.";
    if (period === "month") return "Chọn đủ year và month cho period=month.";
    return "Nhập year hợp lệ cho period=year.";
  }, [activeParams, period]);

  const selectedCategoryId = useMemo(
    () => parseCategoryId(categoryIdInput),
    [categoryIdInput],
  );

  useEffect(() => {
    if (!activeParams) {
      setCategoryData(null);
      setCategoryError(filterError);
      setCategoryLoading(false);
      return;
    }

    let cancelled = false;

    const loadCategoryPerformance = async () => {
      try {
        setCategoryLoading(true);
        setCategoryError(null);

        const response = await adminDashboardService.getCategoryPerformance(activeParams);
        if (cancelled) return;
        setCategoryData(response);
      } catch (err) {
        console.error("Failed to load category performance:", err);
        if (cancelled) return;
        setCategoryData(null);
        setCategoryError("Không thể tải hiệu suất danh mục.");
      } finally {
        if (!cancelled) setCategoryLoading(false);
      }
    };

    void loadCategoryPerformance();

    return () => {
      cancelled = true;
    };
  }, [activeParams, filterError]);

  useEffect(() => {
    if (!categoryIdInput && categoryData?.data?.length) {
      setCategoryIdInput(String(categoryData.data[0].categoryId));
    }
  }, [categoryData, categoryIdInput]);

  useEffect(() => {
    if (!activeParams) {
      setProductData(null);
      setProductError(null);
      setProductLoading(false);
      return;
    }

    if (!selectedCategoryId) {
      setProductData(null);
      setProductError("Chọn danh mục để tải hiệu suất sản phẩm.");
      setProductLoading(false);
      return;
    }

    let cancelled = false;

    const loadProductPerformance = async () => {
      try {
        setProductLoading(true);
        setProductError(null);

        const response = await adminDashboardService.getCategoryProductsPerformance(
          selectedCategoryId,
          activeParams,
        );
        if (cancelled) return;
        setProductData(response);
      } catch (err) {
        console.error("Failed to load product performance:", err);
        if (cancelled) return;
        setProductData(null);
        setProductError("Không thể tải hiệu suất sản phẩm của danh mục.");
      } finally {
        if (!cancelled) setProductLoading(false);
      }
    };

    void loadProductPerformance();

    return () => {
      cancelled = true;
    };
  }, [activeParams, selectedCategoryId]);

  const categoryRows = useMemo(
    () => buildCategoryRows(categoryData, metric),
    [categoryData, metric],
  );

  const productRows = useMemo(
    () => buildProductRows(productData, metric),
    [productData, metric],
  );

  const selectedCategoryName =
    productData?.categoryName ||
    categoryData?.data.find((item) => item.categoryId === selectedCategoryId)
      ?.categoryName ||
    (selectedCategoryId ? "Danh mục đã chọn" : "Danh mục");

  const categoryOptions = categoryData?.data ?? [];
  const rangeLabel =
    categoryData?.range.label || productData?.range.label || activeParams?.period || "";

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-tet-accent" size={24} />
            <div>
              <h3 className="text-lg font-serif font-bold text-tet-primary">
                Hiệu suất danh mục
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {categoryData?.range.label || "dashboard-rankings/category-performance"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {(["week", "month", "year"] as DashboardRankingPeriod[]).map(
                  (option) => (
                    <button
                      key={option}
                      onClick={() => setPeriod(option)}
                      className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                        period === option
                          ? "bg-white text-tet-primary shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {option === "week"
                        ? "Tuần"
                        : option === "month"
                          ? "Tháng"
                          : "Năm"}
                    </button>
                  ),
                )}
              </div>

              {period === "week" && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-600">date</span>
                  <input
                    type="date"
                    value={weekDate}
                    onChange={(event) => setWeekDate(event.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tet-accent outline-none"
                  />
                </label>
              )}

              {period === "month" && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-600">year / month</span>
                  <input
                    type="month"
                    value={monthInput}
                    onChange={(event) => setMonthInput(event.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tet-accent outline-none"
                  />
                </label>
              )}

              {period === "year" && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-600">year</span>
                  <input
                    type="number"
                    min={1900}
                    max={3000}
                    step={1}
                    value={yearInput}
                    onChange={(event) => setYearInput(event.target.value)}
                    className="w-[120px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tet-accent outline-none"
                  />
                </label>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {METRIC_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setMetric(option.key)}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                    metric === option.key
                      ? "bg-tet-primary text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SummaryStats payload={categoryData} />

        <div className="mt-6">
          <PerformanceHorizontalChart
            emptyText="Chưa có dữ liệu danh mục trong khoảng thời gian này."
            error={categoryError}
            loading={categoryLoading}
            metric={metric}
            rangeLabel={categoryData?.range.label ?? ""}
            rows={categoryRows}
            title="So sánh theo category"
          />
        </div>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-tet-accent" size={24} />
            <div>
              <h3 className="text-lg font-serif font-bold text-tet-primary">
                Hiệu suất sản phẩm theo danh mục
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedCategoryName} · {rangeLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-600">Chọn category</span>
              <select
                value={categoryIdInput}
                onChange={(event) => setCategoryIdInput(event.target.value)}
                className="min-w-[220px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tet-accent outline-none"
              >
                <option value="">Chọn danh mục</option>
                {categoryOptions.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName || "Danh mục chưa đặt tên"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <SummaryStats payload={productData} />

        <div className="mt-6">
          <PerformanceHorizontalChart
            emptyText="Chưa có dữ liệu sản phẩm trong danh mục này."
            error={productError}
            loading={productLoading}
            metric={metric}
            rangeLabel={productData?.range.label ?? rangeLabel}
            rows={productRows}
            title={`So sánh product của ${selectedCategoryName}`}
          />
        </div>
      </section>
    </div>
  );
}
