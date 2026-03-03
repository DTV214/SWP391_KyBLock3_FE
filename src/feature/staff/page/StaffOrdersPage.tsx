import {  Search, Eye } from "lucide-react";

const MOCK_ORDERS = [
  {
    id: "ORD-2026-001",
    customer: "Nguyễn Văn A",
    date: "03/03/2026",
    status: "Đang giao",
    total: 4500000,
  },
  {
    id: "ORD-2026-002",
    customer: "Trần Thị B",
    date: "02/03/2026",
    status: "Chờ xác nhận",
    total: 1250000,
  },
  {
    id: "ORD-2026-003",
    customer: "Lê Văn C",
    date: "01/03/2026",
    status: "Hoàn thành",
    total: 8900000,
  },
];

export default function StaffOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#7a160e]">
            Đơn hàng phụ trách
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và theo dõi tiến độ giao hàng cho khách.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm mã đơn..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-[#d77a45] focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="p-4 font-semibold">Mã đơn</th>
              <th className="p-4 font-semibold">Khách hàng</th>
              <th className="p-4 font-semibold">Ngày đặt</th>
              <th className="p-4 font-semibold">Tổng tiền</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_ORDERS.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-[#7a160e]">{order.id}</td>
                <td className="p-4 font-medium text-gray-800">
                  {order.customer}
                </td>
                <td className="p-4 text-gray-500">{order.date}</td>
                <td className="p-4 font-semibold text-gray-800">
                  {order.total.toLocaleString("vi-VN")}đ
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === "Hoàn thành"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Đang giao"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
