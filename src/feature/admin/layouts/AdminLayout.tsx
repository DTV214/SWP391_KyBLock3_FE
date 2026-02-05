import { Outlet, Link, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { ChevronRight } from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();

  // Logic chuyển đổi tên Breadcrumb dựa trên URL
  const getBreadcrumbName = (path: string) => {
    if (path.includes("overview")) return "Tổng quan";
    if (path.includes("products")) return "Quản lý sản phẩm";
    if (path.includes("categories")) return "Quản lý danh mục";
    if (path.includes("configs")) return "Quản lý cấu hình";
    if (path.includes("templates")) return "Quản lý giỏ mẫu";
    if (path.includes("orders")) return "Quản lý đơn hàng";
    if (path.includes("customers")) return "Quản lý khách hàng";
    return "Quản trị";
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
          <span className="text-gray-400">Admin</span>
          <ChevronRight size={14} />
          <span className="text-tet-primary font-bold">
            {getBreadcrumbName(location.pathname)}
          </span>
        </nav>

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar cố định bên trái */}
          <div className="w-full lg:w-64 sticky top-28">
            <AdminSidebar />
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
