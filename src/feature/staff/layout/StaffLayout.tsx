import { Outlet, Link, useLocation } from "react-router-dom";
import StaffSidebar from "../components/StaffSidebar";
import { ChevronRight } from "lucide-react";

export default function StaffLayout() {
  const location = useLocation();

  const getBreadcrumbName = (path: string) => {
    if (path.includes("dashboard")) return "Tổng quan";
    if (path.includes("quotations")) return "Xử lý Báo giá";
    if (path.includes("orders")) return "Quản lý đơn hàng";
    return "Cổng nhân viên";
  };

  return (
    <div className="bg-[#FBF5E8]/30 min-h-screen pb-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <nav className="flex items-center gap-2 py-6 text-sm font-medium text-gray-400">
          <Link to="/home" className="hover:text-[#7a160e] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-400">Nhân viên</span>
          <ChevronRight size={14} />
          <span className="text-[#7a160e] font-bold">
            {getBreadcrumbName(location.pathname)}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-64 sticky top-28">
            <StaffSidebar />
          </div>

          <div className="flex-1 w-full">
            {/* Nội dung các trang con (Dashboard, Quotations) sẽ được render tại đây */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
