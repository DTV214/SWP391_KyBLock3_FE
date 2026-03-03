import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { productService, type Product } from "../../../api/productService";
import { categoryService, type Category } from "../../../api/categoryService";
import axiosClient from "../../../api/axiosClient";
import { API_ENDPOINTS } from "../../../api/apiConfig";

const PAGE_SIZE = 20;


export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [formData, setFormData] = useState<Product>({
    productname: "",
    description: "",
    imageUrl: "",
    price: 0,
    unit: 0,
    sku: "",
    categoryid: undefined,
    status: "ACTIVE",
    isCustom: false,
  });

  // Get token from localStorage
  const getToken = () => localStorage.getItem("token") || "";

  // Fetch products with server-side pagination & search
  // Server returns: ApiResponse<PagedResponse<ProductDto>>
  // axiosClient unwraps to: { status, msg, data: { data: [...], currentPage, totalPages, totalItems, pageSize } }
  const fetchProducts = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        pageNumber: String(page),
        pageSize: String(PAGE_SIZE),
        ...(search ? { search } : {}),
      });
      const res: any = await axiosClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}?${params.toString()}`);
      const paged = res?.data;
      setProducts(Array.isArray(paged?.data) ? paged.data : []);
      setCurrentPage(paged?.currentPage ?? page);
      setTotalPages(paged?.totalPages ?? 1);
      setTotalItems(paged?.totalItems ?? 0);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.response?.data?.message || "Không thể tải sản phẩm");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories (plain array response)
  const fetchCategories = useCallback(async () => {
    try {
      const res: any = await categoryService.getAll();
      setCategories(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounced search — reset to page 1 on new search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts(1, searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchProducts]);

  // Re-fetch when page changes
  useEffect(() => {
    fetchProducts(currentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Open modal for create/edit
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        productname: "",
        description: "",
        imageUrl: "",
        price: 0,
        unit: 0,
        sku: "",
        categoryid: undefined,
        status: "ACTIVE",
        isCustom: false,
      });
    }
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setError(null);
  };

  // View product details
  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
  };

  // Close view modal
  const handleCloseViewModal = () => {
    setViewingProduct(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productname?.trim()) {
      setError("Vui lòng nhập tên sản phẩm");
      return;
    }

    // Validation for normal products
    if (!formData.isCustom) {
      if (!formData.sku?.trim()) {
        setError("Vui lòng nhập SKU cho sản phẩm thường");
        return;
      }
      if (!formData.price || formData.price <= 0) {
        setError("Vui lòng nhập giá hợp lệ (> 0)");
        return;
      }
      if (!formData.unit || formData.unit <= 0) {
        setError("Vui lòng nhập khối lượng hợp lệ (> 0)");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingProduct?.productid) {
        // Update - only normal products should be updated here
        if (formData.isCustom) {
          setError("Không thể cập nhật sản phẩm tùy chỉnh ở đây. Vui lòng sử dụng trang Cấu hình giỏ quà.");
          setSubmitting(false);
          return;
        }
        await productService.updateNormal(editingProduct.productid, formData, getToken());
      } else {
        // Create - normal product only
        if (formData.isCustom) {
          setError("Không thể tạo sản phẩm tùy chỉnh ở đây. Vui lòng sử dụng trang Cấu hình giỏ quà.");
          setSubmitting(false);
          return;
        }
        
        const createData = {
          categoryid: formData.categoryid,
          sku: formData.sku || '',
          productname: formData.productname,
          description: formData.description,
          price: formData.price || 0,
          unit: formData.unit || 0,
          imageUrl: formData.imageUrl
        };
        
        await productService.createNormal(createData, getToken());
      }

      handleCloseModal();
      await fetchProducts(currentPage, searchTerm);
    } catch (err: any) {
      console.error("Error saving product:", err);
      setError(err.response?.data?.message || "Không thể lưu sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      return;
    }

    try {
      setError(null);
      await productService.delete(id, getToken());
      await fetchProducts(currentPage, searchTerm);
    } catch (err: any) {
      console.error("Error deleting product:", err);
      setError(err.response?.data?.message || "Không thể xóa sản phẩm");
    }
  };

  // Get category name by id
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "-";
    const category = categories.find(c => c.categoryid === categoryId);
    return category?.categoryname || "-";
  };

  // Client-side filter by status/category on top of server-paged data
  const filteredProducts = products.filter(product => {
    const matchStatus = !filterStatus || product.status === filterStatus;
    const matchCategory = !filterCategory || product.categoryid?.toString() === filterCategory;
    return matchStatus && matchCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-gray-100 text-gray-700";
      case "TEMPLATE":
        return "bg-purple-100 text-purple-700";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "INACTIVE":
        return "Tạm dừng";
      case "TEMPLATE":
        return "Giỏ mẫu";
      case "DRAFT":
        return "Nháp";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Quản lý sản phẩm
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý tất cả sản phẩm và giỏ quà
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-tet-primary text-white px-6 py-3 rounded-full font-bold hover:bg-tet-accent transition-all shadow-md"
            disabled={loading}
          >
            <Plus size={20} />
            Thêm sản phẩm
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-tet-accent focus:border-transparent"
            />
          </div>
          <select 
            className="px-6 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-tet-accent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Tạm dừng</option>
            <option value="TEMPLATE">Giỏ mẫu</option>
            <option value="DRAFT">Nháp</option>
          </select>
          <select 
            className="px-6 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-tet-accent"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat.categoryid} value={cat.categoryid}>
                {cat.categoryname}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="flex-1 text-red-700 text-sm">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tet-primary"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Khối lượng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.productid}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.productname}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/80?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-tet-primary">
                            {product.productname || "Chưa đặt tên"}
                          </p>
                          <p className="text-xs text-gray-500">ID: {product.productid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-mono">
                        {product.sku || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {getCategoryName(product.categoryid)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-tet-accent">
                        {product.price ? product.price.toLocaleString() : "0"}đ
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {product.unit || 0}g
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(
                          product.status || ""
                        )}`}
                      >
                        {getStatusText(product.status || "")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleViewProduct(product)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.productid!)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-600">
              Trang <span className="font-bold">{currentPage}</span> /{" "}
              <span className="font-bold">{totalPages}</span> — Tổng{" "}
              <span className="font-bold">{totalItems}</span> sản phẩm
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page =
                  totalPages <= 5
                    ? i + 1
                    : currentPage <= 3
                    ? i + 1
                    : currentPage >= totalPages - 2
                    ? totalPages - 4 + i
                    : currentPage - 2 + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      page === currentPage
                        ? "bg-tet-primary text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-serif font-bold text-tet-primary mb-6 flex-shrink-0">
              {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h3>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tên sản phẩm */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm..."
                    value={formData.productname || ""}
                    onChange={(e) => setFormData({ ...formData, productname: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    placeholder="Mã SKU..."
                    value={formData.sku || ""}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                {/* Danh mục */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Danh mục
                  </label>
                  <select
                    value={formData.categoryid || ""}
                    onChange={(e) => setFormData({ ...formData, categoryid: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                    disabled={submitting}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(cat => (
                      <option key={cat.categoryid} value={cat.categoryid}>
                        {cat.categoryname}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Giá */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                    disabled={submitting}
                    min="0"
                  />
                </div>

                {/* Khối lượng */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Khối lượng (g)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.unit || 0}
                    onChange={(e) => setFormData({ ...formData, unit: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                    disabled={submitting}
                    min="0"
                  />
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status || "ACTIVE"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                    disabled={submitting}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tạm dừng</option>
                    <option value="TEMPLATE">Giỏ mẫu</option>
                    <option value="DRAFT">Nháp</option>
                  </select>
                </div>

                {/* Loại sản phẩm */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Loại sản phẩm
                  </label>
                  <select
                    value={formData.isCustom ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, isCustom: e.target.value === "true" })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                    disabled={submitting}
                  >
                    <option value="false">Sản phẩm thường</option>
                    <option value="true">Sản phẩm tùy chỉnh</option>
                  </select>
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    URL Hình ảnh
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl || ""}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                {/* Mô tả */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    placeholder="Nhập mô tả sản phẩm..."
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent resize-none"
                    disabled={submitting}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý..." : editingProduct ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewingProduct && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={handleCloseViewModal}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-serif font-bold text-tet-primary">
                Chi tiết sản phẩm
              </h3>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Image */}
              {viewingProduct.imageUrl && (
                <div className="flex justify-center">
                  <img
                    src={viewingProduct.imageUrl}
                    alt={viewingProduct.productname}
                    className="max-w-full h-64 object-contain rounded-xl border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />
                </div>
              )}

              {/* Product Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">ID Sản phẩm</p>
                  <p className="font-bold text-tet-primary">{viewingProduct.productid}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Tên sản phẩm</p>
                  <p className="font-bold">{viewingProduct.productname || "-"}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">SKU</p>
                  <p className="font-bold font-mono">{viewingProduct.sku || "-"}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Danh mục</p>
                  <p className="font-bold">{getCategoryName(viewingProduct.categoryid)}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Giá</p>
                  <p className="font-bold text-tet-accent text-lg">
                    {viewingProduct.price ? viewingProduct.price.toLocaleString() : "0"}đ
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Khối lượng</p>
                  <p className="font-bold">{viewingProduct.unit || 0}g</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(
                      viewingProduct.status || ""
                    )}`}
                  >
                    {getStatusText(viewingProduct.status || "")}
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Loại sản phẩm</p>
                  <p className="font-bold">
                    {viewingProduct.isCustom ? "Sản phẩm tùy chỉnh" : "Sản phẩm thường"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {viewingProduct.description && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Mô tả</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingProduct.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseViewModal}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleCloseViewModal();
                    handleOpenModal(viewingProduct);
                  }}
                  className="flex-1 px-6 py-3 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
