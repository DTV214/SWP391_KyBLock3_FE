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
    <header className="relative overflow-hidden rounded-[1.9rem] border border-[#c9a46a]/25 bg-gradient-to-r from-[#561107] via-[#7f2318] to-[#b14a2f] p-5 text-[#fff8ef] shadow-[0_24px_60px_-36px_rgba(122,22,14,0.42)] md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left_top,rgba(255,241,214,0.22),transparent_34%),radial-gradient(circle_at_78%_22%,rgba(255,214,120,0.18),transparent_28%),linear-gradient(118deg,transparent_0%,rgba(255,255,255,0.08)_48%,transparent_74%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,241,214,0.24),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-[12%] bottom-0 h-px bg-gradient-to-r from-transparent via-[#f6d7a0]/55 to-transparent" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f3d7ab]/35 bg-[#fff6ea]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#fff1d6]">
            <ShieldCheck size={14} />
            Khu vực Admin
          </div>
          <h1 className="text-[1.65rem] font-bold leading-tight text-white md:text-[1.9rem]">
            {getPageTitle(location.pathname)}
          </h1>
        </div>

        <Link
          to="/home"
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#f3d7ab]/35 bg-[#fff8ef]/12 px-4 py-2.5 text-sm font-semibold text-[#fff6ea] transition-all duration-300 hover:border-[#f5ddb4]/50 hover:bg-[#fff8ef]/18"
        >
          <Home size={16} />
          Về trang chủ
        </Link>
      </div>
    </header>
  );
}
