import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import adminDashboardService, {
  type MonthlyComparisonResponse,
  type YearlyComparisonResponse,
} from "../services/adminDashboardService";

type CompareMode = "month" | "year";
type MetricTab = "orderRevenue" | "actualRevenue";

type ChartRow = {
  label: string;
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

const parseYear = (value: string): number | null => {
  const year = Number(value);
  if (!Number.isInteger(year)) return null;
  if (year < 1900 || year > 3000) return null;
  return year;
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

const buildMonthRows = (
  payload: MonthlyComparisonResponse,
): ChartRow[] => {
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
    label: String(day),
    baseValue: baseMap.get(day) ?? 0,
    compareValue: compareMap.get(day) ?? 0,
  }));
};

const buildYearRows = (payload: YearlyComparisonResponse): ChartRow[] => {
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
    label: String(month),
    baseValue: baseMap.get(month) ?? 0,
    compareValue: compareMap.get(month) ?? 0,
  }));
};

export default function MonthlyComparisonChart() {
  const monthDefaults = useMemo(getDefaultMonthRange, []);
  const yearDefaults = useMemo(getDefaultYears, []);

  const [compareMode, setCompareMode] = useState<CompareMode>("month");
  const [metricTab, setMetricTab] = useState<MetricTab>("orderRevenue");
  const [baseMonthInput, setBaseMonthInput] = useState(monthDefaults.base);
  const [compareMonthInput, setCompareMonthInput] = useState(monthDefaults.compare);
  const [baseYearInput, setBaseYearInput] = useState(yearDefaults.baseYear);
  const [compareYearInput, setCompareYearInput] = useState(yearDefaults.compareYear);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [baseLabel, setBaseLabel] = useState("");
  const [compareLabel, setCompareLabel] = useState("");
  const [baseTotal, setBaseTotal] = useState(0);
  const [compareTotal, setCompareTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (compareMode === "month") {
          const base = parseMonthInputValue(baseMonthInput);
          const compare = parseMonthInputValue(compareMonthInput);

          if (!base || !compare) {
            setError("Khoảng tháng không hợp lệ.");
            setChartData([]);
            setLoading(false);
            return;
          }

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

          setChartData(buildMonthRows(response));
          setBaseLabel(response.baseMonth.label || baseMonthInput);
          setCompareLabel(response.compareMonth.label || compareMonthInput);
          setBaseTotal(response.baseMonth.total ?? 0);
          setCompareTotal(response.compareMonth.total ?? 0);
        } else {
          const baseYear = parseYear(baseYearInput);
          const compareYear = parseYear(compareYearInput);

          if (!baseYear || !compareYear) {
            setError("Khoảng năm không hợp lệ.");
            setChartData([]);
            setLoading(false);
            return;
          }

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

          setChartData(buildYearRows(response));
          setBaseLabel(response.baseYear.label || String(baseYear));
          setCompareLabel(response.compareYear.label || String(compareYear));
          setBaseTotal(response.baseYear.total ?? 0);
          setCompareTotal(response.compareYear.total ?? 0);
        }
      } catch (err) {
        console.error("Failed to load comparison chart:", err);
        setError("Không thể tải biểu đồ so sánh.");
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [compareMode, metricTab, baseMonthInput, compareMonthInput, baseYearInput, compareYearInput]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length < 2) return null;
    const leftValue = Number(payload.find((item: any) => item.dataKey === "baseValue")?.value ?? 0);
    const rightValue = Number(payload.find((item: any) => item.dataKey === "compareValue")?.value ?? 0);
    const pointLabel = compareMode === "year" ? `Tháng ${label}` : `Ngày ${label}`;

    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[190px]">
        <p className="text-gray-500 mb-2 font-medium">{pointLabel}</p>
        <div className="space-y-1 text-sm">
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: BASE_COLOR }}
              />
              {baseLabel}
            </span>
            <span className="font-semibold text-gray-800">{toCurrency(leftValue)}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COMPARE_COLOR }}
              />
              {compareLabel}
            </span>
            <span className="font-semibold text-gray-800">{toCurrency(rightValue)}</span>
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

        <div className="flex flex-col lg:flex-row gap-2 lg:items-end">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setCompareMode("month")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                compareMode === "month"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              So sánh tháng
            </button>
            <button
              onClick={() => setCompareMode("year")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                compareMode === "year"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              So sánh năm
            </button>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
            Chỉ số
            <select
              value={metricTab}
              onChange={(event) => setMetricTab(event.target.value as MetricTab)}
              className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
            >
              <option value="orderRevenue">Doanh thu</option>
              <option value="actualRevenue">Lợi nhuận</option>
            </select>
          </label>

          {compareMode === "month" ? (
            <>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Tháng 1
                <input
                  type="month"
                  value={baseMonthInput}
                  onChange={(event) => setBaseMonthInput(event.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Tháng 2
                <input
                  type="month"
                  value={compareMonthInput}
                  onChange={(event) => setCompareMonthInput(event.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Năm 1
                <input
                  type="number"
                  min={1900}
                  max={3000}
                  step={1}
                  value={baseYearInput}
                  onChange={(event) => setBaseYearInput(event.target.value)}
                  className="h-10 w-[130px] rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Năm 2
                <input
                  type="number"
                  min={1900}
                  max={3000}
                  step={1}
                  value={compareYearInput}
                  onChange={(event) => setCompareYearInput(event.target.value)}
                  className="h-10 w-[130px] rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
                />
              </label>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: BASE_COLOR }}
          />
          <span className="font-semibold text-gray-700">{baseLabel || "Mốc 1"}</span>
          <span className="text-gray-500">
            ({toCurrency(baseTotal)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: COMPARE_COLOR }}
          />
          <span className="font-semibold text-gray-700">{compareLabel || "Mốc 2"}</span>
          <span className="text-gray-500">
            ({toCurrency(compareTotal)})
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
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 8, bottom: 8 }}
            >
              <defs>
                <linearGradient id="baseDensityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BASE_COLOR} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={BASE_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compareDensityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COMPARE_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COMPARE_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tickFormatter={(value) =>
                  compareMode === "year" ? `T${value}` : String(value)
                }
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
              <Area
                type="monotone"
                dataKey="baseValue"
                stroke={BASE_COLOR}
                strokeWidth={3}
                fill="url(#baseDensityGradient)"
                fillOpacity={1}
                activeDot={{ r: 5, strokeWidth: 0, fill: BASE_COLOR }}
              />
              <Area
                type="monotone"
                dataKey="compareValue"
                stroke={COMPARE_COLOR}
                strokeWidth={3}
                fill="url(#compareDensityGradient)"
                fillOpacity={1}
                activeDot={{ r: 5, strokeWidth: 0, fill: COMPARE_COLOR }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
