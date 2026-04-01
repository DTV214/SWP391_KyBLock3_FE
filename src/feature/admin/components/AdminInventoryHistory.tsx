import { useState, useMemo } from "react";
import { 
  Search, 
  History, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft,
  PackageSearch 
} from "lucide-react";
import AdminPagination from "./AdminPagination";
import { type Product } from "@/api/productService";

// DTO for Stock Movement based on the backend entity
export interface StockMovementDto {
  stockmovementid: number;
  stockid: number;
  productid: number;
  productName: string;
  orderid?: number | null;
  quantity: number; // Positive for import, negative for export
  movementdate: string;
  note: string;
}

interface AdminInventoryHistoryProps {
  movements: StockMovementDto[];
  products: Product[];
  loading: boolean;
}

export default function AdminInventoryHistory({ movements, products, loading }: AdminInventoryHistoryProps) {
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesSearch = 
        m.productName.toLowerCase().includes(search.toLowerCase()) ||
        (m.note?.toLowerCase() || "").includes(search.toLowerCase()) ||
        m.stockmovementid.toString().includes(search);
      
      const matchesProduct = selectedProductId === "all" || m.productid?.toString() === selectedProductId;
      
      const matchesDate = !dateFilter || m.movementdate.startsWith(dateFilter);

      return matchesSearch && matchesProduct && matchesDate;
    }).sort((a, b) => new Date(b.movementdate).getTime() - new Date(a.movementdate).getTime());
  }, [movements, search, selectedProductId, dateFilter]);

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMovements.slice(start, start + itemsPerPage);
  }, [filteredMovements, currentPage]);

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filters Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo sản phẩm, ghi chú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-tet-accent outline-none text-sm"
            />
          </div>

          {/* Product Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-tet-accent outline-none text-sm appearance-none bg-white"
            >
              <option value="all">Tất cả sản phẩm</option>
              {products.map(p => (
                <option key={p.productid} value={p.productid}>{p.productname}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-tet-accent outline-none text-sm"
            />
          </div>

          <button 
            onClick={() => {
              setSearch("");
              setSelectedProductId("all");
              setDateFilter("");
            }}
            className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm transition-colors border border-gray-100"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden pb-6">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-tet-primary flex items-center gap-2">
            <History size={20} />
            Lịch sử Xuất - Nhập kho
          </h3>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
            {filteredMovements.length} giao dịch
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-tet-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-16 text-center">
            <PackageSearch size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Không tìm thấy lịch sử kho theo bộ lọc.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">ID</th>
                    <th className="px-6 py-4 font-bold">Thời gian</th>
                    <th className="px-6 py-4 font-bold">Sản phẩm</th>
                    <th className="px-6 py-4 font-bold">Loại</th>
                    <th className="px-6 py-4 font-bold text-center">Số lượng</th>
                    <th className="px-6 py-4 font-bold">Ghi chú / Đơn hàng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedMovements.map((m) => (
                    <tr key={m.stockmovementid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-400">#{m.stockmovementid}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-700">
                            {new Date(m.movementdate).toLocaleDateString("vi-VN")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(m.movementdate).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-tet-primary">{m.productName}</span>
                      </td>
                      <td className="px-6 py-4">
                        {m.quantity > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            <ArrowDownLeft size={12} /> Nhập kho
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                            <ArrowUpRight size={12} /> Xuất kho
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-black ${m.quantity > 0 ? "text-green-600" : "text-orange-600"}`}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-600 italic text-xs">{m.note || "Không có ghi chú"}</span>
                          {m.orderid && (
                            <span className="text-xs font-bold text-blue-600 mt-0.5">
                              Đơn hàng: #{m.orderid}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
