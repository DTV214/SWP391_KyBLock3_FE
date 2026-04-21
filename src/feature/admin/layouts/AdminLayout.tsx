import { Outlet, Link, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { ChevronRight } from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();
  const isOverviewPage = location.pathname.includes("/admin/overview");
  const shellClassName = isOverviewPage
    ? "max-w-[1740px]"
    : "max-w-[1560px]";

  const getBreadcrumbName = (path: string) => {
    if (path.includes("overview")) return "Tổng quan";
    if (path.includes("accounts")) return "Quản lý tài khoản";
    if (path.includes("store-locations")) return "Quản lý cửa hàng";
    if (path.includes("products")) return "Quản lý sản phẩm";
    if (path.includes("inventory")) return "Quản lý kho hàng";
    if (path.includes("categories")) return "Quản lý danh mục";
    if (path.includes("configs")) return "Quản lý cấu hình";
    if (path.includes("templates")) return "Quản lý giỏ mẫu";
    if (path.includes("blogs")) return "Quản lý bài viết";
    if (path.includes("quotations")) return "Quotations";
    if (path.includes("orders")) return "Quản lý đơn hàng";
    if (path.includes("contacts")) return "Yêu cầu liên hệ"; // <-- ĐÃ THÊM DÒNG NÀY
    if (path.includes("chats")) return "Chat khách hàng";
    return "Quản trị";
  };

  return (
    <div className="min-h-screen bg-[#FBF5E8]/30 pb-16 lg:pb-20">
      <div className={`mx-auto w-full ${shellClassName} px-4 md:px-6 xl:px-8 2xl:px-10`}>
        <div className="pt-4 md:pt-6">
          <AdminHeader />
        </div>

        <nav className="flex items-center gap-2 px-1 py-4 text-sm font-medium text-gray-400 md:py-5">
          <Link to="/home" className="hover:text-tet-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-400">Admin</span>
          <ChevronRight size={14} />
          <span className="text-tet-primary font-bold">
            {getBreadcrumbName(location.pathname)}
          </span>
        </nav>

        <div className="flex min-w-0 flex-col items-start gap-6 lg:flex-row xl:gap-8 2xl:gap-10">
          <div className="w-full lg:w-[17.5rem] lg:min-w-[17.5rem] lg:max-w-[17.5rem] lg:shrink-0 lg:flex-none xl:w-[18rem] xl:min-w-[18rem] xl:max-w-[18rem]">
            <div className="lg:sticky lg:top-[9.35rem]">
              <AdminSidebar />
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
