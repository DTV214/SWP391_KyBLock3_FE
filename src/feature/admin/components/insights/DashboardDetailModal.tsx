import React from "react";
import { X, Search, User, Package, AlertCircle } from "lucide-react";
import type { CustomerOrderStatistics, HighlightProduct } from "../../services/adminDashboardService";

export type DetailType = "VIP" | "FREQUENT" | "CANCELER" | "BEST_SELLER" | "WORST_SELLER" | "ABANDONED";

interface DashboardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: DetailType;
  title: string;
  data: any[];
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export const DashboardDetailModal: React.FC<DashboardDetailModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  data,
  loading = false,
}) => {
  if (!isOpen) return null;

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-tet-secondary border-t-tet-accent"></div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">Đang tải danh sách Top 10...</p>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Search size={48} strokeWidth={1.5} opacity={0.5} />
          <p className="text-sm font-medium">Không tìm thấy dữ liệu phù hợp.</p>
        </div>
      );
    }

    const isCustomer = ["VIP", "FREQUENT", "CANCELER"].includes(type);
    const isProduct = ["BEST_SELLER", "WORST_SELLER"].includes(type);
    const isAbandoned = type === "ABANDONED";

    return (
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white mt-4">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-16">TOP</th>
              {isCustomer && (
                <>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Khách hàng</th>
                  {type === "VIP" && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Tổng chi tiêu</th>}
                  {type === "FREQUENT" && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Số đơn hàng</th>}
                  {type === "CANCELER" && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Đơn đã hủy</th>}
                </>
              )}
              {isProduct && (
                <>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Sản phẩm</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Số lượng bán</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Tổng doanh thu</th>
                </>
              )}
              {isAbandoned && (
                <>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">ID Giỏ hàng</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Số sản phẩm</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Giá trị tạm tính</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.slice(0, 10).map((item, index) => {
              const rank = index + 1;
              const rankColor = rank === 1 ? "bg-amber-100 text-amber-600" : rank === 2 ? "bg-gray-100 text-gray-600" : rank === 3 ? "bg-orange-100 text-orange-600" : "bg-gray-50 text-gray-400";

              return (
                <tr key={`detail-row-${index}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${rankColor}`}>
                      {rank}
                    </div>
                  </td>
                  
                  {isCustomer && (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-tet-secondary/20 flex items-center justify-center text-tet-primary text-xs font-bold">
                            {(item as CustomerOrderStatistics).fullName?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{(item as CustomerOrderStatistics).fullName || "N/A"}</p>
                            <p className="text-[10px] text-gray-400">{(item as CustomerOrderStatistics).email || "Không có email"}</p>
                          </div>
                        </div>
                      </td>
                      {type === "VIP" && <td className="px-6 py-4 text-sm font-black text-rose-600 text-right">{formatCurrency((item as CustomerOrderStatistics).totalSpentAllTime)}</td>}
                      {type === "FREQUENT" && <td className="px-6 py-4 text-sm font-black text-blue-600 text-right">{(item as CustomerOrderStatistics).totalOrders} đơn</td>}
                      {type === "CANCELER" && <td className="px-6 py-4 text-sm font-black text-red-600 text-right">{(item as CustomerOrderStatistics).cancelledOrders} đơn</td>}
                    </>
                  )}

                  {isProduct && (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {(item as HighlightProduct).imageUrl ? (
                              <img src={(item as HighlightProduct).imageUrl!} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package size={14} className="text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-800">{(item as HighlightProduct).productName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-tet-primary text-right">{(item as HighlightProduct).totalQuantity}</td>
                      <td className="px-6 py-4 text-sm font-black text-emerald-600 text-right">{formatCurrency((item as HighlightProduct).totalRevenue)}</td>
                    </>
                  )}

                  {isAbandoned && (
                    <>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                          #{(item as any).cartId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-amber-600">{(item as any).itemCount}</td>
                      <td className="px-6 py-4 text-sm font-black text-gray-800 text-right">{formatCurrency((item as any).totalValue)}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-tet-primary/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 flex items-start justify-between bg-gradient-to-r from-gray-50 to-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-tet-primary text-white rounded-2xl shadow-lg shadow-tet-primary/20">
                {["VIP", "FREQUENT", "CANCELER"].includes(type) ? <User size={20} /> : <Package size={20} />}
              </div>
              <h2 className="text-2xl font-serif font-bold text-tet-primary">{title}</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium">Top 10 dữ liệu được cập nhật mới nhất cho quản trị viên</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-0">
          {renderTable()}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <AlertCircle size={12} />
            Dữ liệu thống kê nội bộ
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-tet-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-tet-primary/20 hover:opacity-95 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
