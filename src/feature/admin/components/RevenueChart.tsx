import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import adminDashboardService, {
  type RevenueDataPoint,
} from "../services/adminDashboardService";

type FilterType = "week" | "month" | "year";
type MetricType = "revenue" | "actualRevenue";

export default function RevenueChart() {
  const [filter, setFilter] = useState<FilterType>("week");
  const [metric, setMetric] = useState<MetricType>("revenue");
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      setError(null);
      try {
        let period = "day";
        let startDate: string | undefined = undefined;
        let endDate: string | undefined = undefined;

        const now = new Date();
        const end = now.toISOString().split("T")[0];

        if (filter === "week") {
          // Last 7 days
          period = "day";
          const start = new Date();
          start.setDate(start.getDate() - 7);
          startDate = start.toISOString().split("T")[0];
          endDate = end;
        } else if (filter === "month") {
          // Last 30 days
          period = "day";
          const start = new Date();
          start.setDate(start.getDate() - 30);
          startDate = start.toISOString().split("T")[0];
          endDate = end;
        } else if (filter === "year") {
          // This year (month wise)
          period = "month";
          const start = new Date(now.getFullYear(), 0, 1);
          startDate = start.toISOString().split("T")[0];
          endDate = end;
        }

        const response = metric === "actualRevenue"
          ? await adminDashboardService.getActualRevenue(period, startDate, endDate)
          : await adminDashboardService.getRevenue(period, startDate, endDate);
        setData(response.data || []);
      } catch (err) {
        console.error("Failed to fetch revenue data:", err);
        setError(
          metric === "actualRevenue"
            ? "Không thể tải biểu đồ doanh thu."
            : "Không thể tải biểu đồ lợi nhuận.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [filter, metric]);

  // Format Y-axis ticks to abbreviated VND
  const formatYAxis = (tickItem: number) => {
    if (tickItem === 0) return "0";
    if (tickItem >= 1000000000) return `${(tickItem / 1000000000).toFixed(1)} Tỷ`;
    if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(0)} Tr`;
    if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(0)} K`;
    return tickItem.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const orderCount = payload[0].payload.orderCount;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[150px]">
          <p className="text-gray-500 mb-1 font-medium">{label}</p>
          <p className="font-bold text-tet-primary text-base">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(value)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{orderCount} đơn hàng</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-tet-accent" size={24} />
          <h3 className="text-lg font-serif font-bold text-tet-primary">
            {metric === "actualRevenue"
              ? "Biểu đồ lợi nhuận"
              : "Biểu đồ doanh thu"}
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMetric("revenue")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                metric === "revenue"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Doanh thu
            </button>
            <button
              onClick={() => setMetric("actualRevenue")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                metric === "actualRevenue"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              lợi nhận
            </button>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter("week")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                filter === "week"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              7 Ngày
            </button>
            <button
              onClick={() => setFilter("month")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                filter === "month"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              30 Ngày
            </button>
            <button
              onClick={() => setFilter("year")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                filter === "year"
                  ? "bg-white text-tet-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Năm nay
            </button>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
            <Loader2 className="animate-spin text-tet-accent" size={32} />
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-red-500">
            <p>{error}</p>
            <button
              onClick={() => setFilter(filter)}
              className="mt-2 text-sm underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {!error && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8102E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C8102E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={formatYAxis}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C8102E"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#C8102E' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
