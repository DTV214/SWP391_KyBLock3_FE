import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  CalendarDays,
  Loader2,
  Package,
  PieChart as PieChartIcon,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import adminDashboardService, {
  type EventTrendResponse,
} from "../services/adminDashboardService";

const CATEGORY_COLORS = [
  "#C8102E",
  "#F59E0B",
  "#0EA5E9",
  "#22C55E",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: `Tháng ${index + 1}`,
}));

const formatNumber = (value: number): string => value.toLocaleString("vi-VN");

const resolveImageUrl = (value: string | null | undefined): string => {
  if (!value) return "";

  const trimmed = value.trim();
  const markdownLinkMatch = trimmed.match(/\((https?:\/\/[^)]+)\)$/i);

  if (markdownLinkMatch?.[1]) {
    return markdownLinkMatch[1];
  }

  return trimmed;
};

const renderPieLabel = ({
  percent,
  x,
  y,
}: {
  percent?: number;
  x?: number;
  y?: number;
}) => {
  if (!percent || percent < 0.06 || x == null || y == null) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill="#111827"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function TopTrendingProducts() {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const [selectedMonth, setSelectedMonth] = useState(() => String(currentMonth));
  const [data, setData] = useState<EventTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isActive = true;

    const fetchEventTrend = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminDashboardService.getEventTrend(
          Number(selectedMonth),
        );

        if (!isActive) {
          return;
        }

        setData(response);
        setBrokenImages({});
      } catch (err) {
        if (!isActive) {
          return;
        }

        console.error("Failed to load event trend:", err);
        setError("Không thể tải dữ liệu xu hướng sự kiện.");
        setData(null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchEventTrend();

    return () => {
      isActive = false;
    };
  }, [selectedMonth]);

  const topCategories = useMemo(
    () =>
      [...(data?.topCategories ?? [])]
        .filter((category) => category.categoryName.trim() && category.totalSold > 0)
        .sort((left, right) => right.totalSold - left.totalSold),
    [data?.topCategories],
  );

  const topProducts = useMemo(
    () =>
      [...(data?.topProducts ?? [])]
        .filter((product) => product.productName.trim() && product.totalSold > 0)
        .sort((left, right) => right.totalSold - left.totalSold)
        .slice(0, 10),
    [data?.topProducts],
  );

  const maxProductSold = useMemo(
    () => Math.max(...topProducts.map((product) => product.totalSold), 0),
    [topProducts],
  );

  const hasCategoryData = topCategories.length > 0;
  const hasProductData = topProducts.length > 0;
  const displayedMonth = data?.requestedMonth || Number(selectedMonth);
  const displayedYear = data?.dataYear || null;

  const categoryTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const item = payload[0]?.payload;
    const color = payload[0]?.color;

    if (!item) return null;

    return (
      <div className="min-w-[220px] rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-tet-primary">
          {item.categoryName}
        </p>
        <div className="space-y-1 text-sm text-gray-600">
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              Tỷ trọng
            </span>
            <span className="font-semibold text-gray-900">
              {item.percentage.toFixed(1)}%
            </span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span>Số lượng bán</span>
            <span className="font-semibold text-gray-900">
              {formatNumber(item.totalSold)}
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 text-tet-accent">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-tet-primary">
              Dashboard Xu Hướng Sự Kiện
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Phân tích xu hướng bán chạy theo sự kiện của từng tháng để hỗ trợ
              nhập hàng hợp lý.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600">Tháng</span>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px] rounded-xl border-gray-200 bg-white shadow-none">
              <SelectValue placeholder="Chọn tháng" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={8}
              className="z-[70] w-[160px] rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              {MONTH_OPTIONS.map((option) => (
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

      <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-tet-primary">
          <CalendarDays size={16} />
          {data ? (
            displayedYear ? (
              `Đang hiển thị dữ liệu xu hướng sự kiện của Tháng ${displayedMonth} năm ${displayedYear}`
            ) : (
              `Đang hiển thị dữ liệu xu hướng sự kiện của Tháng ${displayedMonth}`
            )
          ) : (
            `Đang chuẩn bị dữ liệu xu hướng sự kiện của Tháng ${selectedMonth}`
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-amber-50/60 to-rose-50/40 p-5 shadow-[0_18px_45px_-35px_rgba(120,53,15,0.45)]">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <PieChartIcon size={20} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-tet-primary">
                Thị phần danh mục
              </h4>
              <p className="text-sm text-gray-500">
                Nhóm danh mục đang chiếm tỷ trọng nổi bật nhất trong tháng sự
                kiện đã chọn.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-inner">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-gradient-to-r from-amber-200/20 via-rose-200/20 to-transparent blur-3xl" />

            <div className="relative space-y-5">
              <div className="relative h-[360px] w-full">
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

                {!loading && !error && !hasCategoryData && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-500">
                    Chưa có dữ liệu danh mục cho tháng này.
                  </div>
                )}

                {!error && hasCategoryData && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topCategories}
                        dataKey="totalSold"
                        nameKey="categoryName"
                        innerRadius={72}
                        outerRadius={118}
                        paddingAngle={3}
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {topCategories.map((category, index) => (
                          <Cell
                            key={category.categoryId}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={categoryTooltip} />
                      <text
                        x="50%"
                        y="48%"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-gray-500 text-[11px] font-medium"
                      >
                        Tháng {displayedMonth}
                      </text>
                      <text
                        x="50%"
                        y="56%"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-tet-primary text-base font-bold"
                      >
                        {displayedYear ? `Năm ${displayedYear}` : "Xu hướng sự kiện"}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {!loading && !error && hasCategoryData && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {topCategories.map((category, index) => (
                    <div
                      key={category.categoryId}
                      className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                              }}
                            />
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {category.categoryName}
                            </p>
                          </div>
                          <p className="mt-1 min-h-[2.5rem] text-xs text-gray-500">
                            Danh mục nổi bật trong tháng sự kiện.
                          </p>
                          <div className="mt-3">
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                              {category.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <Package size={20} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-tet-primary">
                Top 10 sản phẩm bán chạy
              </h4>
              <p className="text-sm text-gray-500">
                Bảng xếp hạng sản phẩm nổi bật để Admin tham khảo nhập hàng theo
                tháng sự kiện.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-12 text-sm text-gray-500">
                <Loader2 className="mr-2 animate-spin text-tet-accent" size={18} />
                Đang tải bảng xếp hạng sản phẩm...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && !hasProductData && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                Không có sản phẩm bán chạy để hiển thị.
              </div>
            )}

            {!loading &&
              !error &&
              topProducts.map((product, index) => {
                const productKey = `${product.productId}-${product.productName}`;
                const imageUrl = resolveImageUrl(product.imageUrl);
                const ratio =
                  maxProductSold > 0 ? (product.totalSold / maxProductSold) * 100 : 0;
                const shouldShowImage = Boolean(imageUrl) && !brokenImages[productKey];

                return (
                  <div
                    key={productKey}
                    className="rounded-2xl border border-white bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tet-secondary text-sm font-bold text-tet-primary">
                        #{index + 1}
                      </div>

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                        {shouldShowImage ? (
                          <img
                            src={imageUrl}
                            alt={product.productName}
                            className="h-full w-full object-cover"
                            onError={() => {
                              setBrokenImages((current) =>
                                current[productKey]
                                  ? current
                                  : { ...current, [productKey]: true },
                              );
                            }}
                          />
                        ) : (
                          <Package size={20} className="text-gray-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {product.productName}
                          </p>
                          <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-sm font-bold text-tet-primary">
                            {formatNumber(product.totalSold)} đã bán
                          </span>
                        </div>

                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400"
                            style={{ width: ratio > 0 ? `${Math.max(ratio, 8)}%` : "0%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>
    </section>
  );
}
