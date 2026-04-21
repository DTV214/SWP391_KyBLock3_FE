import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OrderResponse } from "@/feature/checkout/services/orderService";

const VAT_SEGMENT_COLORS = ["#C8102E", "#0EA5E9"];

interface VatSegmentChartProps {
  orders: OrderResponse[];
  title?: string;
  subtitlePrefix?: string;
}

export default function VatSegmentChart({
  orders,
  title = "VAT theo nhóm khách hàng",
  subtitlePrefix = "Toàn bộ đơn hàng:",
}: VatSegmentChartProps) {
  const vatSegmentData = useMemo(() => {
    const businessOrders = orders.filter((order) => order.requireVatInvoice);
    const retailOrders = orders.filter((order) => !order.requireVatInvoice);

    const retailRevenue = retailOrders.reduce(
      (sum, order) => sum + (order.finalPrice || 0),
      0,
    );
    const businessRevenue = businessOrders.reduce(
      (sum, order) => sum + (order.finalPrice || 0),
      0,
    );

    const retailVat = retailOrders.reduce(
      (sum, order) => sum + (order.vatAmount || 0),
      0,
    );
    const businessVat = businessOrders.reduce(
      (sum, order) => sum + (order.vatAmount || 0),
      0,
    );

    return {
      pieData: [
        { name: "Khách lẻ", value: retailOrders.length },
        { name: "Khách doanh nghiệp", value: businessOrders.length },
      ],
      revenueData: [
        {
          name: "Khách lẻ",
          orderCount: retailOrders.length,
          revenue: retailRevenue,
          vatAmount: retailVat,
        },
        {
          name: "Khách doanh nghiệp",
          orderCount: businessOrders.length,
          revenue: businessRevenue,
          vatAmount: businessVat,
        },
      ],
      totalCount: orders.length,
      totalVatAmount: retailVat + businessVat,
    };
  }, [orders]);

  return (
    <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm xl:p-6">
      <div className="mb-4 flex flex-col gap-2">
        <h3 className="text-lg font-bold text-tet-primary">{title}</h3>
        <p className="text-xs text-gray-500">
          {subtitlePrefix} {vatSegmentData.totalCount} đơn hàng, tổng VAT{" "}
          {vatSegmentData.totalVatAmount.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-[280px]">
          <p className="mb-2 text-xs font-semibold text-gray-600">Tỷ trọng số đơn</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={vatSegmentData.pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={4}
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {vatSegmentData.pieData.map((_, index) => (
                  <Cell
                    key={`vat-segment-${index}`}
                    fill={VAT_SEGMENT_COLORS[index % VAT_SEGMENT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} đơn`, "Số đơn"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[280px]">
          <p className="mb-2 text-xs font-semibold text-gray-600">Doanh thu theo nhóm</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={vatSegmentData.revenueData}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  value >= 1000000000
                    ? `${(value / 1000000000).toFixed(1)} Tỷ`
                    : value >= 1000000
                      ? `${(value / 1000000).toFixed(0)} Tr`
                      : `${(value / 1000).toFixed(0)} K`
                }
              />
              <Tooltip
                formatter={(value, name) => {
                  const numericValue =
                    typeof value === "number" ? value : Number(value ?? 0);
                  const label =
                    name === "revenue"
                      ? "Doanh thu"
                      : name === "vatAmount"
                        ? "VAT"
                        : "Giá trị";

                  return [
                    numericValue.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }),
                    label,
                  ];
                }}
              />
              <Bar dataKey="revenue" fill="#C8102E" radius={[8, 8, 0, 0]} />
              <Bar dataKey="vatAmount" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}