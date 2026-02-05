import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Gift,
  Tag,
  Settings,
} from "lucide-react";

export default function AdminOverview() {
  // Mock data - replace with real API calls
  const stats = [
    {
      label: "Tổng doanh thu",
      value: "125,450,000đ",
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign size={24} />,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Đơn hàng",
      value: "234",
      change: "+8.2%",
      trend: "up",
      icon: <ShoppingCart size={24} />,
      color: "from-blue-500 to-cyan-600",
    },
    {
      label: "Sản phẩm",
      value: "156",
      change: "+15",
      trend: "up",
      icon: <Package size={24} />,
      color: "from-purple-500 to-pink-600",
    },
    {
      label: "Khách hàng",
      value: "1,245",
      change: "+5.3%",
      trend: "up",
      icon: <Users size={24} />,
      color: "from-orange-500 to-red-600",
    },
  ];

  const quickActions = [
    { label: "Thêm sản phẩm", icon: <Package size={20} />, path: "/admin/products" },
    { label: "Tạo giỏ mẫu", icon: <Gift size={20} />, path: "/admin/templates" },
    { label: "Thêm danh mục", icon: <Tag size={20} />, path: "/admin/categories" },
    { label: "Tạo cấu hình", icon: <Settings size={20} />, path: "/admin/configs" },
  ];

  const recentOrders = [
    {
      id: "DH001245",
      customer: "Nguyễn Văn A",
      total: "2,450,000đ",
      status: "Đang xử lý",
      statusColor: "bg-blue-100 text-blue-700",
      date: "2 giờ trước",
    },
    {
      id: "DH001244",
      customer: "Trần Thị B",
      total: "1,850,000đ",
      status: "Đã giao",
      statusColor: "bg-green-100 text-green-700",
      date: "5 giờ trước",
    },
    {
      id: "DH001243",
      customer: "Lê Văn C",
      total: "3,200,000đ",
      status: "Đang giao",
      statusColor: "bg-yellow-100 text-yellow-700",
      date: "1 ngày trước",
    },
  ];

  const topProducts = [
    {
      name: "Giỏ Tết Sang Trọng",
      sold: 45,
      revenue: "39,150,000đ",
      image: "https://via.placeholder.com/60",
    },
    {
      name: "Giỏ Tết Truyền Thống",
      sold: 38,
      revenue: "28,500,000đ",
      image: "https://via.placeholder.com/60",
    },
    {
      name: "Giỏ Tết Cao Cấp",
      sold: 32,
      revenue: "35,200,000đ",
      image: "https://via.placeholder.com/60",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-tet-primary to-tet-accent p-8 rounded-3xl shadow-lg text-white">
        <h1 className="text-3xl font-serif font-bold mb-2">
          Chào mừng trở lại, Admin! 👋
        </h1>
        <p className="text-white/90 text-sm">
          Tổng quan hoạt động kinh doanh hôm nay
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}
              >
                {stat.icon}
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                  stat.trend === "up"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUp size={12} />
                ) : (
                  <ArrowDown size={12} />
                )}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-tet-primary mb-1">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-serif font-bold text-tet-primary mb-4">
          Thao tác nhanh
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-tet-accent hover:bg-tet-secondary/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-tet-secondary flex items-center justify-center text-tet-accent group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <span className="text-xs font-bold text-tet-primary">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-serif font-bold text-tet-primary">
              Đơn hàng gần đây
            </h3>
            <button className="text-tet-accent text-sm font-bold hover:underline">
              Xem tất cả
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm text-tet-primary">
                    {order.id}
                  </p>
                  <p className="text-xs text-gray-500">{order.customer}</p>
                  <p className="text-xs text-gray-400 mt-1">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-tet-accent">
                    {order.total}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold mt-1 ${order.statusColor}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Products */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-serif font-bold text-tet-primary">
              Sản phẩm bán chạy
            </h3>
            <TrendingUp className="text-tet-accent" size={20} />
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-tet-primary truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Đã bán: {product.sold} sản phẩm
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-tet-accent">
                    {product.revenue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* System Status */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-3xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-tet-primary mb-2">
              Trạng thái hệ thống
            </h3>
            <p className="text-sm text-gray-600">
              Tất cả dịch vụ đang hoạt động bình thường
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
