import { Outlet, Link, useLocation } from "react-router-dom";
import AccountSidebar from "../components/AccountSidebar";
import { ChevronRight } from "lucide-react";

export default function AccountLayout() {
  const location = useLocation();

  // Logic chuyển đổi tên Breadcrumb dựa trên URL
  const getBreadcrumbName = (path: string) => {
    if (path.includes("overview")) return "Hồ sơ";
    if (path.includes("profile")) return "Thông tin cá nhân";
    if (path.includes("orders")) return "Lịch sử đơn hàng";
    if (path.includes("addresses")) return "Địa chỉ";
    if (path.includes("vouchers")) return "Voucher";
    if (path.includes("baskets")) return "Giỏ quà của tôi";
    return "Tài khoản";
  };

  return (
    <div className="bg-[#FBF5E8]/30 min-h-screen pb-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* 1. BREADCRUMB */}
        <nav className="flex items-center gap-2 py-6 text-sm font-medium text-gray-400">
          <Link to="/home" className="hover:text-tet-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-400">Tài khoản</span>
          <ChevronRight size={14} />
          <span className="text-tet-primary font-bold">
            {getBreadcrumbName(location.pathname)}
          </span>
        </nav>

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar cố định bên trái */}
          <div className="w-full lg:w-64 sticky top-28">
            <AccountSidebar />
          </div>

          {/* Nội dung thay đổi bên phải (Outlet) */}
          <div className="flex-1 w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
