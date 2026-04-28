import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSearchParams, Link } from "react-router-dom";
import {
  Gift,
  X,
  Eye,
  Copy,
  Save,
  Trash2,
  Package,
  ShoppingCart,
  Search,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Filter,
} from "lucide-react";
import ProductHero from "../components/ProductHero";
import ProductCard from "@/components/common/ProductCard";
import { useCart } from "@/feature/cart/context/CartContext";
import {
  productService,
  type Product,
  type ProductDetailRequest,
  type UpdateComboProductRequest,
} from "@/api/productService";
import { configService, type ProductConfig } from "@/api/configService";
import { categoryService, type Category } from "@/api/categoryService";

/*  Types  */
interface ProductDetailWithChild extends ProductDetailRequest {
  childProduct?: Product;
}
type ToastItem = {
  id: number;
  type: "success" | "error" | "info";
  text: string;
};
type PriceRange = { min?: number; max?: number };

const SINGLE_PRICE_PRESETS: { label: string; range: PriceRange }[] = [
  { label: "Tất cả", range: {} },
  { label: "< 100k", range: { max: 100_000 } },
  { label: "100k – 500k", range: { min: 100_000, max: 500_000 } },
  { label: "500k – 1tr", range: { min: 500_000, max: 1_000_000 } },
  { label: "> 1tr", range: { min: 1_000_000 } },
];

const BASKET_PRICE_PRESETS: { label: string; range: PriceRange }[] = [
  { label: "Tất cả", range: {} },
  { label: "< 500k", range: { max: 500_000 } },
  { label: "500k – 1tr", range: { min: 500_000, max: 1_000_000 } },
  { label: "1tr – 2tr", range: { min: 1_000_000, max: 2_000_000 } },
  { label: "> 2tr", range: { min: 2_000_000 } },
];

/*  Skeleton card  */
function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className={`bg-gray-200 ${tall ? "h-52" : "h-40"}`} />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-9 bg-gray-100 rounded-xl mt-3" />
      </div>
    </div>
  );
}

