import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { categoryService, type Category } from "../../../api/categoryService";

interface CategoryWithCount extends Category {
  productCount?: number;
  createdAt?: string;
}

export default function AdminCategories() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ categoryname: "" });
  const [error, setError] = useState<string | null>(null);

  // Get token from localStorage
  const token = localStorage.getItem("token") || "";

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getAll();
      setCategories(response.data || []);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(err.response?.data?.message || "Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: CategoryWithCount) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ categoryname: category.categoryname });
    } else {
      setEditingCategory(null);
      setFormData({ categoryname: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ categoryname: "" });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryname.trim()) {
      setError("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingCategory) {
        // Update
        await categoryService.update(editingCategory.categoryid!, formData, token);
      } else {
        // Create
        await categoryService.create(formData, token);
      }

      handleCloseModal();
      await fetchCategories(); // Refresh list
    } catch (err: any) {
      console.error("Error saving category:", err);
      setError(err.response?.data?.message || "Không thể lưu danh mục");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      return;
    }

    try {
      setError(null);
      await categoryService.delete(id, token);
      await fetchCategories(); // Refresh list
    } catch (err: any) {
      console.error("Error deleting category:", err);
      setError(err.response?.data?.message || "Không thể xóa danh mục");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Quản lý danh mục
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý các danh mục sản phẩm
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-tet-primary text-white px-6 py-3 rounded-full font-bold hover:bg-tet-accent transition-all shadow-md"
            disabled={loading}
          >
            <Plus size={20} />
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Global Error Message */}
      {error && !showModal && (
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

      {/* Categories Grid */}
      {loading && categories.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tet-primary"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
          <Tag size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Chưa có danh mục nào</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 inline-flex items-center gap-2 bg-tet-primary text-white px-6 py-3 rounded-full font-bold hover:bg-tet-accent transition-all shadow-md"
          >
            <Plus size={20} />
            Thêm danh mục đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.categoryid}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tet-accent to-tet-primary flex items-center justify-center text-white shadow-lg">
                  <Tag size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(category)}
                    className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors"
                    disabled={loading}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(category.categoryid!)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-tet-primary mb-2">
                {category.categoryname}
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">ID: {category.categoryid}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-serif font-bold text-tet-primary mb-6">
              {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên danh mục..."
                  value={formData.categoryname}
                  onChange={(e) => setFormData({ categoryname: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !submitting) {
                      handleSubmit(e as any);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                  autoFocus
                  disabled={submitting}
                />
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all"
                disabled={submitting}
              >
                Hủy
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? "Đang xử lý..." : editingCategory ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
