import { useState, useEffect, useMemo } from "react";
import {
  Gift,
  ShoppingCart,
  Eye,
  Search,
  Package,
  Tag,
  X,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/feature/cart/context/CartContext";
import { productService, type Product } from "@/api/productService";
import { categoryService, type Category } from "@/api/categoryService";

/* ────────────────────────────── Component ────────────────────────────── */

export default function AllProductsPage() {
  const { addToCart } = useCart();

  const [singleProducts, setSingleProducts] = useState<Product[]>([]);
  const [basketProducts, setBasketProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");

  // Reset category filter when switching to basket-only view
  useEffect(() => {
    if (selectedType === "basket") setSelectedCategory("all");
  }, [selectedType]);

  // Detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  /* ── Data fetching ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [productRes, templateRes, categoryRes] = await Promise.all([
          productService.getAll(),
          productService.templates.getAll(),
          categoryService.getAll(),
        ]);

        // getAll() may return paged { data: { data: [...] } } or flat { data: [...] }
        const rawProducts: Product[] =
          (productRes as any)?.data?.data ??
          (productRes as any)?.data ??
          [];

        // Templates / admin baskets
        const rawTemplates: Product[] = (templateRes as any)?.data ?? [];

        // Individual products: only ACTIVE
        const singleProducts = rawProducts.filter(
          (p) => p.status?.toUpperCase() === "ACTIVE" && !p.configid
        );

        // Baskets: ACTIVE or TEMPLATE status
        const basketProducts = rawTemplates.filter(
          (p) =>
            p.status?.toUpperCase() === "ACTIVE" ||
            p.status?.toUpperCase() === "TEMPLATE"
        );

        setSingleProducts(singleProducts);
        setBasketProducts(basketProducts);
        setCategories((categoryRes as any)?.data ?? []);
      } catch (err: any) {
        console.error("Lỗi tải sản phẩm:", err);
        setError(err?.response?.data?.message || err?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ── Derived / filtered list ── */
  const filteredProducts = useMemo(() => {
    // Determine base pool from type tab
    let singles = [...singleProducts];
    let baskets = [...basketProducts];

    // Category filter → applies only to single products
    if (selectedCategory !== "all") {
      const catId = Number(selectedCategory);
      singles = singles.filter((p) => p.categoryid === catId);
    }

    // Combine based on type
    let result: Product[] =
      selectedType === "basket"
        ? baskets
        : selectedType === "single"
        ? singles
        : [...baskets, ...singles];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.productname?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "name":
        result.sort((a, b) =>
          (a.productname ?? "").localeCompare(b.productname ?? "", "vi")
        );
        break;
      default:
        // popular – baskets first (when all), then by stock desc
        result.sort((a, b) => {
          if (selectedType === "all") {
            if ((a.configid != null) !== (b.configid != null))
              return a.configid != null ? -1 : 1;
          }
          return (b.totalQuantity ?? 0) - (a.totalQuantity ?? 0);
        });
    }

    return result;
  }, [singleProducts, basketProducts, selectedType, selectedCategory, search, sortBy]);

  const basketCount = basketProducts.length;
  const singleCount = singleProducts.length;

  /* ── Handlers ── */
  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-amber-50">
      {/* ── Hero Banner ── */}
      <section className="relative bg-gradient-to-r from-red-700 via-red-600 to-amber-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/oriental.png')]" />
        <div className="container mx-auto px-6 py-16 relative z-10 text-center">
          <div className="flex justify-center gap-3 mb-4 text-3xl">
            🧧 🌸 🎁
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 drop-shadow">
            Tất Cả Sản Phẩm Tết
          </h1>
          <p className="text-lg opacity-90 max-w-xl mx-auto">
            Khám phá đầy đủ bánh mứt, đặc sản và giỏ quà cao cấp – chọn lựa hoàn hảo cho mùa Tết
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <p className="text-3xl font-black">{basketCount + singleCount}</p>
              <p className="text-sm opacity-75">Sản phẩm</p>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-black">{basketCount}</p>
              <p className="text-sm opacity-75">Giỏ quà</p>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-black">{singleCount}</p>
              <p className="text-sm opacity-75">Sản phẩm đơn</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, SKU..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[160px] rounded-xl border-gray-200 bg-white shadow-sm">
                <SelectValue placeholder="Loại sản phẩm" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="basket">🎁 Giỏ quà</SelectItem>
                <SelectItem value="single">📦 Sản phẩm đơn</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter – disabled for basket-only view */}
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={selectedType === "basket"}
            >
              <SelectTrigger
                className={`w-[180px] rounded-xl border-gray-200 bg-white shadow-sm ${
                  selectedType === "basket" ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <SelectValue
                  placeholder={
                    selectedType === "basket" ? "Không áp dụng" : "Danh mục"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.categoryid}
                    value={String(cat.categoryid)}
                  >
                    {cat.categoryname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <SlidersHorizontal size={16} className="text-gray-400" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] rounded-xl border-gray-200 bg-white shadow-sm">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="popular">Phổ biến nhất</SelectItem>
                  <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                  <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                  <SelectItem value="name">Tên A → Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Result count ── */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500 font-medium">
            Hiển thị{" "}
            <span className="text-red-600 font-bold">{filteredProducts.length}</span>{" "}
            sản phẩm
            {search && (
              <span className="ml-1">
                cho "<span className="font-semibold">{search}</span>"
              </span>
            )}
          </p>

          {/* Active filter chips */}
          <div className="flex gap-2">
            {selectedType !== "all" && (
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1">
                {selectedType === "basket" ? "🎁 Giỏ quà" : "📦 Sản phẩm đơn"}
                <button onClick={() => setSelectedType("all")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1">
                <Tag size={10} />
                {categories.find((c) => String(c.categoryid) === selectedCategory)
                  ?.categoryname ?? "Danh mục"}
                <button onClick={() => setSelectedCategory("all")}>
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-600 font-bold text-lg mb-2">Không thể tải dữ liệu</p>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32">
            <Gift size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              Không tìm thấy sản phẩm nào
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedType("all");
                setSelectedCategory("all");
              }}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          /* ── Product Grid ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.productid}
                product={product}
                onViewDetail={() => setSelectedProduct(product)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedProduct && (
        <DetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => {
            handleAddToCart(selectedProduct);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════ ProductCard ═══════════════════════════ */

interface ProductCardProps {
  product: Product;
  onViewDetail: () => void;
  onAddToCart: () => void;
}

function ProductCard({ product, onViewDetail, onAddToCart }: ProductCardProps) {
  const isBasket = product.configid != null;
  const itemCount = product.productDetails?.length ?? 0;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-red-50 to-amber-50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productname}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isBasket ? (
              <Gift size={56} className="text-red-300" />
            ) : (
              <Package size={56} className="text-amber-300" />
            )}
          </div>
        )}

        {/* Type badge overlay */}
        <div className="absolute top-3 left-3">
          {isBasket ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-600 text-white shadow">
              <Gift size={11} /> Giỏ quà
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white shadow">
              <Package size={11} /> Đơn lẻ
            </span>
          )}
        </div>

        {/* Stock badge */}
        {product.totalQuantity !== undefined && product.totalQuantity <= 20 && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white shadow">
              Còn {product.totalQuantity}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-base leading-tight line-clamp-2 mb-1 min-h-[2.75rem]">
            {product.productname}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">
            {product.description ?? "Sản phẩm Tết chất lượng cao"}
          </p>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xl font-black text-red-600">
                {(product.price ?? 0).toLocaleString("vi-VN")}đ
              </p>
              {product.unit && (
                <p className="text-[11px] text-gray-400">{product.unit}g</p>
              )}
            </div>
            {isBasket && itemCount > 0 && (
              <div className="text-right">
                <p className="text-[11px] text-gray-400">Số món</p>
                <p className="text-lg font-bold text-purple-600">{itemCount}</p>
              </div>
            )}
            {!isBasket && product.totalQuantity !== undefined && (
              <div className="text-right">
                <p className="text-[11px] text-gray-400">Tồn kho</p>
                <p className="text-lg font-bold text-green-600">{product.totalQuantity}</p>
              </div>
            )}
          </div>

          {/* Star rating (decorative) */}
          <div className="flex items-center gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < 4 ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">(4.0)</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={onViewDetail}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white text-sm font-bold hover:shadow-md transition-all"
          >
            <Eye size={15} />
            Xem chi tiết
          </button>
          <button
            onClick={onAddToCart}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-500 text-red-600 text-sm font-bold hover:bg-red-50 transition-all"
          >
            <ShoppingCart size={15} />
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ DetailModal ═══════════════════════════ */

interface DetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: () => void;
}

function DetailModal({ product, onClose, onAddToCart }: DetailModalProps) {
  const isBasket = product.configid != null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex-shrink-0 p-6 text-white rounded-t-3xl ${
            isBasket
              ? "bg-gradient-to-r from-purple-600 to-pink-500"
              : "bg-gradient-to-r from-red-600 to-amber-500"
          }`}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isBasket ? (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    🎁 Giỏ quà
                  </span>
                ) : (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    📦 Sản phẩm đơn
                  </span>
                )}
                {product.sku && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    SKU: {product.sku}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black mb-1">{product.productname}</h3>
              <p className="text-sm opacity-80">
                {product.description ?? "Chưa có mô tả"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Product image */}
          {product.imageUrl && (
            <div className="mb-6 rounded-2xl overflow-hidden h-52 bg-gray-50">
              <img
                src={product.imageUrl}
                alt={product.productname}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-[11px] text-gray-500 mb-0.5">Giá</p>
              <p className="text-base font-black text-red-600">
                {(product.price ?? 0).toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-[11px] text-gray-500 mb-0.5">Trọng lượng</p>
              <p className="text-base font-black text-amber-600">
                {product.unit ?? 0}g
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-[11px] text-gray-500 mb-0.5">Tồn kho</p>
              <p className="text-base font-black text-green-600">
                {product.totalQuantity ?? 0}
              </p>
            </div>
            {isBasket ? (
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-[11px] text-gray-500 mb-0.5">Số món</p>
                <p className="text-base font-black text-purple-600">
                  {product.productDetails?.length ?? 0}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-[11px] text-gray-500 mb-0.5">Trạng thái</p>
                <p className="text-base font-black text-blue-600">Còn hàng</p>
              </div>
            )}
          </div>

          {/* Product details (basket only) */}
          {isBasket &&
            product.productDetails &&
            product.productDetails.length > 0 && (
              <div>
                <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Gift size={16} className="text-purple-500" />
                  Sản phẩm trong giỏ
                </h4>
                <div className="space-y-2">
                  {product.productDetails.map((detail, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      {detail.childProduct?.imageUrl ? (
                        <img
                          src={detail.childProduct.imageUrl}
                          alt={detail.childProduct.productname}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package size={20} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {detail.childProduct?.productname ?? "Sản phẩm"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(detail.childProduct?.price ?? 0).toLocaleString("vi-VN")}đ / món
                        </p>
                      </div>
                      <span className="text-sm font-black text-purple-600 flex-shrink-0">
                        x{detail.quantity ?? 1}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 flex justify-between items-center bg-purple-50 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-gray-600">
                    Tổng giá trị sản phẩm:
                  </span>
                  <span className="font-black text-purple-700">
                    {product.productDetails
                      .reduce(
                        (sum, d) =>
                          sum +
                          (d.quantity ?? 1) * (d.childProduct?.price ?? 0),
                        0
                      )
                      .toLocaleString("vi-VN")}
                    đ
                  </span>
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 p-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition"
          >
            Đóng
          </button>
          <button
            onClick={onAddToCart}
            className={`flex-1 py-3 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition ${
              isBasket
                ? "bg-gradient-to-r from-purple-600 to-pink-500"
                : "bg-gradient-to-r from-red-600 to-amber-500"
            }`}
          >
            <ShoppingCart size={16} />
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
}
