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
  type YearlyComparisonResponse,
} from "../services/adminDashboardService";

type MetricTab = "orderRevenue" | "actualRevenue";

type ChartRow = {
  month: number;
  baseValue: number;
  compareValue: number;
};

const BASE_COLOR = "#C8102E";
const COMPARE_COLOR = "#2563EB";

const parseYear = (value: string): number | null => {
  const year = Number(value);
  if (!Number.isInteger(year)) return null;
  if (year < 1900 || year > 3000) return null;
  return year;
};

const getDefaultYears = (): { baseYear: string; compareYear: string } => {
  const current = new Date().getFullYear();
  return {
    baseYear: String(current),
    compareYear: String(current - 1),
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

const buildRows = (payload: YearlyComparisonResponse): ChartRow[] => {
  const baseMap = new Map<number, number>(
    payload.baseYear.data.map((item) => [item.month, item.value]),
  );
  const compareMap = new Map<number, number>(
    payload.compareYear.data.map((item) => [item.month, item.value]),
  );

  const monthAxis = payload.xAxisMonths.length
    ? payload.xAxisMonths
    : Array.from({ length: 12 }, (_, index) => index + 1);

  return monthAxis.map((month) => ({
    month,
    baseValue: baseMap.get(month) ?? 0,
    compareValue: compareMap.get(month) ?? 0,
  }));
};

export default function YearlyComparisonBarChart() {
  const defaults = useMemo(getDefaultYears, []);

  const [metricTab, setMetricTab] = useState<MetricTab>("orderRevenue");
  const [baseYearInput, setBaseYearInput] = useState(defaults.baseYear);
  const [compareYearInput, setCompareYearInput] = useState(defaults.compareYear);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<YearlyComparisonResponse | null>(null);
  const [chartData, setChartData] = useState<ChartRow[]>([]);

  useEffect(() => {
    const baseYear = parseYear(baseYearInput);
    const compareYear = parseYear(compareYearInput);

    if (!baseYear || !compareYear) {
      setError("Year format is invalid.");
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
            ? await adminDashboardService.getYearlyOrderRevenueComparison(
                baseYear,
                compareYear,
              )
            : await adminDashboardService.getYearlyActualRevenueComparison(
                baseYear,
                compareYear,
              );

        setRawData(response);
        setChartData(buildRows(response));
      } catch (err) {
        console.error("Failed to load yearly comparison:", err);
        setError("Unable to load yearly comparison chart.");
        setRawData(null);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [metricTab, baseYearInput, compareYearInput]);

  const title =
    metricTab === "orderRevenue"
      ? "So s\u00e1nh doanh thu theo n\u0103m"
      : "So s\u00e1nh l\u1ee3i nhu\u1eadn theo n\u0103m";

  const baseLabel = rawData?.baseYear.label || baseYearInput;
  const compareLabel = rawData?.compareYear.label || compareYearInput;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length < 2) return null;

    const baseValue = Number(payload[0]?.value ?? 0);
    const compareValue = Number(payload[1]?.value ?? 0);

    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[210px]">
        <p className="text-gray-500 mb-2 font-medium">{"Th\u00e1ng"} {label}</p>
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
          <BarChart3 className="text-tet-accent" size={24} />
          <div>
            <h3 className="text-lg font-serif font-bold text-tet-primary">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {"Bi\u1ec3u \u0111\u1ed3 c\u1ed9t theo 12 th\u00e1ng c\u1ee7a 2 n\u0103m."}
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
              {"Doanh thu"}
            </button>
            <button
              onClick={() => setMetricTab("actualRevenue")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                metricTab === "actualRevenue"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {"L\u1ee3i nhu\u1eadn"}
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
              {"N\u0103m ch\u1ecdn"}
            </span>
            <input
              type="number"
              min={1900}
              max={3000}
              step={1}
              value={baseYearInput}
              onChange={(event) => setBaseYearInput(event.target.value)}
              className="w-[130px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tet-accent outline-none"
              aria-label="Nam chon"
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
              {"N\u0103m so s\u00e1nh"}
            </span>
            <input
              type="number"
              min={1900}
              max={3000}
              step={1}
              value={compareYearInput}
              onChange={(event) => setCompareYearInput(event.target.value)}
              className="w-[130px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tet-accent outline-none"
              aria-label="Nam so sanh"
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
            ({toCurrency(rawData?.baseYear.total ?? 0)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: COMPARE_COLOR }}
          />
          <span className="font-semibold text-gray-700">{compareLabel}</span>
          <span className="text-gray-500">
            ({toCurrency(rawData?.compareYear.total ?? 0)})
          </span>
        </div>
      </div>

      <div className="relative w-full h-[430px]">
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
                dataKey="month"
                tickFormatter={(value: number) => `T${value}`}
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
                dataKey="baseValue"
                fill={BASE_COLOR}
                radius={[6, 6, 0, 0]}
                maxBarSize={26}
              />
              <Bar
                dataKey="compareValue"
                fill={COMPARE_COLOR}
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
