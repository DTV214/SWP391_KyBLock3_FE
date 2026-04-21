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
    <header className="relative overflow-hidden rounded-[1.9rem] border border-slate-700/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-[0_24px_60px_-38px_rgba(15,23,42,0.8)] backdrop-blur supports-[backdrop-filter]:bg-slate-900/90 md:p-6">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_62%)]" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck size={14} />
            Khu vực Admin
          </div>
          <h1 className="text-[1.65rem] font-bold leading-tight md:text-[1.9rem]">
            {getPageTitle(location.pathname)}
          </h1>
        </div>

        <Link
          to="/home"
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/20"
        >
          <Home size={16} />
          Về trang chủ
        </Link>
      </div>
    </header>
  );
}
