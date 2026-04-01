import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  Search,
  RefreshCw,
  Settings2,
  PackageSearch,
  Package,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Archive,
  Info,
  History,
} from "lucide-react";
import {
  inventoryAdminService,
  type LowStockReportDto,
  type StockDto,
  type CreateStockRequest,
  type UpdateStockRequest,
  type StockMovementDto,
} from "@/api/inventoryAdminService";
import { productService, type Product } from "@/api/productService";
import AdminPagination from "../components/AdminPagination";
import AdminInventoryHistory from "../components/AdminInventoryHistory";

type TabType = "ALERTS" | "STOCKS" | "HISTORY";

export default function AdminInventory() {
  // --- General States ---
  const [activeTab, setActiveTab] = useState<TabType>("ALERTS");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Product List (For Lookup) ---
  const [products, setProducts] = useState<Product[]>([]);

  // --- Alerts Tab States ---
  const [lowStockData, setLowStockData] = useState<LowStockReportDto[]>([]);
  const [threshold, setThreshold] = useState<number>(10);
  const [alertSearch, setAlertSearch] = useState<string>("");

  // --- Stocks Tab States ---
  const [stocksData, setStocksData] = useState<StockDto[]>([]);
  const [stockSearch, setStockSearch] = useState<string>("");

  // --- History Tab States ---
  const [movementsData, setMovementsData] = useState<StockMovementDto[]>([]);

  // --- Pagination States ---
  const [alertsPage, setAlertsPage] = useState<number>(1);
  const [stocksPage, setStocksPage] = useState<number>(1);
  const itemsPerPage = 10;

  // --- Modal States (For Stocks) ---
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingStock, setEditingStock] = useState<StockDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    productId: 0,
    quantity: 0,
    productionDate: "",
    expiryDate: "",
  });

  // --- Fetching Logic ---
  const fetchProductsList = useCallback(async () => {
    try {
      const res = await productService.getAll();
      const responseData = res as unknown as {
        data?: { data?: Product[] } | Product[];
      };
      let productList: Product[] = [];

      if (Array.isArray(responseData.data)) {
        productList = responseData.data;
      } else if (responseData.data && Array.isArray(responseData.data.data)) {
        productList = responseData.data.data;
      }

      setProducts(productList);
    } catch (err: unknown) {
      console.error("Lỗi khi tải danh sách sản phẩm lookup:", err);
    }
  }, []);

  const fetchLowStock = useCallback(async (currentThreshold: number) => {
    try {
      setLoading(true);
      setError(null);
      const data =
        await inventoryAdminService.getLowStockReport(currentThreshold);
      setLowStockData(data);
    } catch (err: unknown) {
      setError("Không thể tải báo cáo tồn kho lúc này.");
      console.error("Error fetching low stock report:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAdminService.getAllStocks();
      setStocksData(data);
    } catch (err: unknown) {
      setError("Không thể tải danh sách lô hàng.");
      console.error("Error fetching stocks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAdminService.getAllMovements();
      setMovementsData(data);
    } catch (err: unknown) {
      setError("Không thể tải lịch sử kho.");
      console.error("Error fetching movements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Init Data
  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  // Effect trigger based on active tab
  useEffect(() => {
    if (activeTab === "ALERTS") {
      fetchLowStock(threshold);
    } else if (activeTab === "STOCKS") {
      fetchStocks();
    } else if (activeTab === "HISTORY") {
      fetchMovements();
    }
  }, [activeTab, fetchLowStock, fetchStocks, fetchMovements, threshold]);

  // --- CRUD Handlers for Stocks ---
  const handleOpenModal = (stock?: StockDto) => {
    if (stock) {
      setEditingStock(stock);
      setFormData({
        productId: stock.productId,
        quantity: stock.quantity,
        productionDate: stock.productionDate
          ? stock.productionDate.substring(0, 10)
          : "",
        expiryDate: stock.expiryDate ? stock.expiryDate.substring(0, 10) : "",
      });
    } else {
      setEditingStock(null);
      setFormData({
        productId: 0,
        quantity: 0,
        productionDate: "",
        expiryDate: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStock(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.productId <= 0 ||
      formData.quantity < 0 ||
      !formData.productionDate ||
      !formData.expiryDate
    ) {
      setError("Vui lòng điền đầy đủ và chính xác thông tin lô hàng.");
      return;
    }

    const prodDate = new Date(formData.productionDate);
    const expDate = new Date(formData.expiryDate);

    // Validate logic thời gian cơ bản (NSX không được sau HSD)
    prodDate.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    if (prodDate > expDate) {
      setError("Ngày sản xuất (NSX) không được lớn hơn Hạn sử dụng (HSD).");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Gửi Payload gọn gàng, BE sẽ tự xử lý Status
      if (editingStock) {
        const updatePayload: UpdateStockRequest = {
          quantity: formData.quantity,
          productionDate: new Date(formData.productionDate).toISOString(),
          expiryDate: new Date(formData.expiryDate).toISOString(),
          status: "ACTIVE", // Truyền chuỗi mặc định, BE tự động ghi đè
        };
        await inventoryAdminService.updateStock(
          editingStock.stockId,
          updatePayload,
        );
      } else {
        const createPayload: CreateStockRequest = {
          productId: formData.productId,
          quantity: formData.quantity,
          productionDate: new Date(formData.productionDate).toISOString(),
          expiryDate: new Date(formData.expiryDate).toISOString(),
        };
        await inventoryAdminService.createStock(createPayload);
      }

      handleCloseModal();
      await fetchStocks();
    } catch (err: unknown) {
      setError("Có lỗi xảy ra khi lưu lô hàng.");
      console.error("Error saving stock:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa lô hàng này? Dữ liệu tồn kho sẽ bị ảnh hưởng!",
      )
    )
      return;
    try {
      setLoading(true);
      await inventoryAdminService.deleteStock(id);
      await fetchStocks();

      if (paginatedStocks.length === 1 && stocksPage > 1) {
        setStocksPage(stocksPage - 1);
      }
    } catch (err: unknown) {
      alert("Không thể xóa lô hàng này.");
      console.error("Error deleting stock:", err);
      setLoading(false);
    }
  };

  // --- Derived Data & Pagination Logic ---

  // 1. Alerts Logic (Đã fix logic BE trả về "Low")
  const filteredAlerts = lowStockData.filter(
    (item) =>
      item.productName?.toLowerCase().includes(alertSearch.toLowerCase()) ||
      item.sku?.toLowerCase().includes(alertSearch.toLowerCase()),
  );

  useEffect(() => setAlertsPage(1), [alertSearch]);

  const totalAlertsPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const paginatedAlerts = filteredAlerts.slice(
    (alertsPage - 1) * itemsPerPage,
    alertsPage * itemsPerPage,
  );

  // 2. Stocks Logic
  const filteredStocks = stocksData.filter(
    (item) =>
      item.productName?.toLowerCase().includes(stockSearch.toLowerCase()) ||
      item.stockId.toString().includes(stockSearch),
  );

  useEffect(() => setStocksPage(1), [stockSearch]);

  const totalStocksPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const paginatedStocks = filteredStocks.slice(
    (stocksPage - 1) * itemsPerPage,
    stocksPage * itemsPerPage,
  );

  // Stats (Đã fix logic đọc biến "Low" thay vì "Low Stock")
  const criticalCount = lowStockData.filter(
    (i) => i.status === "Critical",
  ).length;
  const lowCount = lowStockData.filter((i) => i.status === "Low").length;

  const currentProductName = editingStock
    ? editingStock.productName || "Sản phẩm không xác định"
    : products.find((p) => p.productid === formData.productId)?.productname ||
      "";

  return (
    <div className="space-y-6">
      {/* Page Header & Tabs */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Quản lý Kho Hàng
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi tồn kho và quản lý các lô nhập xuất
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-gray-100">
          <button
            onClick={() => setActiveTab("ALERTS")}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${
              activeTab === "ALERTS"
                ? "border-tet-primary text-tet-primary"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              Cảnh báo Tồn kho
            </div>
          </button>
          <button
            onClick={() => setActiveTab("STOCKS")}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${
              activeTab === "STOCKS"
                ? "border-tet-primary text-tet-primary"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={18} />
              Danh sách Lô hàng
            </div>
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${
              activeTab === "HISTORY"
                ? "border-tet-primary text-tet-primary"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <History size={18} />
              Lịch sử Xuất - Nhập
            </div>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: ALERTS ================= */}
      {activeTab === "ALERTS" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Stats & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertOctagon size={24} />
              </div>
              <div>
                <p className="text-sm text-red-800 font-medium">
                  Cạn kiệt (Critical)
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {criticalCount}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-amber-800 font-medium">
                  Sắp hết (Low Stock)
                </p>
                <p className="text-2xl font-bold text-amber-600">{lowCount}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-center gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-bold flex items-center gap-2">
                  <Settings2 size={16} /> Ngưỡng báo động:
                </span>
                <input
                  type="number"
                  min="1"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value) || 10)}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-center font-bold focus:ring-2 focus:ring-tet-accent outline-none"
                />
              </div>
              <button
                onClick={() => fetchLowStock(threshold)}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Cập nhật
              </button>
            </div>
          </div>

          {/* Alerts Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden pb-6">
            <div className="p-4 border-b border-gray-100">
              <div className="relative max-w-md">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-tet-accent outline-none text-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-16 flex justify-center">
                <div className="w-8 h-8 border-4 border-tet-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="p-16 text-center">
                <PackageSearch
                  size={48}
                  className="mx-auto text-gray-300 mb-4"
                />
                <p className="text-gray-500 font-medium">
                  Kho hàng ổn định. Không có sản phẩm nào thiếu hụt dưới mức{" "}
                  {threshold}.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-bold">Mã (ID)</th>
                        <th className="px-6 py-4 font-bold">SKU</th>
                        <th className="px-6 py-4 font-bold">Tên sản phẩm</th>
                        <th className="px-6 py-4 font-bold text-center">
                          Tồn kho hiện tại
                        </th>
                        <th className="px-6 py-4 font-bold text-center">
                          Mức độ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {paginatedAlerts.map((item) => (
                        <tr key={item.productId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-600">
                            #{item.productId}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-500">
                            {item.sku || "-"}
                          </td>
                          <td className="px-6 py-4 font-bold text-tet-primary">
                            {item.productName}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-lg font-black text-gray-800">
                              {item.totalStockQuantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                item.status === "Critical"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {item.status === "Critical" ? (
                                <AlertOctagon size={12} />
                              ) : (
                                <AlertTriangle size={12} />
                              )}
                              {item.status === "Critical"
                                ? "Cạn kiệt"
                                : "Sắp hết"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <AdminPagination
                  currentPage={alertsPage}
                  totalPages={totalAlertsPages}
                  onPageChange={setAlertsPage}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: STOCKS (CRUD) ================= */}
      {activeTab === "STOCKS" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden pb-6">
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm lô hàng theo tên sản phẩm hoặc ID lô..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-tet-accent outline-none text-sm"
                />
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center gap-2 bg-tet-primary text-white px-6 py-2.5 rounded-full font-bold hover:bg-tet-accent transition-all shadow-md shrink-0"
              >
                <Plus size={18} /> Nhập Lô Mới
              </button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="p-16 flex justify-center">
                <div className="w-8 h-8 border-4 border-tet-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="p-16 text-center">
                <Archive size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">
                  Không tìm thấy lô hàng nào.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-bold">Mã Lô</th>
                        <th className="px-6 py-4 font-bold">Sản phẩm</th>
                        <th className="px-6 py-4 font-bold">Số lượng</th>
                        <th className="px-6 py-4 font-bold">Ngày NSX - HSD</th>
                        <th className="px-6 py-4 font-bold">Trạng thái</th>
                        <th className="px-6 py-4 font-bold text-right">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {paginatedStocks.map((stock) => {
                        // Badge Status UI logic
                        let badgeClass = "bg-gray-100 text-gray-700";
                        if (stock.status === "ACTIVE")
                          badgeClass = "bg-green-100 text-green-700";
                        if (stock.status === "OUT_OF_STOCK")
                          badgeClass = "bg-amber-100 text-amber-700";
                        if (stock.status === "EXPIRED")
                          badgeClass = "bg-red-100 text-red-700";

                        const isRowExpired = stock.status === "EXPIRED";

                        return (
                          <tr
                            key={stock.stockId}
                            className={`transition-colors hover:bg-gray-50 ${isRowExpired ? "bg-red-50/30" : ""}`}
                          >
                            <td className="px-6 py-4 font-medium text-gray-600">
                              #{stock.stockId}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-tet-primary">
                                {stock.productName || "Sản phẩm không rõ"}
                              </p>
                              <p className="text-xs text-gray-400">
                                ID: {stock.productId}
                              </p>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-800">
                              {stock.quantity}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500">
                              <p>
                                NSX:{" "}
                                {stock.productionDate
                                  ? new Date(
                                      stock.productionDate,
                                    ).toLocaleDateString("vi-VN")
                                  : "-"}
                              </p>
                              <p
                                className={
                                  isRowExpired ? "text-red-600 font-bold" : ""
                                }
                              >
                                HSD:{" "}
                                {stock.expiryDate
                                  ? new Date(
                                      stock.expiryDate,
                                    ).toLocaleDateString("vi-VN")
                                  : "-"}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
                              >
                                {stock.status || "UNKNOWN"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenModal(stock)}
                                  className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                                  title="Sửa lô hàng"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(stock.stockId)}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                  title="Xóa lô hàng"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <AdminPagination
                  currentPage={stocksPage}
                  totalPages={totalStocksPages}
                  onPageChange={setStocksPage}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: HISTORY ================= */}
      {activeTab === "HISTORY" && (
        <AdminInventoryHistory
          movements={movementsData}
          products={products}
          loading={loading}
        />
      )}

      {/* ================= MODAL THÊM / SỬA LÔ HÀNG ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-serif font-bold text-tet-primary flex items-center gap-2">
                <Package size={20} />
                {editingStock ? "Chỉnh sửa Lô hàng" : "Nhập Lô hàng mới"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              id="stockForm"
              onSubmit={handleSubmit}
              className="p-8 space-y-5"
            >
              {/* Thẻ nhắc nhở Business Logic */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
                <Info size={20} className="shrink-0 text-blue-600 mt-0.5" />
                <p>
                  <strong>Lưu ý nghiệp vụ:</strong> Trạng thái của lô hàng{" "}
                  <strong>KHÔNG</strong> do Admin tự chọn. Hệ thống (Backend) sẽ
                  tự động tính toán Trạng thái lô hàng dựa vào số lượng và Hạn
                  sử dụng (HSD) mà bạn nhập.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {/* --- CHỌN SẢN PHẨM --- */}
                <div
                  className={
                    editingStock ? "opacity-60 pointer-events-none" : ""
                  }
                >
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Sản phẩm (Product ID){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.productId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productId: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none bg-white"
                    required
                    disabled={!!editingStock}
                  >
                    <option value="" disabled>
                      -- Chọn sản phẩm --
                    </option>
                    {products.map((p) => (
                      <option key={p.productid} value={p.productid}>
                        #{p.productid} - {p.productname}
                      </option>
                    ))}
                  </select>
                </div>

                {/* --- TÊN SẢN PHẨM HIỂN THỊ (READ-ONLY) --- */}
                <div
                  className={
                    editingStock ? "opacity-60 pointer-events-none" : ""
                  }
                >
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tên sản phẩm
                  </label>
                  <input
                    type="text"
                    value={currentProductName}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-tet-primary font-bold cursor-not-allowed"
                    placeholder="Tự động hiển thị..."
                    readOnly
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Số lượng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Ngày Sản Xuất (NSX) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.productionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productionDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Hạn Sử Dụng (HSD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none"
                    required
                  />
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-full font-bold text-gray-500 hover:bg-gray-200 transition-all"
                disabled={submitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="stockForm"
                className="px-8 py-2.5 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save size={18} />
                )}
                {editingStock ? "Cập nhật Lô hàng" : "Thêm Lô hàng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
