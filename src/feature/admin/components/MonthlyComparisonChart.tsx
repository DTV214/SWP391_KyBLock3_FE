import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import adminDashboardService, {
  type MonthlyComparisonResponse,
} from "../services/adminDashboardService";

type MetricTab = "orderRevenue" | "actualRevenue";

type ChartRow = {
  day: number;
  baseValue: number;
  compareValue: number;
};

const BASE_COLOR = "#C8102E";
const COMPARE_COLOR = "#2563EB";

const toMonthInputValue = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, "0")}`;

const parseMonthInputValue = (
  value: string,
): { year: number; month: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;

  return { year, month };
};

const getDefaultMonthRange = (): { base: string; compare: string } => {
  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth() + 1;
  const previous = new Date(baseYear, baseMonth - 2, 1);

  return {
    base: toMonthInputValue(baseYear, baseMonth),
    compare: toMonthInputValue(previous.getFullYear(), previous.getMonth() + 1),
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

const buildRows = (payload: MonthlyComparisonResponse): ChartRow[] => {
  const baseMap = new Map<number, number>(
    payload.baseMonth.data.map((item) => [item.day, item.value]),
  );
  const compareMap = new Map<number, number>(
    payload.compareMonth.data.map((item) => [item.day, item.value]),
  );

  const dayAxis = payload.xAxisDays.length
    ? payload.xAxisDays
    : Array.from(
        { length: Math.max(payload.baseMonth.daysInMonth, payload.compareMonth.daysInMonth, 31) },
        (_, index) => index + 1,
      );

  return dayAxis.map((day) => ({
    day,
    baseValue: baseMap.get(day) ?? 0,
    compareValue: compareMap.get(day) ?? 0,
  }));
};

export default function MonthlyComparisonChart() {
  const defaults = useMemo(getDefaultMonthRange, []);

  const [metricTab, setMetricTab] = useState<MetricTab>("orderRevenue");
  const [baseMonthInput, setBaseMonthInput] = useState(defaults.base);
  const [compareMonthInput, setCompareMonthInput] = useState(defaults.compare);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<MonthlyComparisonResponse | null>(null);
  const [chartData, setChartData] = useState<ChartRow[]>([]);

  useEffect(() => {
    const base = parseMonthInputValue(baseMonthInput);
    const compare = parseMonthInputValue(compareMonthInput);

    if (!base || !compare) {
      setError("Month format is invalid.");
      setRawData(null);
      setChartData([]);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          metricTab === "orderRevenue"
            ? await adminDashboardService.getMonthlyOrderRevenueComparison(
                base.year,
                base.month,
                compare.year,
                compare.month,
              )
            : await adminDashboardService.getMonthlyActualRevenueComparison(
                base.year,
                base.month,
                compare.year,
                compare.month,
              );

        setRawData(response);
        setChartData(buildRows(response));
      } catch (err) {
        console.error("Failed to load monthly comparison:", err);
        setError("Unable to load comparison chart.");
        setRawData(null);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [metricTab, baseMonthInput, compareMonthInput]);

  const title =
    metricTab === "orderRevenue"
      ? "So sánh doanh thu theo tháng"
      : "So sánh lợi nhuận theo tháng";

  const baseLabel = rawData?.baseMonth.label || "Base month";
  const compareLabel = rawData?.compareMonth.label || "Compare month";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length < 2) return null;
    const baseValue = Number(payload[0]?.value ?? 0);
    const compareValue = Number(payload[1]?.value ?? 0);

    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[190px]">
        <p className="text-gray-500 mb-2 font-medium">Day {label}</p>
        <div className="space-y-1 text-sm">
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: BASE_COLOR }}
              />
              {baseLabel}
            </span>
            <span className="font-semibold text-gray-800">{toCurrency(baseValue)}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COMPARE_COLOR }}
              />
              {compareLabel}
            </span>
            <span className="font-semibold text-gray-800">{toCurrency(compareValue)}</span>
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
            <h3 className="text-lg font-serif font-bold text-tet-primary">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              2 lines show base month and compare month.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMetricTab("orderRevenue")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                metricTab === "orderRevenue"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Doanh thu
            </button>
            <button
              onClick={() => setMetricTab("actualRevenue")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                metricTab === "actualRevenue"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Lợi nhuận
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span
              className="text-xs font-semibold inline-flex items-center gap-2"
              style={{ color: BASE_COLOR }}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: BASE_COLOR }}
              />
              {"Th\u00e1ng ch\u1ecdn"}
            </span>
            <input
              type="month"
              value={baseMonthInput}
              onChange={(event) => setBaseMonthInput(event.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tet-accent outline-none"
              aria-label="Thang chon"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span
              className="text-xs font-semibold inline-flex items-center gap-2"
              style={{ color: COMPARE_COLOR }}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COMPARE_COLOR }}
              />
              {"Th\u00e1ng so s\u00e1nh"}
            </span>
            <input
              type="month"
              value={compareMonthInput}
              onChange={(event) => setCompareMonthInput(event.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tet-accent outline-none"
              aria-label="Thang so sanh"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: BASE_COLOR }}
          />
          <span className="font-semibold text-gray-700">{baseLabel}</span>
          <span className="text-gray-500">
            ({toCurrency(rawData?.baseMonth.total ?? 0)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: COMPARE_COLOR }}
          />
          <span className="font-semibold text-gray-700">{compareLabel}</span>
          <span className="text-gray-500">
            ({toCurrency(rawData?.compareMonth.total ?? 0)})
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
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
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
              <Line
                type="monotone"
                dataKey="baseValue"
                stroke={BASE_COLOR}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: BASE_COLOR, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="compareValue"
                stroke={COMPARE_COLOR}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: COMPARE_COLOR, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
