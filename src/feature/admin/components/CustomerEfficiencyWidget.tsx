import React, { useEffect, useState } from "react";
import { UserCheck, UserX, AlertCircle, TrendingUp, Users } from "lucide-react";
import adminDashboardService, { type CustomerOrderStatistics } from "../services/adminDashboardService";

const CustomerEfficiencyWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerOrderStatistics[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminDashboardService.getCustomerOrderStatistics();
        setStats(data.slice(0, 5)); // Lấy top 5 khách hàng hàng đầu
      } catch (error) {
        console.error("Failed to fetch customer stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-serif font-bold text-tet-primary flex items-center gap-2">
          <TrendingUp className="text-tet-accent" size={20} />
          Hiệu suất mua hàng
        </h3>
        <span className="text-xs text-gray-400 font-medium">Top 5 khách hàng</span>
      </div>

      <div className="space-y-4">
        {stats.length > 0 ? (
          stats.map((customer) => (
            <div
              key={customer.accountId}
              className="group flex items-center justify-between p-3 rounded-2xl hover:bg-tet-secondary/20 transition-all border border-transparent hover:border-tet-secondary"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tet-secondary to-white flex items-center justify-center text-tet-accent font-bold border border-tet-secondary">
                  {customer.fullName?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-sm font-bold text-tet-primary group-hover:text-tet-accent transition-colors">
                    {customer.fullName || customer.email || "Khách hàng ẩn danh"}
                  </p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Users size={10} />
                    {customer.totalOrders} đơn đã đặt
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  {customer.successRate >= 80 ? (
                    <UserCheck size={14} className="text-green-500" />
                  ) : customer.successRate >= 50 ? (
                    <AlertCircle size={14} className="text-yellow-500" />
                  ) : (
                    <UserX size={14} className="text-red-500" />
                  )}
                  <span
                    className={`text-sm font-black ${
                      customer.successRate >= 80
                        ? "text-green-600"
                        : customer.successRate >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {customer.successRate}%
                  </span>
                </div>
                <p className="text-[10px] font-bold text-gray-400">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(customer.totalSpent)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm italic">
            Chưa có dữ liệu thống kê khách hàng.
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomerEfficiencyWidget;
