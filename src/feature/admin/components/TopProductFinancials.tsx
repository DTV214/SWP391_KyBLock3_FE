import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  ShoppingCart, 
  Loader2, 
  Calendar,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Search
} from "lucide-react";
import adminDashboardService, { type HighlightProduct } from "../services/adminDashboardService";

interface TopProductFinancialsProps {
  initialProducts?: HighlightProduct[];
}

type Period = "day" | "week" | "month" | "custom";
type SortKey = keyof HighlightProduct;
type SortDirection = "asc" | "desc";

export default function TopProductFinancials({ initialProducts = [] }: TopProductFinancialsProps) {
  const [products, setProducts] = useState<HighlightProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Refs để lưu giá trị hiện tại mà không trigger re-render
  const startDateRef = useRef("");
  const endDateRef = useRef("");
  const periodRef = useRef<Period>("month");
  const isFirstMount = useRef(true);
  const isFetching = useRef(false);

  // Giữ refs đồng bộ với state
  startDateRef.current = startDate;
  endDateRef.current = endDate;
  periodRef.current = period;

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "totalRevenue",
    direction: "desc",
  });

  const formatMoney = (value: number) =>
    `${Math.trunc(Number(value) || 0).toLocaleString("vi-VN")} đ`;

  // Hàm fetch nhận thẳng tham số — không phụ thuộc vào closure state
  const fetchProducts = async (p: string, sDate?: string, eDate?: string) => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      setLoading(true);
      const summary = await adminDashboardService.getDashboardSummary(p, sDate, eDate);
      setProducts(summary.topProducts || []);
    } catch (err) {
      console.error("Failed to fetch top products financials:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  // Nút Search bấm thủ công cho custom range
  const handleApplyCustomFilter = () => {
    const sDate = startDateRef.current;
    const eDate = endDateRef.current;
    if (!sDate || !eDate) return;
    fetchProducts("day", sDate, eDate);
  };

  // Tự động fetch khi đổi period (chỉ cho các period không phải custom)
  useEffect(() => {
    // Lần mount đầu tiên cũng fetch để đảm bảo dữ liệu đúng khoảng thời gian
    // (initialProducts có thể là dữ liệu không có filter thời gian)
    if (isFirstMount.current) {
      isFirstMount.current = false;
      // Vẫn tiếp tục xuống dưới để fetch đúng period
    }

    if (period === "custom") return; // Custom: đợi user bấm nút Search

    // Map period sang params API — LUÔN truyền startDate/endDate
    const today = new Date().toISOString().split("T")[0];
    if (period === "day") {
      // Hôm nay: startDate = endDate = ngày hôm nay
      fetchProducts("day", today, today);
    } else if (period === "week") {
      // 7 ngày gần nhất
      const start = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
      fetchProducts("day", start, today);
    } else if (period === "month") {
      // 30 ngày gần nhất
      const start = new Date(Date.now() - 29 * 86400000).toISOString().split("T")[0];
      fetchProducts("day", start, today);
    }
  // Chỉ re-run khi period đổi — KHÔNG đưa fetchProducts vào deps để tránh vòng lặp
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const sortedProducts = useMemo(() => {
    const sortableItems = [...products];
    return sortableItems.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      if (aString < bString) return sortConfig.direction === "asc" ? -1 : 1;
      if (aString > bString) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return sortConfig.direction === "asc" ? 
      <ChevronUp size={12} className="ml-1 text-indigo-600" /> : 
      <ChevronDown size={12} className="ml-1 text-indigo-600" />;
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm overflow-hidden flex flex-col gap-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Title Section */}
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-600 shadow-sm transition-transform hover:scale-105">
            <TrendingUp size={22} />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-tet-primary">
              Hiệu quả kinh doanh Top Sản phẩm
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Phân tích chi tiết doanh thu và lợi nhuận của các sản phẩm bán chạy nhất.
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Calendar size={14} className="text-gray-300" />
            <span>Khoảng thời gian:</span>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
            {period === "custom" && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-1.5 rounded-xl mr-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-gray-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-gray-300">|</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-gray-600 focus:ring-0 cursor-pointer"
                />
                <button
                  onClick={handleApplyCustomFilter}
                  disabled={!startDate || !endDate || loading}
                  className="ml-1 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:hover:bg-indigo-600"
                  title="Áp dụng bộ lọc ngày"
                >
                  <Search size={14} />
                </button>
              </div>
            )}
            
            <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              {(["day", "week", "month", "custom"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                    period === p
                      ? "bg-white text-tet-primary shadow-sm scale-100"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                  }`}
                >
                  {p === "day" ? "Hôm nay" : p === "week" ? "7 Ngày" : p === "month" ? "30 Ngày" : "Khung thời gian"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="relative overflow-x-auto -mx-6">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px] transition-all">
            <div className="flex flex-col items-center gap-3">
               <Loader2 className="animate-spin text-indigo-600" size={32} />
               <span className="text-xs font-bold text-indigo-600 animate-pulse">Đang cập nhật...</span>
            </div>
          </div>
        )}
        
        <div className="inline-block min-w-full align-middle px-6">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-16">STT</th>
                <th 
                  className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("productName")}
                >
                  <div className="flex items-center">Sản phẩm <SortIcon columnKey="productName" /></div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center justify-end">Giá bán <SortIcon columnKey="price" /></div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("importPrice")}
                >
                  <div className="flex items-center justify-end">Giá nhập <SortIcon columnKey="importPrice" /></div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("totalRevenue")}
                >
                  <div className="flex items-center justify-end">Doanh thu <SortIcon columnKey="totalRevenue" /></div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("totalProfit")}
                >
                  <div className="flex items-center justify-end">Lợi nhuận <SortIcon columnKey="totalProfit" /></div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("totalQuantity")}
                >
                  <div className="flex items-center justify-end">Đã bán <SortIcon columnKey="totalQuantity" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((product, index) => (
                  <tr key={product.productId} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-[11px] font-black text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-100 shadow-sm group-hover:border-indigo-200 transition-colors">
                            <img 
                              src={product.imageUrl} 
                              alt={product.productName} 
                              className="h-full w-full object-cover transition-transform group-hover:scale-110"
                              onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/40?text=P"; }}
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
                            <Package size={18} />
                          </div>
                        )}
                        <span className="text-sm font-bold text-gray-700 truncate max-w-[180px]" title={product.productName}>
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-tet-accent">
                        {formatMoney(product.price)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-medium">
                      {formatMoney(product.importPrice)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-black text-emerald-700">
                        {formatMoney(product.totalRevenue)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-black text-amber-700">
                        {formatMoney(product.totalProfit)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm font-black text-blue-700">
                          {product.totalQuantity.toLocaleString("vi-VN")}
                        </span>
                        <ShoppingCart size={14} className="text-blue-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Package size={40} className="opacity-20 animate-bounce" />
                      <p className="text-sm font-medium">Không tìm thấy dữ liệu trong khoảng thời gian này</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stats summary */}
      {sortedProducts.length > 0 && (
        <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-gray-50/50 border border-gray-100 shadow-inner">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <DollarSign size={10} /> Tổng doanh thu Top 10
            </p>
            <p className="text-lg font-black text-emerald-700 leading-none">
              {formatMoney(sortedProducts.reduce((sum, p) => sum + p.totalRevenue, 0))}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <Wallet size={10} /> Tổng lợi nhuận Top 10
            </p>
            <p className="text-lg font-black text-amber-700 leading-none">
              {formatMoney(sortedProducts.reduce((sum, p) => sum + p.totalProfit, 0))}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <ShoppingCart size={10} /> Tổng số lượng bán
            </p>
            <p className="text-lg font-black text-blue-700 leading-none">
              {sortedProducts.reduce((sum, p) => sum + p.totalQuantity, 0).toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <Package size={10} /> Sản phẩm tốt nhất
            </p>
            <p className="text-sm font-bold text-tet-primary truncate leading-none pt-1">
              {sortedProducts[0]?.productName || "-"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
