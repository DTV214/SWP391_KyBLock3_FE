import React from "react";
import { UserX, ShoppingBag, Moon, Mail, Phone, ExternalLink } from "lucide-react";
import type { DashboardHighlights } from "../../services/adminDashboardService";

interface CustomerCareInsightsProps {
  data: DashboardHighlights;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export const CustomerCareInsights: React.FC<CustomerCareInsightsProps> = ({ data }) => {
  const inactiveCustomers = data.inactiveCustomers || [];
  
  return (
    <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm xl:p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-serif font-bold text-tet-primary flex items-center gap-2">
          <span className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
            <UserX size={18} />
          </span>
          Insight Chăm sóc khách hàng
        </h2>
        <button className="text-xs font-bold text-tet-accent hover:underline flex items-center gap-1">
          Xem tất cả <ExternalLink size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Top Canceler */}
        <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <UserX size={16} className="text-rose-500" />
            <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider">Hay hủy đơn nhất</h3>
          </div>
          
          {data.topCanceler ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold border border-rose-200">
                  {data.topCanceler.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">{data.topCanceler.fullName}</p>
                  <p className="text-xs text-rose-600 font-black">Hủy {data.topCanceler.totalValue} đơn hàng</p>
                </div>
              </div>
              
              <div className="mt-auto flex gap-2">
                <a 
                  href={`mailto:${data.topCanceler.email}`}
                  className="flex-1 py-2 bg-white border border-rose-200 rounded-xl text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Mail size={12} /> Email
                </a>
                <button 
                  className="flex-1 py-2 bg-rose-600 rounded-xl text-[10px] font-bold text-white hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5"
                  onClick={() => alert(`Gọi khách hàng: ${data.topCanceler?.fullName}`)}
                >
                  <Phone size={12} /> Gọi ngay
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Chưa có dữ liệu hủy đơn.</p>
          )}
        </div>

        {/* Column 2: Abandoned Carts */}
        <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Giỏ hàng bị bỏ</h3>
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <p className="text-2xl font-black text-amber-700">{data.abandonedCartValue?.cartCount ?? 0}</p>
              <p className="text-xs text-amber-600 font-medium">Giỏ hàng chưa thanh toán</p>
            </div>
            
            <div className="bg-white/60 rounded-xl p-3 border border-amber-100 mb-4">
              <p className="text-[10px] uppercase text-amber-600 font-bold mb-1">Thất thoát ước tính</p>
              <p className="text-sm font-black text-gray-800">{formatCurrency(data.abandonedCartValue?.totalLostValue ?? 0)}</p>
            </div>
            
            <button className="mt-auto w-full py-2 bg-amber-600 rounded-xl text-[10px] font-bold text-white hover:bg-amber-700 transition-colors">
              Gửi email nhắc nhở hàng loạt
            </button>
          </div>
        </div>

        {/* Column 3: Inactive Customers */}
        <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <Moon size={16} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider">Đã lâu chưa mua lại</h3>
          </div>
          
          <div className="flex-1 flex flex-col">
            {inactiveCustomers.length > 0 ? (
              <>
                <p className="text-2xl font-black text-indigo-700">{inactiveCustomers.length}</p>
                <p className="text-xs text-indigo-600 font-medium mb-4">Khách hàng im lặng ({">"} 7 ngày)</p>
                
                <div className="space-y-2 mb-4">
                  {inactiveCustomers.slice(0, 2).map((customer, index) => (
                    <div key={`${customer.accountId}-${index}`} className="flex items-center justify-between text-[11px] bg-white/60 p-2 rounded-lg border border-indigo-100">
                      <span className="font-bold text-gray-700 truncate max-w-[100px]">{customer.fullName}</span>
                      <span className="text-indigo-600 font-black">{customer.daysSinceLastOrder} ngày</span>
                    </div>
                  ))}
                  {inactiveCustomers.length > 2 && (
                    <p className="text-[10px] text-center text-indigo-400">và {inactiveCustomers.length - 2} khách hàng khác...</p>
                  )}
                </div>
                
                <button className="mt-auto w-full py-2 bg-indigo-600 rounded-xl text-[10px] font-bold text-white hover:bg-indigo-700 transition-colors">
                  Tạo chiến dịch Remarketing
                </button>
              </>
            ) : (
              <p className="text-xs text-gray-400 italic">Tất cả khách hàng đều đang tương tác tốt!</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-tet-accent animate-pulse"></div>
        <p className="text-[11px] text-gray-500 italic">
          💡 Mẹo: CS nên ưu tiên liên hệ khách hàng trong nhóm "Hay hủy đơn" để xây dựng lòng tin và hiểu rõ vấn đề của họ.
        </p>
      </div>
    </section>
  );
};
