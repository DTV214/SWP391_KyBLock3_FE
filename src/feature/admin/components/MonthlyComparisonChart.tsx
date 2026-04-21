import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import adminDashboardService, {
  type RevenueDataPoint,
} from "../services/adminDashboardService";

type PeriodTab = "day" | "month" | "year";

type ChartRow = {
  label: string;
  revenue: number;
  profit: number;
};

const REVENUE_COLOR = "#C8102E";
const PROFIT_COLOR = "#2563EB";

const toDateInputValue = (date: Date): string =>
  date.toISOString().split("T")[0];

const toMonthInputValue = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const resolveRange = (period: PeriodTab): { startDate: string; endDate: string } => {
  const now = new Date();
  const endDate = toDateInputValue(now);

  if (period === "day") {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    return { startDate: toDateInputValue(start), endDate };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    return { startDate: toDateInputValue(start), endDate };
  }

  const start = new Date(now.getFullYear() - 4, 0, 1);
  return { startDate: toDateInputValue(start), endDate };
};

const getDefaultFilters = () => {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setDate(now.getDate() - 30);

  const monthStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  return {
    dayStart: toDateInputValue(dayStart),
    dayEnd: toDateInputValue(now),
    monthStart: toMonthInputValue(monthStart),
    monthEnd: toMonthInputValue(now),
    yearStart: String(now.getFullYear() - 4),
    yearEnd: String(now.getFullYear()),
  };
};

const monthValueToDateRange = (value: string): { startDate: string; endDate: string } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDateDate = new Date(year, month, 0);
  const endDate = toDateInputValue(endDateDate);

  return { startDate, endDate };
};

const yearValueToDateRange = (value: string): { startDate: string; endDate: string } | null => {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 3000) return null;
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
};

const formatYAxis = (tickItem: number): string => {
  if (tickItem === 0) return "0";
  if (tickItem >= 1000000000) return `${(tickItem / 1000000000).toFixed(1)} B`;
  if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(0)} M`;
  if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(0)} K`;
  return String(tickItem);
};

const toCurrency = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const mergeRows = (
  revenueData: RevenueDataPoint[],
  profitData: RevenueDataPoint[],
): ChartRow[] => {
  const merged = new Map<string, ChartRow>();

  revenueData.forEach((item) => {
    merged.set(item.date, {
      label: item.date,
      revenue: item.revenue,
      profit: 0,
    });
  });

  profitData.forEach((item) => {
    const existing = merged.get(item.date);
    if (existing) {
      existing.profit = item.revenue;
      return;
    }

    merged.set(item.date, {
      label: item.date,
      revenue: 0,
      profit: item.revenue,
    });
  });

  return Array.from(merged.values());
};

