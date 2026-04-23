import React, { useEffect, useState, useMemo } from "react";
import { UserCheck, UserX, AlertCircle, TrendingUp, Users, Search, X, Calendar } from "lucide-react";
import adminDashboardService, { type CustomerOrderStatistics } from "../services/adminDashboardService";

const CustomerEfficiencyWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerOrderStatistics[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalStats, setModalStats] = useState<CustomerOrderStatistics[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "day" | "week" | "month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    // Initial fetch for top 5 widgets (all times)
    const fetchStats = async () => {
      try {
        const data = await adminDashboardService.getCustomerOrderStatistics();
        setStats(data.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch customer stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch for Modal when filters change
  useEffect(() => {
    if (!isModalOpen) return;

    const fetchModalStats = async () => {
      setModalLoading(true);
      try {
        let start = undefined;
        let end = undefined;
        const now = new Date();
        
        if (filterType === "day") {
          start = new Date(now.setHours(0,0,0,0)).toISOString();
          end = new Date(now.setHours(23,59,59,999)).toISOString();
        } else if (filterType === "week") {
          const first = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
          start = new Date(new Date(now).setDate(first)).toISOString();
          end = new Date().toISOString(); 
        } else if (filterType === "month") {
          start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        } else if (filterType === "custom") {
          if (customStartDate) start = new Date(customStartDate).toISOString();
          if (customEndDate) end = new Date(customEndDate).toISOString();
        }

        const data = await adminDashboardService.getCustomerOrderStatistics(start, end);
        setModalStats(data);
      } catch (error) {
        console.error("Failed to fetch custom stats:", error);
      } finally {
        setModalLoading(false);
      }
    };

    fetchModalStats();
  }, [isModalOpen, filterType, customStartDate, customEndDate]);
  const filteredModalStats = useMemo(() => {
    return modalStats.filter((c) => {
      const searchLower = searchTerm.toLowerCase();
      const matchName = c.fullName?.toLowerCase().includes(searchLower);
      const matchEmail = c.email?.toLowerCase().includes(searchLower);
      return matchName || matchEmail;
    });
  }, [modalStats, searchTerm]);

  const getTier = (spent: number) => {
    if (spent >= 5000000) return { label: "VIP", icon: "🥇", color: "bg-amber-100 text-amber-700 border-amber-200" };
    if (spent >= 1000000) return { label: "Regular", icon: "🥈", color: "bg-blue-100 text-blue-700 border-blue-200" };
    return { label: "New", icon: "🥉", color: "bg-gray-100 text-gray-700 border-gray-200" };
  };

  const averageSuccessRate = useMemo(() => {
    if (stats.length === 0) return 0;
    return Math.round(stats.reduce((sum, c) => sum + c.successRate, 0) / stats.length);
  }, [stats]);

  const modalAverageSuccessRate = useMemo(() => {
    if (filteredModalStats.length === 0) return 0;
    return Math.round(filteredModalStats.reduce((sum, c) => sum + c.successRate, 0) / filteredModalStats.length);
  }, [filteredModalStats]);

  // View template for customer row
  const renderCustomerRow = (customer: CustomerOrderStatistics) => (
    <div
      key={customer.accountId}
      className="group flex items-center justify-between p-3 rounded-2xl hover:bg-tet-secondary/20 transition-all border border-transparent hover:border-tet-secondary bg-white"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tet-secondary to-white flex items-center justify-center text-tet-accent font-bold border border-tet-secondary">
            {customer.fullName?.charAt(0) || "U"}
          </div>
          <div className="absolute -bottom-1 -right-1 text-xs">
            {getTier(customer.totalSpentAllTime).icon}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-tet-primary group-hover:text-tet-accent transition-colors">
              {customer.fullName || customer.email || "Khách hàng ẩn danh"}
            </p>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase tracking-tighter ${getTier(customer.totalSpentAllTime).color}`}>
              {getTier(customer.totalSpentAllTime).label}
            </span>
          </div>
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
        <p className="text-xs font-bold text-tet-primary" title="Chi tiêu trong kỳ">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(customer.totalSpent)}
        </p>
        <p className="text-[10px] font-semibold text-gray-400 mt-0.5" title="Chi tiêu tích lũy (Toàn thời gian)">
          Tích lũy: {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(customer.totalSpentAllTime)}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full rounded-3xl border border-gray-100 bg-white p-6 animate-pulse shadow-sm">
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
    <>
      <section 
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="absolute inset-0 bg-tet-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center justify-between mb-6 relative">
          <div>
            <h3 className="text-lg font-serif font-bold text-tet-primary flex items-center gap-2">
              <TrendingUp className="text-tet-accent" size={20} />
              Khách hàng thân thiết
            </h3>
            {stats.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shadow-sm ${
                   averageSuccessRate >= 80 ? "bg-green-50 text-green-700 border-green-200" :
                   averageSuccessRate >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                   "bg-red-50 text-red-700 border-red-200"
                 }`}>
                   <TrendingUp size={12} />
                   <span className="text-xs font-black">Điểm TB: {averageSuccessRate}%</span>
                 </div>
                 <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Top 5 khách hàng</span>
              </div>
            )}
          </div>
          <span className="text-xs text-tet-accent font-medium bg-tet-secondary/20 px-3 py-1.5 rounded-lg group-hover:bg-tet-accent group-hover:text-white transition-colors border border-tet-accent/20">
            Xem tất cả
          </span>
        </div>

        <div className="relative space-y-4">
          {stats.length > 0 ? (
            stats.map(renderCustomerRow)
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm italic">
              Chưa có dữ liệu thống kê khách hàng.
            </div>
          )}
        </div>
      </section>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-tet-primary to-tet-accent p-6 flex justify-between items-center text-white border-b border-white/10">
              <h2 className="text-xl sm:text-2xl font-bold font-serif flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp size={24} className="text-white" />
                </div>
                Hiệu suất mua hàng chi tiết
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors flex-shrink-0"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex flex-col gap-5 border-b shadow-sm z-10 bg-white">
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Số lượng khách</p>
                    <p className="text-lg font-black text-gray-800 leading-none">{filteredModalStats.length}</p>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-2xl border shadow-sm ${
                    modalAverageSuccessRate >= 80 ? "bg-green-50 border-green-100" :
                    modalAverageSuccessRate >= 50 ? "bg-yellow-50 border-yellow-100" :
                    "bg-red-50 border-red-100"
                  }`}>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Điểm TB hiệu suất</p>
                    <p className={`text-lg font-black leading-none ${
                      modalAverageSuccessRate >= 80 ? "text-green-600" :
                      modalAverageSuccessRate >= 50 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {modalAverageSuccessRate}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium italic bg-gray-50 px-3 py-1.5 rounded-full">
                  <AlertCircle size={14} />
                  Dựa trên tỷ lệ đơn hàng thành công trong kỳ
                </div>
              </div>

              {/* Toolbar: Search and Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:w-64">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên/email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-tet-accent focus:ring-1 focus:ring-tet-accent focus:bg-white transition-all text-sm outline-none font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 rounded-xl sm:w-auto w-full overflow-x-auto">
                  {(["all", "day", "week", "month", "custom"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex-shrink-0 ${
                        filterType === t 
                          ? "bg-white text-tet-primary shadow-sm" 
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                      }`}
                    >
                      {t === "all" ? "Tất cả" : t === "day" ? "Hôm nay" : t === "week" ? "Tuần này" : t === "month" ? "Tháng này" : "Tùy chọn"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Inputs */}
              {filterType === "custom" && (
                <div className="flex flex-wrap items-center gap-3 bg-tet-secondary/10 px-4 py-3 rounded-xl border border-tet-accent/20 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-tet-primary font-medium w-full sm:w-auto">
                    <Calendar size={18} className="text-tet-accent" />
                    <span className="text-sm">Chọn thời gian:</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm w-full sm:w-auto flex-1">
                    <input 
                      type="date"
                      className="border rounded-lg px-3 py-1.5 outline-none text-gray-700 w-full sm:w-auto focus:border-tet-accent transition-colors" 
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                    <span className="text-gray-400 font-medium">→</span>
                    <input 
                      type="date"
                      className="border rounded-lg px-3 py-1.5 outline-none text-gray-700 w-full sm:w-auto focus:border-tet-accent transition-colors" 
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
              <div className="space-y-3">
                {modalLoading ? (
                  <div className="flex flex-col justify-center items-center py-16 gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-tet-secondary border-t-tet-accent"></div>
                    <p className="text-gray-500 text-sm font-medium animate-pulse">Đang tải biểu đồ hiệu suất...</p>
                  </div>
                ) : filteredModalStats.length > 0 ? (
                  filteredModalStats.map(renderCustomerRow)
                ) : (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-xl text-gray-600 font-bold mb-1">Khách hàng chưa mua sản phẩm nhé</p>
                    <p className="text-sm text-gray-400">Hãy thử điều chỉnh lại bộ lọc thời gian hoặc từ khóa tìm kiếm</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerEfficiencyWidget;
