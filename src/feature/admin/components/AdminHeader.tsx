import { Home, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const getPageTitle = (path: string) => {
  if (path.includes("overview")) return "Tổng quan";
  if (path.includes("accounts")) return "Quản lý tài khoản";
  if (path.includes("store-locations")) return "Quản lý cửa hàng";
  if (path.includes("products")) return "Quản lý sản phẩm";
  if (path.includes("inventory")) return "Quản lý kho hàng";
  if (path.includes("categories")) return "Quản lý danh mục";
  if (path.includes("configs")) return "Quản lý cấu hình";
  if (path.includes("templates")) return "Quản lý giỏ mẫu";
  if (path.includes("promotions")) return "Quản lý khuyến mãi";
  if (path.includes("blogs")) return "Quản lý bài viết";
  if (path.includes("quotations")) return "Quản lý báo giá";
  if (path.includes("orders")) return "Quản lý đơn hàng";
  if (path.includes("contacts")) return "Yêu cầu liên hệ";
  if (path.includes("chats")) return "Chat khách hàng";
  return "Bảng điều khiển quản trị";
};

export default function AdminHeader() {
  const location = useLocation();

  return (
    <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck size={14} />
            Khu vực Admin
          </div>
          <h1 className="text-xl font-bold md:text-2xl">{getPageTitle(location.pathname)}</h1>
        </div>

        <Link
          to="/home"
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/20"
        >
          <Home size={16} />
          Về trang chủ
        </Link>
      </div>
    </header>
  );
}