const formatXAxisLabel = (label: string, period: PeriodTab): string => {
  if (period === "year") return label;

  const date = new Date(label);
  if (Number.isNaN(date.getTime())) return label;

  if (period === "month") {
    return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  }

  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export default function MonthlyComparisonChart() {
  const defaults = getDefaultFilters();

  const [periodTab, setPeriodTab] = useState<PeriodTab>("day");
  const [dayStart, setDayStart] = useState(defaults.dayStart);
  const [dayEnd, setDayEnd] = useState(defaults.dayEnd);
  const [monthStart, setMonthStart] = useState(defaults.monthStart);
  const [monthEnd, setMonthEnd] = useState(defaults.monthEnd);
  const [yearStart, setYearStart] = useState(defaults.yearStart);
  const [yearEnd, setYearEnd] = useState(defaults.yearEnd);
  const [applyTick, setApplyTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartRow[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        let startDate = "";
        let endDate = "";

        if (periodTab === "day") {
          if (!dayStart || !dayEnd || dayStart > dayEnd) {
            setError("Khoảng ngày không hợp lệ.");
            setChartData([]);
            setLoading(false);
            return;
          }
          startDate = dayStart;
          endDate = dayEnd;
        } else if (periodTab === "month") {
          const startMonth = monthValueToDateRange(monthStart);
          const endMonth = monthValueToDateRange(monthEnd);
          if (!startMonth || !endMonth || startMonth.startDate > endMonth.endDate) {
            setError("Khoảng tháng không hợp lệ.");
            setChartData([]);
            setLoading(false);
            return;
          }
          startDate = startMonth.startDate;
          endDate = endMonth.endDate;
        } else {
          const startYear = yearValueToDateRange(yearStart);
          const endYear = yearValueToDateRange(yearEnd);
          if (!startYear || !endYear || startYear.startDate > endYear.endDate) {
            setError("Khoảng năm không hợp lệ.");
            setChartData([]);
            setLoading(false);
            return;
          }
          startDate = startYear.startDate;
          endDate = endYear.endDate;
        }

        const [revenueRes, profitRes] = await Promise.all([
          adminDashboardService.getRevenue(periodTab, startDate, endDate),
          adminDashboardService.getActualRevenue(periodTab, startDate, endDate),
        ]);

        setChartData(mergeRows(revenueRes.data || [], profitRes.data || []));
      } catch (err) {
        console.error("Failed to load monthly comparison:", err);
        setError("Không thể tải biểu đồ so sánh doanh thu và lợi nhuận.");
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [periodTab, applyTick]);

  useEffect(() => {
    const defaultRange = resolveRange(periodTab);
    if (periodTab === "day") {
      setDayStart(defaultRange.startDate);
      setDayEnd(defaultRange.endDate);
    }
  }, [periodTab]);

  const handleApplyFilter = () => {
    setApplyTick((prev) => prev + 1);
  };

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalProfit = chartData.reduce((sum, item) => sum + item.profit, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length < 2) return null;
    const revenue = Number(payload.find((item: any) => item.dataKey === "revenue")?.value ?? 0);
    const profit = Number(payload.find((item: any) => item.dataKey === "profit")?.value ?? 0);

    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[190px]">
        <p className="text-gray-500 mb-2 font-medium">{formatXAxisLabel(label, periodTab)}</p>
        <div className="space-y-1 text-sm">
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: REVENUE_COLOR }}
              />
              Doanh thu
            </span>
            <span className="font-semibold text-gray-800">{toCurrency(revenue)}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PROFIT_COLOR }}
              />
              Lợi nhuận
            </span>
            <span className="font-semibold text-gray-800">{toCurrency(profit)}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-tet-accent" size={24} />
          <div>
            <h3 className="text-lg font-serif font-bold text-tet-primary">So sánh doanh thu và lợi nhuận</h3>
            
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setPeriodTab("day")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                periodTab === "day"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Ngày
            </button>
            <button
              onClick={() => setPeriodTab("month")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                periodTab === "month"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setPeriodTab("year")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                periodTab === "year"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Năm
            </button>
          </div>

          {periodTab === "day" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Từ ngày
                <input
                  type="date"
                  value={dayStart}
                  onChange={(event) => setDayStart(event.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Đến ngày
                <input
                  type="date"
                  value={dayEnd}
                  onChange={(event) => setDayEnd(event.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
            </div>
          )}

          {periodTab === "month" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Từ tháng
                <input
                  type="month"
                  value={monthStart}
                  onChange={(event) => setMonthStart(event.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Đến tháng
                <input
                  type="month"
                  value={monthEnd}
                  onChange={(event) => setMonthEnd(event.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
            </div>
          )}

          {periodTab === "year" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Từ năm
                <input
                  type="number"
                  min={1900}
                  max={3000}
                  step={1}
                  value={yearStart}
                  onChange={(event) => setYearStart(event.target.value)}
                  className="h-10 w-[130px] rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Đến năm
                <input
                  type="number"
                  min={1900}
                  max={3000}
                  step={1}
                  value={yearEnd}
                  onChange={(event) => setYearEnd(event.target.value)}
                  className="h-10 w-[130px] rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={handleApplyFilter}
            className="h-10 mt-[22px] rounded-xl bg-tet-primary px-4 text-white text-sm font-bold hover:opacity-95"
          >
            Áp dụng
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: REVENUE_COLOR }}
          />
          <span className="font-semibold text-gray-700">Doanh thu</span>
          <span className="text-gray-500">
            ({toCurrency(totalRevenue)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: PROFIT_COLOR }}
          />
          <span className="font-semibold text-gray-700">Lợi nhuận</span>
          <span className="text-gray-500">
            ({toCurrency(totalProfit)})
          </span>
        </div>
      </div>

      <div className="relative w-full h-[420px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
            <Loader2 className="animate-spin text-tet-accent" size={32} />
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {!error && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 8, bottom: 8 }}
              barCategoryGap={18}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tickFormatter={(value) => formatXAxisLabel(String(value), periodTab)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickFormatter={formatYAxis}
                width={72}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="revenue"
                fill={REVENUE_COLOR}
                radius={[6, 6, 0, 0]}
                maxBarSize={26}
              />
              <Bar
                dataKey="profit"
                fill={PROFIT_COLOR}
                radius={[6, 6, 0, 0]}
                maxBarSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
