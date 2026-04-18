import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, Minus, Package, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import adminDashboardService, {
  type DashboardRankingPeriod,
  type TrendingProduct,
} from "../services/adminDashboardService";

type TrendingChartRow = {
  date: string;
  [productName: string]: string | number;
};

const PERIOD_OPTIONS: Array<{
  value: DashboardRankingPeriod;
  label: string;
}> = [
  { value: "week", label: "7 ngày qua" },
  { value: "month", label: "30 ngày qua" },
  { value: "year", label: "12 tháng qua" },
];

const getSeriesColor = (index: number): string => {
  const hue = (index * 137.508) % 360;
  const saturation = 68 + (index % 2) * 8;
  const lightness = 44 + (index % 3) * 6;
  return `hsl(${hue.toFixed(0)} ${saturation}% ${lightness}%)`;
};

const formatCompactNumber = (value: number): string => {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

const resolveImageUrl = (value: string | null | undefined): string => {
  if (!value) return "";
  const trimmed = value.trim();
  const markdownLinkMatch = trimmed.match(/\((https?:\/\/[^)]+)\)$/i);
  if (markdownLinkMatch?.[1]) {
    return markdownLinkMatch[1];
  }
  return trimmed;
};

export const pivotTrendingProducts = (products: TrendingProduct[]): TrendingChartRow[] => {
  const rowsByDate = new Map<string, TrendingChartRow>();

  for (const product of products) {
    for (const point of product.trendData) {
      if (!rowsByDate.has(point.date)) {
        rowsByDate.set(point.date, { date: point.date });
      }

      const row = rowsByDate.get(point.date);
      if (row) {
        row[product.productName] = point.quantity;
      }
    }
  }

  const productNames = products.map((product) => product.productName);

  return Array.from(rowsByDate.values()).map((row) => {
    for (const productName of productNames) {
      if (typeof row[productName] !== "number") {
        row[productName] = 0;
      }
    }
    return row;
  });
};

const getGrowthBadgeUi = (growthRate: number) => {
  if (growthRate > 0) {
    return {
      icon: TrendingUp,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      text: `↗ ${growthRate.toFixed(1)}%`,
    };
  }

  if (growthRate < 0) {
    return {
      icon: TrendingDown,
      className: "bg-red-50 text-red-700 border-red-200",
      text: `↘ ${Math.abs(growthRate).toFixed(1)}%`,
    };
  }

  return {
    icon: Minus,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    text: "0.0%",
  };
};

export default function TopTrendingProducts() {
  const [period, setPeriod] = useState<DashboardRankingPeriod>("week");
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminDashboardService.getTrendingProducts(period);
        setProducts(response);
      } catch (err) {
        console.error("Failed to load trending products:", err);
        setError("Không thể tải dữ liệu sản phẩm xu hướng.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchTrendingProducts();
  }, [period]);

  const chartData = useMemo(() => pivotTrendingProducts(products), [products]);

  const lineColors = useMemo(() => {
    return products.reduce<Record<string, string>>((accumulator, product, index) => {
      accumulator[product.productName] = getSeriesColor(index);
      return accumulator;
    }, {});
  }, [products]);

  const CustomTooltip = ({ active, label, payload }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="min-w-[220px] rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-tet-primary">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.dataKey}
              </span>
              <span className="font-semibold text-gray-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 text-tet-accent">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-tet-primary">
              Top Trending Products
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Theo dõi xu hướng bán ra của các sản phẩm nổi bật theo từng kỳ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Kỳ thống kê</span>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as DashboardRankingPeriod)}
          >
            <SelectTrigger className="w-[180px] rounded-xl border-gray-200 bg-white shadow-none">
              <SelectValue placeholder="Chọn kỳ thống kê" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={8}
              className="z-[70] w-[180px] rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="rounded-lg px-3 py-2 text-sm text-gray-700"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-amber-50/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-tet-primary">Biểu đồ xu hướng</p>
              <p className="text-xs text-gray-500">Mỗi đường biểu diễn một sản phẩm.</p>
            </div>
          </div>

          <div className="relative h-[320px] w-full">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                <Loader2 className="animate-spin text-tet-accent" size={30} />
              </div>
            )}

            {!loading && error && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && chartData.length === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-500">
                Chưa có dữ liệu xu hướng cho kỳ thống kê này.
              </div>
            )}

            {!error && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    domain={[0, "dataMax + 2"]}
                    allowDecimals={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    tickFormatter={formatCompactNumber}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  {products.map((product) => (
                    <Line
                      key={product.productId}
                      type="monotoneX"
                      dataKey={product.productName}
                      name={product.productName}
                      stroke={lineColors[product.productName]}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                      activeDot={{
                        r: 5,
                        fill: lineColors[product.productName],
                        strokeWidth: 0,
                      }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-gray-50/70 p-4">
          <div className="mb-4">
            <p className="text-sm font-semibold text-tet-primary">Bảng xếp hạng sản phẩm</p>
            <p className="text-xs text-gray-500">Top sản phẩm nổi bật trong kỳ đã chọn.</p>
          </div>

          <div className="space-y-3">
            {products.map((product, index) => {
              const imageUrl = resolveImageUrl(product.imageUrl);
              const growthBadge = getGrowthBadgeUi(product.growthRate);
              const GrowthIcon = growthBadge.icon;

              return (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 rounded-2xl border border-white bg-white p-3 shadow-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tet-secondary text-xs font-bold text-tet-primary">
                    #{index + 1}
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.productName}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <Package size={20} className="text-gray-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {product.productName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Đã bán {product.totalSoldInPeriod.toLocaleString("vi-VN")} sản phẩm
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${growthBadge.className}`}
                  >
                    <GrowthIcon size={12} />
                    {growthBadge.text}
                  </Badge>
                </div>
              );
            })}

            {!loading && !error && products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                Không có sản phẩm xu hướng để hiển thị.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
