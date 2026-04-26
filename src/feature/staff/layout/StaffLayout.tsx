import { Outlet, Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import StaffSidebar from "../components/StaffSidebar";

export default function StaffLayout() {
  const location = useLocation();

  const getBreadcrumbName = (path: string) => {
    if (path.includes("dashboard")) return "Tổng quan";
    if (path.includes("quotations")) return "Xử lý báo giá";
    if (path.includes("chats")) return "Chat khách hàng";
    if (path.includes("orders")) return "Quản lý đơn hàng";
    if (path.includes("contacts")) return "Yêu cầu liên hệ";
    return "Cổng nhân viên";
  };

  return (
    <div className="min-h-screen bg-[#FBF5E8]/30 pb-16 lg:pb-20">
      <div className="mx-auto w-full max-w-[1560px] px-4 md:px-6 xl:px-8 2xl:px-10">
        <nav className="flex items-center gap-2 px-1 py-4 text-sm font-medium text-gray-400 md:py-5">
          <Link to="/home" className="hover:text-tet-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-400">Nhân viên</span>
          <ChevronRight size={14} />
          <span className="font-bold text-tet-primary">
            {getBreadcrumbName(location.pathname)}
          </span>
        </nav>

        <div className="flex min-w-0 flex-col items-start gap-6 lg:flex-row xl:gap-8 2xl:gap-10">
          <div className="w-full lg:w-[17.5rem] lg:min-w-[17.5rem] lg:max-w-[17.5rem] lg:shrink-0 lg:flex-none xl:w-[18rem] xl:min-w-[18rem] xl:max-w-[18rem]">
            <div className="lg:sticky lg:top-5">
              <StaffSidebar />
            </div>
          </div>

          <div className="w-full min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