/*  Section Header  */
function SectionHeader({
  icon,
  title,
  count,
  sub,
}: {
  icon: string;
  title: string;
  count: number;
  sub?: string;
}) {
  return (
    <div className="flex items-end gap-4 mb-8">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {title}
          </h2>
          {sub && <p className="text-sm text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <span className="mb-1 text-xs font-bold text-white bg-tet-accent px-2.5 py-0.5 rounded-full">
        {count}
      </span>
      <div className="flex-1 h-px bg-linear-to-r from-tet-accent/40 to-transparent ml-2 mb-1.5" />
    </div>
  );
}

/*  Main Component  */
export default function ProductPage() {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();

  /*  Single products  */
  const [singleProducts, setSingleProducts] = useState<Product[]>([]);
  const [singleLoading, setSingleLoading] = useState(true);
  const [singleSortBy, setSingleSortBy] = useState("name");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(() => {
    const cat = searchParams.get("category");
    return cat ? Number(cat) : 0;
  });
  const [singlePriceRange, setSinglePriceRange] = useState<PriceRange>({});

  /*  Baskets  */
  const [baskets, setBaskets] = useState<Product[]>([]);
  const [basketLoading, setBasketLoading] = useState(true);
  const [basketSortBy, setBasketSortBy] = useState("price-asc");
  const [basketSearch, setBasketSearch] = useState("");
  const [basketPriceRange, setBasketPriceRange] = useState<PriceRange>({});

  /*  Toast system  */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = useCallback((type: ToastItem["type"], text: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500,
    );
  }, []);

  /*  Pagination constants  */
  const ITEMS_PER_PAGE = 12;
  const [singlePage, setSinglePage] = useState(1);
  const [basketPage, setBasketPage] = useState(1);

  /* Reset page when filters change */
  useEffect(
    () => setSinglePage(1),
    [selectedCategory, singlePriceRange, singleSortBy, searchParams],
  );
  useEffect(
    () => setBasketPage(1),
    [basketSearch, basketPriceRange, basketSortBy, searchParams],
  );

  /*  Details modal (Removed - navigated to detail page instead)  */
  // const [selectedTemplate, setSelectedTemplate] = useState<Product | null>(null);
  // const [showDetailsModal, setShowDetailsModal] = useState(false);

  /*  Clone modal  */
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneStep, setCloneStep] = useState<1 | 2 | 3>(1); // 1=name, 2=customize, 3=done
  const [cloning, setCloning] = useState(false);
  const [cloneProduct, setCloneProduct] = useState<Product | null>(null);
  const [clonedBasketId, setClonedBasketId] = useState<number | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<ProductConfig | null>(
    null,
  );
  const [customName, setCustomName] = useState("");
  const [productDetails, setProductDetails] = useState<
    ProductDetailWithChild[]
  >([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [saving, setSaving] = useState(false);

  /*  Scroll to top on mount  */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  /*  Fetch  */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [availableProducts, availableBaskets, catsRes] =
          await Promise.all([
            productService.getAvailableProductsForCustomer(),
            productService.getAvailableShopBasketsForCustomer(),
            categoryService.getAll(),
          ]);

        setSingleProducts(
          availableProducts.filter(
            (p: Product) => p.status === "ACTIVE" && !p.configid,
          ),
        );
        setSingleLoading(false);

        setBaskets(
          availableBaskets.filter((p: Product) => p.status === "ACTIVE"),
        );
        setBasketLoading(false);

        const catsResponse = catsRes as unknown as Record<string, unknown>;
        const cats: Category[] = Array.isArray(
          (catsResponse?.data as Record<string, unknown>)?.data,
        )
          ? ((catsResponse?.data as Record<string, unknown>)
              ?.data as Category[])
          : Array.isArray(catsResponse?.data)
            ? (catsResponse?.data as Category[])
            : [];
        setCategories(cats);
      } catch (err) {
        console.error("Error loading ProductPage data:", err);
        setSingleLoading(false);
        setBasketLoading(false);
      }
    };
    fetchAll();
  }, []);

  /*  Fetch by Category (Server-side)  */
  useEffect(() => {
    if (selectedCategory === 0) {
      // If "All" is selected, we rely on the initial fetchAll() data.
      // But we need to make sure we restore it if it was overwritten.
      const restoreAll = async () => {
         try {
           setSingleLoading(true);
           const available = await productService.getAvailableProductsForCustomer();
           setSingleProducts(available.filter((p: Product) => p.status === "ACTIVE" && !p.configid));
         } catch (err) {
           console.error("Error restoring all products:", err);
         } finally {
           setSingleLoading(false);
         }
      };
      // Only restore if we have actually changed the category before
      // (Simplified for demo, usually we'd keep a ref to the original list)
      restoreAll();
      return;
    }

    const fetchByCategory = async () => {
      try {
        setSingleLoading(true);
        const res = await productService.getByCategoryId(selectedCategory);
        // The new BE method returns List<ProductDto> directly in res.data
        const categoryProducts = (res as any)?.data ?? [];
        setSingleProducts(categoryProducts);
      } catch (err) {
        console.error("Error fetching products by category:", err);
      } finally {
        setSingleLoading(false);
      }
    };

    fetchByCategory();
  }, [selectedCategory]);

  /*  Filtered / sorted single products  */
  const filteredSingleProducts = useMemo(() => {
    let list = [...singleProducts];
    const query = searchParams.get("q")?.toLowerCase();

    if (query) {
      list = list.filter(
        (p) =>
          p.productname?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query),
      );
    }

    if (selectedCategory)
      list = list.filter((p) => p.categoryid === selectedCategory);
    if (singlePriceRange.min !== undefined)
      list = list.filter((p) => (p.price ?? 0) >= singlePriceRange.min!);
    if (singlePriceRange.max !== undefined)
      list = list.filter((p) => (p.price ?? 0) <= singlePriceRange.max!);

    switch (singleSortBy) {
      case "price-asc":
        return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case "price-desc":
        return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      default:
        return list.sort((a, b) =>
          (a.productname ?? "").localeCompare(b.productname ?? "", "vi"),
        );
    }
  }, [
    singleProducts,
    singleSortBy,
    selectedCategory,
    singlePriceRange,
    searchParams,
  ]);

  /*  Filtered / sorted baskets  */
  const filteredBaskets = useMemo(() => {
    let list = [...baskets];
    const query = searchParams.get("q")?.toLowerCase();

    if (query) {
      list = list.filter(
        (p) =>
          p.productname?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query),
      );
    }

    if (basketSearch.trim()) {
      const q = basketSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.productname?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }
    if (basketPriceRange.min !== undefined)
      list = list.filter((p) => (p.price ?? 0) >= basketPriceRange.min!);
    if (basketPriceRange.max !== undefined)
      list = list.filter((p) => (p.price ?? 0) <= basketPriceRange.max!);
    switch (basketSortBy) {
      case "price-desc":
        return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      default:
        return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    }
  }, [baskets, basketSortBy, basketSearch, basketPriceRange, searchParams]);

  /*  Filtered available products for clone modal  */
  const filteredAvailableProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts.slice(0, 12);
    const q = productSearch.toLowerCase();
    return availableProducts
      .filter((p) => p.productname?.toLowerCase().includes(q))
      .slice(0, 12);
  }, [availableProducts, productSearch]);

  /*  Cart  */

  /*  Details modal (Removed)  */
  // const handleViewDetails = (template: Product) => {
  //   setSelectedTemplate(template);
  //   setShowDetailsModal(true);
  // };

  /*  Clone modal  */
  const handleOpenCloneModal = async (template: Product) => {
    setShowCloneModal(true);
    setCloning(true);
    setCloneStep(1);
    setCloneProduct(template);
    setClonedBasketId(null);
    setCustomName(template.productname + " (Bản sao)");
    setProductDetails(
      (template.productDetails || []).map((pd) => ({
        productid: pd.productid,
        quantity: pd.quantity,
        childProduct: pd.childProduct,
      })),
    );
    try {
      if (template.configid) {
        const configs = await configService.getAllConfig();
        setSelectedConfig(
          configs.find((c) => c.configid === template.configid) || null,
        );
      } else {
        setSelectedConfig(null);
      }
      const availableProds =
        await productService.getAvailableProductsForCustomer();
      setAvailableProducts(
        availableProds.filter(
          (p: Product) => p.status === "ACTIVE" && !p.configid,
        ),
      );
    } catch {
      addToast("error", "Không thể tải dữ liệu. Vui lòng thử lại.");
      setShowCloneModal(false);
    } finally {
      setCloning(false);
    }
  };

  const handleCloseCloneModal = () => {
    setShowCloneModal(false);
    setCloneProduct(null);
    setClonedBasketId(null);
    setSelectedConfig(null);
    setCustomName("");
    setProductDetails([]);
    setAvailableProducts([]);
    setCloneStep(1);
    setProductSearch("");
  };

  const handleAddProduct = (product: Product) => {
    const existing = productDetails.find(
      (pd) => pd.productid === product.productid,
    );
    if (existing) {
      const idx = productDetails.indexOf(existing);
      handleQuantityChange(idx, (existing.quantity || 1) + 1);
      return;
    }
    setProductDetails((prev) => [
      ...prev,
      { productid: product.productid, quantity: 1, childProduct: product },
    ]);
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setProductDetails((prev) => {
      const u = [...prev];
      u[index] = { ...u[index], quantity: newQuantity };
      return u;
    });
  };

  const handleRemoveProductDetail = (index: number) => {
    setProductDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const validateProductConfig = useCallback((): string[] => {
    if (!selectedConfig?.configDetails?.length) return [];
    const categoryCount: Record<number, number> = {};
    productDetails.forEach((pd) => {
      const cid = pd.childProduct?.categoryid;
      if (cid)
        categoryCount[cid] = (categoryCount[cid] || 0) + (pd.quantity || 0);
    });
    const errors: string[] = [];
    selectedConfig.configDetails.forEach((detail) => {
      const actual = categoryCount[detail.categoryid] || 0;
      if (actual !== detail.quantity)
        errors.push(
          `${detail.categoryName}: cần ${detail.quantity}, hiện ${actual}`,
        );
    });
    return errors;
  }, [selectedConfig, productDetails]);

  const handleCloneTemplate = async () => {
    if (!customName.trim()) {
      addToast("error", "Vui lòng nhập tên giỏ quà");
      return;
    }
    const token = localStorage.getItem("token") || "";
    if (!token) {
      addToast("error", "Vui lòng đăng nhập để clone giỏ quà");
      return;
    }
    try {
      setCloning(true);
      const response = await productService.templates.clone(
        cloneProduct!.productid!,
        { customName },
        token,
      );
      const clonedBasket = response.data;
      setClonedBasketId(clonedBasket.productid);
      if (clonedBasket.productDetails) {
        setProductDetails(
          clonedBasket.productDetails.map((pd: ProductDetailWithChild) => ({
            productid: pd.productid,
            quantity: pd.quantity,
            childProduct: pd.childProduct,
          })),
        );
      }
      setCloneStep(2);
      addToast("success", "Clone thành công! Hãy tùy chỉnh giỏ quà của bạn.");
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const errorMsg =
        (
          (err?.response as Record<string, unknown>)?.data as Record<
            string,
            unknown
          >
        )?.message ||
        (error instanceof Error ? error.message : "Không thể clone giỏ quà");
      addToast("error", String(errorMsg));
    } finally {
      setCloning(false);
    }
  };

  const handleSaveCustomBasket = async () => {
    if (!clonedBasketId || !customName.trim()) {
      addToast("error", "Thiếu thông tin");
      return;
    }
    if (productDetails.length === 0) {
      addToast("error", "Giỏ quà phải có ít nhất 1 sản phẩm");
      return;
    }
    const errors = validateProductConfig();
    if (errors.length) {
      addToast("error", "Giỏ quà không đúng cấu hình: " + errors[0]);
      return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem("token") || "";
      const updateData: UpdateComboProductRequest = {
        productname: customName,
        status: "ACTIVE",
        productDetails: productDetails.map((pd) => ({
          productid: pd.productid,
          quantity: pd.quantity,
        })),
      };
      await productService.updateCustom(clonedBasketId, updateData, token);
      setCloneStep(3);
      addToast("success", "Lưu giỏ quà thành công!");
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const errorMsg =
        (
          (err?.response as Record<string, unknown>)?.data as Record<
            string,
            unknown
          >
        )?.message ||
        (error instanceof Error ? error.message : "Không thể cập nhật giỏ quà");
      addToast("error", String(errorMsg));
    } finally {
      setSaving(false);
    }
  };

  const configErrors = useMemo(
    () => validateProductConfig(),
    [validateProductConfig],
  );
  const totalCloneValue = useMemo(
    () =>
      productDetails.reduce(
        (s, pd) => s + (pd.quantity || 0) * (pd.childProduct?.price || 0),
        0,
      ),
    [productDetails],
  );

  /*  RENDER  */
  return (
    <div className="min-h-screen bg-[#fdf8f3]">
      {/*  Toast stack  */}
      <div className="fixed bottom-6 right-6 z-99999 flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold animate-in slide-in-from-right duration-300
              ${t.type === "success" ? "bg-emerald-500 text-white" : t.type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}
          >
            {t.type === "success" ? (
              <CheckCircle size={18} />
            ) : t.type === "error" ? (
              <AlertCircle size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            {t.text}
          </div>
        ))}
      </div>

      <ProductHero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {searchParams.get("q") && (
          <div className="mb-8 flex items-center gap-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 rounded-xl bg-tet-primary/10 flex items-center justify-center text-tet-primary">
              <Search size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">
                Kết quả tìm kiếm cho:
              </p>
              <h2 className="text-xl font-bold text-gray-800">
                "{searchParams.get("q")}"
              </h2>
            </div>
            <Link
              to="/products"
              className="ml-auto text-sm font-bold text-tet-accent hover:underline flex items-center gap-1.5"
            >
              <X size={14} /> Xóa tìm kiếm
            </Link>
          </div>
        )}

        <div className="space-y-20 pt-4">
          {/* 
            SECTION 1  Sản phẩm đơn lẻ
         */}
          <section className="flex flex-col lg:flex-row gap-8 items-start relative">
            {/* SIDEBAR FOR SECTION 1 */}
            <div className="w-full lg:w-65 shrink-0 space-y-6 lg:sticky lg:top-24 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              {/* Category Filter */}
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Filter size={16} className="text-tet-primary" /> Danh mục
                </h3>
                <div className="flex flex-col gap-1.5">
                  {[
                    { categoryid: 0, categoryname: "Tất cả" },
                    ...categories,
                  ].map((c) => (
                    <button
                      key={c.categoryid}
                      onClick={() => setSelectedCategory(c.categoryid ?? 0)}
                      className={`text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2.5
                      ${
                        selectedCategory === (c.categoryid ?? 0)
                          ? "bg-tet-primary/5 text-tet-primary"
                          : "bg-transparent text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedCategory === (c.categoryid ?? 0) ? "bg-tet-primary" : "bg-gray-300"}`}
                      />
                      {c.categoryname}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="pt-5 border-t border-gray-100">
                <h3 className="text-base font-bold text-gray-800 mb-3">
                  Khoảng giá
                </h3>
                <div className="flex flex-col gap-1.5 mb-4">
                  {SINGLE_PRICE_PRESETS.map((p) => {
                    const active =
                      singlePriceRange.min === p.range.min &&
                      singlePriceRange.max === p.range.max;
                    return (
                      <button
                        key={p.label}
                        onClick={() => setSinglePriceRange(p.range)}
                        className={`text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2.5
                        ${
                          active
                            ? "bg-tet-accent/5 text-tet-accent"
                            : "bg-transparent text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-tet-accent" : "bg-gray-300"}`}
                        />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={singlePriceRange.min ?? ""}
                    onChange={(e) =>
                      setSinglePriceRange((prev) => ({
                        ...prev,
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="Từ"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-tet-accent transition-all"
                  />
                  <span className="text-gray-300">-</span>
                  <input
                    type="number"
                    min={0}
                    value={singlePriceRange.max ?? ""}
                    onChange={(e) =>
                      setSinglePriceRange((prev) => ({
                        ...prev,
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="Đến"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-tet-accent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <SectionHeader
                    icon=""
                    title="Sản phẩm đơn lẻ"
                    count={filteredSingleProducts.length}
                    sub="Chọn từng món quà yêu thích cho mùa Tết"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 sm:mt-1">
                  <span className="text-sm font-semibold text-gray-500">
                    Sắp xếp:
                  </span>
                  <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
                    {[
                      { value: "name", label: "Tên A→Z" },
                      { value: "price-asc", label: "Giá tăng" },
                      { value: "price-desc", label: "Giá giảm" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSingleSortBy(opt.value)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all
                        ${
                          singleSortBy === opt.value
                            ? "bg-gray-100 text-gray-800"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {singleLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredSingleProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <Package size={64} strokeWidth={1.2} />
                  <p className="mt-4 text-base font-semibold text-gray-400">
                    Không có sản phẩm nào
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    Thử chọn danh mục khác
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {filteredSingleProducts
                      .slice(
                        (singlePage - 1) * ITEMS_PER_PAGE,
                        singlePage * ITEMS_PER_PAGE,
                      )
                      .map((product) => (
                        <motion.div
                          key={product.productid}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                        >
                          <ProductCard
                            id={product.productid}
                            title={product.productname ?? "Sản phẩm Tết"}
                            price={(product.price ?? 0).toLocaleString("vi-VN")}
                            image={product.imageUrl ?? ""}
                            onAddToCart={(qty) => addToCart(product, qty)}
                          />
                        </motion.div>
                      ))}
                  </div>

                  {/* Pagination UI */}
                  {filteredSingleProducts.length > ITEMS_PER_PAGE && (
                    <div className="mt-12 flex justify-center items-center gap-2">
                      <button
                        disabled={singlePage === 1}
                        onClick={() => {
                          setSinglePage((p) => p - 1);
                          window.scrollTo({ top: 300, behavior: "smooth" });
                        }}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                      >
                        Trang trước
                      </button>
                      <div className="flex gap-1.5">
                        {Array.from({
                          length: Math.ceil(
                            filteredSingleProducts.length / ITEMS_PER_PAGE,
                          ),
                        }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSinglePage(i + 1);
                              window.scrollTo({ top: 300, behavior: "smooth" });
                            }}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all
                          ${singlePage === i + 1 ? "bg-tet-primary text-white shadow-lg shadow-tet-primary/30" : "bg-white text-gray-500 border border-gray-100 hover:border-tet-primary"}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        disabled={
                          singlePage ===
                          Math.ceil(
                            filteredSingleProducts.length / ITEMS_PER_PAGE,
                          )
                        }
                        onClick={() => {
                          setSinglePage((p) => p + 1);
                          window.scrollTo({ top: 300, behavior: "smooth" });
                        }}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                      >
                        Trang sau
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* 
            SECTION 2  Giỏ quà Tết
         */}
          <section className="flex flex-col lg:flex-row gap-8 items-start relative">
            {/* SIDEBAR FOR SECTION 2 */}
            <div className="w-full lg:w-65 shrink-0 space-y-6 lg:sticky lg:top-24 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              {/* Search Filter */}
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Filter size={16} className="text-tet-primary" /> Tìm kiếm
                </h3>
                <div className="relative w-full">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={basketSearch}
                    onChange={(e) => setBasketSearch(e.target.value)}
                    placeholder="Tìm giỏ quà..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-tet-accent transition-all shadow-sm"
                  />
                  {basketSearch && (
                    <button
                      onClick={() => setBasketSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Price Filter */}
              <div className="pt-5 border-t border-gray-100">
                <h3 className="text-base font-bold text-gray-800 mb-3">
                  Khoảng giá
                </h3>
                <div className="flex flex-col gap-1.5 mb-4">
                  {BASKET_PRICE_PRESETS.map((p) => {
                    const active =
                      basketPriceRange.min === p.range.min &&
                      basketPriceRange.max === p.range.max;
                    return (
                      <button
                        key={p.label}
                        onClick={() => setBasketPriceRange(p.range)}
                        className={`text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2.5
                        ${
                          active
                            ? "bg-tet-accent/5 text-tet-accent"
                            : "bg-transparent text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-tet-accent" : "bg-gray-300"}`}
                        />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={basketPriceRange.min ?? ""}
                    onChange={(e) =>
                      setBasketPriceRange((prev) => ({
                        ...prev,
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="Từ"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-tet-accent transition-all"
                  />
                  <span className="text-gray-300">-</span>
                  <input
                    type="number"
                    min={0}
                    value={basketPriceRange.max ?? ""}
                    onChange={(e) =>
                      setBasketPriceRange((prev) => ({
                        ...prev,
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="Đến"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-tet-accent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* MAIN CONTENT FOR SECTION 2 */}
            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <SectionHeader
                    icon=""
                    title="Giỏ quà Tết"
                    count={filteredBaskets.length}
                    sub="Bộ sưu tập giỏ quà sang trọng, tặng người thân yêu"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 sm:mt-1">
                  <span className="text-sm font-semibold text-gray-500">
                    Sắp xếp:
                  </span>
                  <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
                    {[
                      { value: "price-asc", label: "Giá tăng" },
                      { value: "price-desc", label: "Giá giảm" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setBasketSortBy(opt.value)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all
                        ${
                          basketSortBy === opt.value
                            ? "bg-gray-100 text-gray-800"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {basketLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <SkeletonCard key={i} tall />
                  ))}
                </div>
              ) : filteredBaskets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <Gift size={64} strokeWidth={1.2} />
                  <p className="mt-4 text-base font-semibold text-gray-400">
                    {basketSearch
                      ? "Không tìm thấy kết quả"
                      : "Chưa có giỏ quà nào"}
                  </p>
                  {basketSearch && (
                    <button
                      onClick={() => setBasketSearch("")}
                      className="mt-3 text-sm text-tet-accent font-semibold underline"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {filteredBaskets
                      .slice(
                        (basketPage - 1) * ITEMS_PER_PAGE,
                        basketPage * ITEMS_PER_PAGE,
                      )
                      .map((basket) => (
                        <motion.div
                          key={basket.productid}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          className="relative"
                        >
                          <ProductCard
                            id={basket.productid}
                            title={basket.productname ?? "Giỏ quà Tết"}
                            price={(basket.price ?? 0).toLocaleString("vi-VN")}
                            image={basket.imageUrl ?? ""}
                            onAddToCart={(qty) => addToCart(basket, qty)}
                          />
                          {/* Extra action for custom basket */}
                          <div className="absolute top-5 right-5 flex flex-col gap-2 z-20">
                            <button
                              onClick={() => handleOpenCloneModal(basket)}
                              className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-purple-600 shadow-lg hover:bg-purple-600 hover:text-white transition-all active:scale-95"
                              title="Tùy chỉnh giỏ quà"
                            >
                              <Copy size={16} />
                            </button>
                            <Link
                              to={`/product/${basket.productid}`}
                              className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-tet-primary shadow-lg hover:bg-tet-primary hover:text-white transition-all active:scale-95"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                  </div>

                  {/* Pagination UI */}
                  {filteredBaskets.length > ITEMS_PER_PAGE && (
                    <div className="mt-12 flex justify-center items-center gap-2">
                      <button
                        disabled={basketPage === 1}
                        onClick={() => {
                          setBasketPage((p) => p - 1);
                          window.scrollTo({ top: 800, behavior: "smooth" });
                        }}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                      >
                        Trang trước
                      </button>
                      <div className="flex gap-1.5">
                        {Array.from({
                          length: Math.ceil(
                            filteredBaskets.length / ITEMS_PER_PAGE,
                          ),
                        }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setBasketPage(i + 1);
                              window.scrollTo({ top: 800, behavior: "smooth" });
                            }}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all
                          ${basketPage === i + 1 ? "bg-tet-primary text-white shadow-lg shadow-tet-primary/30" : "bg-white text-gray-500 border border-gray-100 hover:border-tet-primary"}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        disabled={
                          basketPage ===
                          Math.ceil(filteredBaskets.length / ITEMS_PER_PAGE)
                        }
                        onClick={() => {
                          setBasketPage((p) => p + 1);
                          window.scrollTo({ top: 800, behavior: "smooth" });
                        }}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                      >
                        Trang sau
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/* 
          DETAILS MODAL (Removed - navigated to detail page instead)
       */}

        {/* 
          CLONE MODAL
       */}
        {showCloneModal && cloneProduct && (
          <div
            className="fixed inset-0 z-9990 flex items-center justify-center p-4"
            onClick={handleCloseCloneModal}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="shrink-0 bg-linear-to-r from-purple-600 to-pink-500 px-8 pt-8 pb-6 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold flex items-center gap-3">
                      <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Copy size={20} />
                      </div>
                      Clone & Tùy chỉnh giỏ quà
                    </h2>
                    <p className="text-sm text-white/80 mt-2">
                      Nguồn:{" "}
                      <span className="font-semibold text-white/95">
                        {cloneProduct.productname}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={handleCloseCloneModal}
                    disabled={cloning}
                    className="p-2 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
                {/* Step indicator */}
                <div className="flex items-center gap-2 -mx-8 px-8 -mb-6 pb-6 border-t border-white/20 pt-6">
                  {[
                    { num: 1, label: "Đặt tên" },
                    { num: 2, label: "Tùy chỉnh" },
                    { num: 3, label: "Hoàn thành" },
                  ].map((step, i) => (
                    <div key={step.num} className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all backdrop-blur-sm
                      ${cloneStep > step.num ? "bg-emerald-400 text-white" : cloneStep === step.num ? "bg-white text-purple-600" : "bg-white/20 text-white/60"}`}
                      >
                        {cloneStep > step.num ? (
                          <CheckCircle size={14} />
                        ) : (
                          <span className="w-5 h-5 flex items-center justify-center bg-white/30 rounded-full">
                            {step.num}
                          </span>
                        )}
                        {step.label}
                      </div>
                      {i < 2 && (
                        <ChevronRight
                          size={16}
                          className="text-white/40 shrink-0"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {/*  STEP 1: Name  */}
                {cloneStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md mx-auto space-y-6 py-6"
                  >
                    <div className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-purple-100 to-pink-100 shadow-lg"
                      >
                        <Gift size={40} className="text-purple-600" />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-extrabold text-gray-800">
                          Đặt tên cho giỏ quà
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Sau đó bạn có thể tùy chỉnh nội dung bên trong
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Tên giỏ quà <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCloneTemplate()
                        }
                        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                        placeholder="VD: Giỏ quà ba mẹ 2025"
                      />
                    </div>
                    <div className="bg-linear-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 text-sm text-orange-900 shadow-sm">
                      <p className="font-semibold mb-1.5">
                        📦 Giỏ gốc: {cloneProduct.productname}
                      </p>
                      <p className="text-xs text-orange-700">
                        {(cloneProduct.price || 0).toLocaleString("vi-VN")}đ •{" "}
                        {cloneProduct.productDetails?.length || 0} sản phẩm
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={handleCloneTemplate}
                      disabled={cloning || !customName.trim()}
                      className="w-full py-4 bg-linear-to-r from-purple-600 to-pink-500 text-white font-bold rounded-2xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                      {cloning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Copy size={18} /> Tạo bản sao
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}

                {/*  STEP 2: Customize  */}
                {cloneStep === 2 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left  Basket contents */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-gray-700">
                          Giỏ quà của bạn{" "}
                          <span className="text-gray-400 font-normal">
                            ({productDetails.length} SP)
                          </span>
                        </p>
                        <p className="text-sm font-extrabold text-purple-600">
                          {totalCloneValue.toLocaleString("vi-VN")}đ
                        </p>
                      </div>

                      {/* Config rules */}
                      {selectedConfig?.configDetails?.length ? (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {selectedConfig.configDetails.map((detail, idx) => {
                            const current = productDetails
                              .filter(
                                (pd) =>
                                  pd.childProduct?.categoryid ===
                                  detail.categoryid,
                              )
                              .reduce((s, pd) => s + (pd.quantity || 0), 0);
                            const ok = current === detail.quantity;
                            const over = current > detail.quantity;
                            return (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                              ${ok ? "bg-emerald-100 text-emerald-700" : over ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                              >
                                {ok ? (
                                  <CheckCircle size={10} />
                                ) : (
                                  <AlertCircle size={10} />
                                )}
                                {detail.categoryName} {current}/
                                {detail.quantity}
                              </span>
                            );
                          })}
                        </div>
                      ) : null}

                      {/* Basket item list */}
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {productDetails.length === 0 ? (
                          <div className="flex flex-col items-center py-10 text-gray-200">
                            <Package size={48} strokeWidth={1} />
                            <p className="mt-2 text-sm text-gray-400">
                              Chưa có sản phẩm
                            </p>
                          </div>
                        ) : (
                          productDetails.map((detail, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                            >
                              {detail.childProduct?.imageUrl ? (
                                <img
                                  src={detail.childProduct.imageUrl}
                                  alt={detail.childProduct.productname}
                                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                                  <Gift size={18} className="text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {detail.childProduct?.productname}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {(
                                    (detail.quantity || 0) *
                                    (detail.childProduct?.price || 0)
                                  ).toLocaleString("vi-VN")}
                                  đ
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      index,
                                      (detail.quantity || 1) - 1,
                                    )
                                  }
                                  disabled={(detail.quantity || 1) <= 1}
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-sm font-bold"
                                ></button>
                                <span className="w-7 text-center text-sm font-bold text-gray-700">
                                  {detail.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      index,
                                      (detail.quantity || 1) + 1,
                                    )
                                  }
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-bold"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemoveProductDetail(index)
                                  }
                                  className="ml-1 p-1 text-red-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Config errors */}
                      {configErrors.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                          <p className="text-xs font-bold text-red-600 mb-1">
                            {" "}
                            Chưa đúng cấu hình:
                          </p>
                          {configErrors.map((e, i) => (
                            <p key={i} className="text-xs text-red-500">
                              {" "}
                              {e}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right  Add products */}
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-3">
                        Thêm sản phẩm{" "}
                        <span className="text-gray-400 font-normal">
                          (nhấn để thêm)
                        </span>
                      </p>
                      <div className="relative mb-3">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Tìm sản phẩm..."
                          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5 max-h-85 overflow-y-auto">
                        {filteredAvailableProducts.map((product) => {
                          const inCart = productDetails.find(
                            (pd) => pd.productid === product.productid,
                          );
                          return (
                            <div
                              key={product.productid}
                              onClick={() => handleAddProduct(product)}
                              className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border border-transparent hover:border-purple-200 hover:bg-purple-50 transition-all"
                            >
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.productname}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                  <Gift size={14} className="text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {product.productname}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {(product.price || 0).toLocaleString("vi-VN")}
                                  đ
                                </p>
                              </div>
                              {inCart ? (
                                <span className="shrink-0 text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                                  {inCart.quantity}
                                </span>
                              ) : (
                                <span className="shrink-0 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                                  + Thêm
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Name field */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                          Tên giỏ quà
                        </label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/*  STEP 3: Done  */}
                {cloneStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-24 h-24 rounded-full bg-linear-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-lg"
                    >
                      <CheckCircle size={48} className="text-emerald-500" />
                    </motion.div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-gray-800">
                        Hoàn thành!
                      </h3>
                      <p className="text-gray-500 max-w-sm mt-2">
                        Giỏ quà{" "}
                        <span className="font-semibold text-gray-700 text-base">
                          "{customName}"
                        </span>{" "}
                        đã được lưu thành công với{" "}
                        <span className="font-bold text-purple-600">
                          {productDetails.length}
                        </span>{" "}
                        sản phẩm.
                      </p>
                    </div>
                    <div className="pt-4 text-center">
                      <p className="text-sm text-gray-500 mb-1">Tổng giá trị</p>
                      <p className="text-4xl font-extrabold text-transparent bg-linear-to-r from-purple-600 to-pink-500 bg-clip-text">
                        {totalCloneValue.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer actions */}
              <div className="shrink-0 px-8 py-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                <button
                  onClick={handleCloseCloneModal}
                  disabled={cloning || saving}
                  className="px-6 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 disabled:opacity-50 transition-all hover:border-gray-400"
                >
                  {cloneStep === 3 ? "Hoàn thành" : "Hủy"}
                </button>
                <div className="flex gap-3">
                  {cloneStep === 2 && (
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={handleSaveCustomBasket}
                      disabled={
                        saving ||
                        productDetails.length === 0 ||
                        configErrors.length > 0
                      }
                      className="px-7 py-2.5 bg-linear-to-r from-purple-600 to-pink-500 text-white text-sm font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Lưu giỏ quà
                        </>
                      )}
                    </motion.button>
                  )}
                  {cloneStep === 3 && (
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={() => {
                        handleCloseCloneModal();
                        addToast(
                          "info",
                          "Chức năng thanh toán đang phát triển",
                        );
                      }}
                      className="px-7 py-2.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl hover:shadow-lg flex items-center gap-2 transition-all"
                    >
                      <ShoppingCart size={16} /> Thanh toán ngay
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
