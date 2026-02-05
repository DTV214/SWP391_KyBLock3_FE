import { useState } from "react";
import { Plus, Trash2, Search, Package, Filter } from "lucide-react";
import type { Product, Category } from "../../../api";

interface SelectedProduct {
  productid: number;
  quantity: number;
}

interface ConfigProductManagerProps {
  products: Product[];
  categories: Category[];
  selectedProducts: SelectedProduct[];
  onAdd: (productId: number) => void;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  disabled?: boolean;
}

export default function ConfigProductManager({
  products,
  categories,
  selectedProducts,
  onAdd,
  onRemove,
  onUpdateQuantity,
  disabled = false,
}: ConfigProductManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");

  const getProductById = (productId: number) => {
    return products.find(p => p.productid === productId);
  };

  const availableProducts = products.filter(
    p => !selectedProducts.find(sp => sp.productid === p.productid)
  );

  const filteredProducts = availableProducts.filter(product => {
    const matchesSearch = product.productname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryid === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Chưa phân loại";
    return categories.find(c => c.categoryid === categoryId)?.categoryname || "N/A";
  };

  const getTotalWeight = () => {
    return selectedProducts.reduce((total, sp) => {
      const product = getProductById(sp.productid);
      return total + (product?.unit || 0) * sp.quantity;
    }, 0);
  };

  const handleQuantityChange = (productId: number, value: string) => {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity > 0) {
      onUpdateQuantity(productId, quantity);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
            <Package size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Sản phẩm trong giỏ</p>
            <p className="text-xs text-gray-500">
              {selectedProducts.length} sản phẩm · Tổng {getTotalWeight()}g
            </p>
          </div>
        </div>
      </div>

      {/* Selected Products List */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Đã chọn ({selectedProducts.length})
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {selectedProducts.map((sp) => {
              const product = getProductById(sp.productid);
              if (!product) return null;

              return (
                <div
                  key={sp.productid}
                  className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 hover:shadow-md transition-all group"
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.productname || ""}
                      className="w-14 h-14 object-cover rounded-lg border-2 border-white shadow-sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {product.productname}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getCategoryName(product.categoryid)} · {product.unit}g/sp · {(product.unit || 0) * sp.quantity}g tổng
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(sp.productid, Math.max(1, sp.quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:border-tet-primary hover:bg-tet-primary hover:text-white transition-all flex items-center justify-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={disabled || sp.quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={sp.quantity}
                      onChange={(e) => handleQuantityChange(sp.productid, e.target.value)}
                      className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                      disabled={disabled}
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(sp.productid, sp.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:border-tet-primary hover:bg-tet-primary hover:text-white transition-all flex items-center justify-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={disabled}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => onRemove(sp.productid)}
                    className="w-10 h-10 rounded-lg hover:bg-red-100 text-red-600 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={disabled}
                    title="Xóa sản phẩm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Products */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">Thêm sản phẩm mới</p>
          <span className="text-xs text-gray-500">
            {availableProducts.length} sản phẩm khả dụng
          </span>
        </div>

        {/* Search and Filter Bar */}
        {availableProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* Search Bar */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tet-accent focus:border-transparent text-sm"
                disabled={disabled}
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tet-accent focus:border-transparent text-sm appearance-none bg-white cursor-pointer"
                disabled={disabled}
              >
                <option value="all">Tất cả phân loại</option>
                {categories.map((category) => (
                  <option key={category.categoryid} value={category.categoryid}>
                    {category.categoryname}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {availableProducts.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              Tất cả sản phẩm đã được thêm vào giỏ
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <Search size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              Không tìm thấy sản phẩm "{searchTerm}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {filteredProducts.map((product) => (
              <button
                key={product.productid}
                type="button"
                onClick={() => onAdd(product.productid!)}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:border-tet-primary hover:bg-tet-primary/5 hover:shadow-md transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.productname || ""}
                    className="w-12 h-12 object-cover rounded-lg border-2 border-gray-100 group-hover:border-tet-primary transition-all"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-gray-800 group-hover:text-tet-primary transition-colors">
                    {product.productname}
                  </p>
                  <p className="text-xs text-gray-500">{getCategoryName(product.categoryid)} · {product.unit}g</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-tet-primary/10 group-hover:bg-tet-primary flex items-center justify-center transition-all">
                  <Plus size={16} className="text-tet-primary group-hover:text-white transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
