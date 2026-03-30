import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, Link } from "react-router-dom";
import { Gift, X, Eye, Copy, Save, Trash2, Package, ShoppingCart, Search, CheckCircle, AlertCircle, ChevronRight, Sparkles, Filter, ArrowUpDown } from "lucide-react";
import ProductHero from "../components/ProductHero";
import ProductCard from "@/components/common/ProductCard";
import { useCart } from "@/feature/cart/context/CartContext";
import { productService, type Product, type ProductDetailRequest, type UpdateComboProductRequest } from "@/api/productService";
import { configService, type ProductConfig } from "@/api/configService";
import { categoryService, type Category } from "@/api/categoryService";

/*  Types  */
interface ProductDetailWithChild extends ProductDetailRequest {
  childProduct?: Product;
}
type ToastItem = { id: number; type: "success" | "error" | "info"; text: string };
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
function SectionHeader({ icon, title, count, sub }: { icon: string; title: string; count: number; sub?: string }) {
  return (
    <div className="flex items-end gap-4 mb-8">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">{title}</h2>
          {sub && <p className="text-sm text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <span className="mb-1 text-xs font-bold text-white bg-tet-accent px-2.5 py-0.5 rounded-full">{count}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-tet-accent/40 to-transparent ml-2 mb-1.5" />
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
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  /*  Pagination constants  */
  const ITEMS_PER_PAGE = 12;
  const [singlePage, setSinglePage] = useState(1);
  const [basketPage, setBasketPage] = useState(1);

  /* Reset page when filters change */
  useEffect(() => setSinglePage(1), [selectedCategory, singlePriceRange, singleSortBy, searchParams]);
  useEffect(() => setBasketPage(1), [basketSearch, basketPriceRange, basketSortBy, searchParams]);

  /*  Details modal (Removed - navigated to detail page instead)  */
  // const [selectedTemplate, setSelectedTemplate] = useState<Product | null>(null);
  // const [showDetailsModal, setShowDetailsModal] = useState(false);

  /*  Clone modal  */
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneStep, setCloneStep] = useState<1 | 2 | 3>(1); // 1=name, 2=customize, 3=done
  const [cloning, setCloning] = useState(false);
  const [cloneProduct, setCloneProduct] = useState<Product | null>(null);
  const [clonedBasketId, setClonedBasketId] = useState<number | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<ProductConfig | null>(null);
  const [customName, setCustomName] = useState("");
  const [productDetails, setProductDetails] = useState<ProductDetailWithChild[]>([]);
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
        const [productsRes, basketsRes, catsRes] = await Promise.all([
          productService.getAll(),
          productService.templates.getAdminBaskets(),
          categoryService.getAll(),
        ]);
        const allProducts: Product[] = (productsRes as any)?.data?.data ?? (productsRes as any)?.data ?? [];
        setSingleProducts(allProducts.filter((p: Product) => p.status === "ACTIVE" && !p.configid));
        setSingleLoading(false);
        const allBaskets: Product[] = (basketsRes as any)?.data?.data ?? (basketsRes as any)?.data ?? [];
        setBaskets(allBaskets.filter((p: Product) => p.status === "ACTIVE"));
        setBasketLoading(false);
        const cats: Category[] = (catsRes as any)?.data?.data ?? (catsRes as any)?.data ?? [];
        setCategories(cats);
      } catch (err) {
        console.error("Error loading ProductPage data:", err);
        setSingleLoading(false);
        setBasketLoading(false);
      }
    };
    fetchAll();
  }, []);

  /*  Filtered / sorted single products  */
  const filteredSingleProducts = useMemo(() => {
    let list = [...singleProducts];
    const query = searchParams.get("q")?.toLowerCase();
    
    if (query) {
      list = list.filter(p => 
        p.productname?.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) list = list.filter(p => p.categoryid === selectedCategory);
    if (singlePriceRange.min !== undefined) list = list.filter(p => (p.price ?? 0) >= singlePriceRange.min!);
    if (singlePriceRange.max !== undefined) list = list.filter(p => (p.price ?? 0) <= singlePriceRange.max!);
    
    switch (singleSortBy) {
      case "price-asc":  return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case "price-desc": return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      default:           return list.sort((a, b) => (a.productname ?? "").localeCompare(b.productname ?? "", "vi"));
    }
  }, [singleProducts, singleSortBy, selectedCategory, singlePriceRange, searchParams]);

  /*  Filtered / sorted baskets  */
  const filteredBaskets = useMemo(() => {
    let list = [...baskets];
    const query = searchParams.get("q")?.toLowerCase();

    if (query) {
      list = list.filter(p => 
        p.productname?.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query)
      );
    }

    if (basketSearch.trim()) {
      const q = basketSearch.toLowerCase();
      list = list.filter(p => p.productname?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (basketPriceRange.min !== undefined) list = list.filter(p => (p.price ?? 0) >= basketPriceRange.min!);
    if (basketPriceRange.max !== undefined) list = list.filter(p => (p.price ?? 0) <= basketPriceRange.max!);
    switch (basketSortBy) {
      case "price-desc": return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      default:           return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    }
  }, [baskets, basketSortBy, basketSearch, basketPriceRange, searchParams]);

  /*  Filtered available products for clone modal  */
  const filteredAvailableProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts.slice(0, 12);
    const q = productSearch.toLowerCase();
    return availableProducts.filter(p => p.productname?.toLowerCase().includes(q)).slice(0, 12);
  }, [availableProducts, productSearch]);

  /*  Cart  */
  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
      addToast("success", `Đã thêm "${product.productname}" vào giỏ hàng!`);
    } catch {
      addToast("error", "Không thể thêm vào giỏ hàng.");
    }
  };

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
    setProductDetails((template.productDetails || []).map(pd => ({
      productid: pd.productid, quantity: pd.quantity, childProduct: pd.childProduct,
    })));
    try {
      if (template.configid) {
        const configs = await configService.getAllConfig();
        setSelectedConfig(configs.find(c => c.configid === template.configid) || null);
      } else {
        setSelectedConfig(null);
      }
      const productsRes = await productService.getAll();
      const rawData = productsRes.data;
      const allProds: Product[] = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.items) ? rawData.items : [];
      setAvailableProducts(allProds.filter((p: Product) => p.status === "ACTIVE" && !p.configid));
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
    const existing = productDetails.find(pd => pd.productid === product.productid);
    if (existing) {
      const idx = productDetails.indexOf(existing);
      handleQuantityChange(idx, (existing.quantity || 1) + 1);
      return;
    }
    setProductDetails(prev => [...prev, { productid: product.productid, quantity: 1, childProduct: product }]);
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setProductDetails(prev => { const u = [...prev]; u[index] = { ...u[index], quantity: newQuantity }; return u; });
  };

  const handleRemoveProductDetail = (index: number) => {
    setProductDetails(prev => prev.filter((_, i) => i !== index));
  };

  const validateProductConfig = (): string[] => {
    if (!selectedConfig?.configDetails?.length) return [];
    const categoryCount: Record<number, number> = {};
    productDetails.forEach(pd => {
      const cid = pd.childProduct?.categoryid;
      if (cid) categoryCount[cid] = (categoryCount[cid] || 0) + (pd.quantity || 0);
    });
    const errors: string[] = [];
    selectedConfig.configDetails.forEach(detail => {
      const actual = categoryCount[detail.categoryid] || 0;
      if (actual !== detail.quantity)
        errors.push(`${detail.categoryName}: cần ${detail.quantity}, hiện ${actual}`);
    });
    return errors;
  };

  const handleCloneTemplate = async () => {
    if (!customName.trim()) { addToast("error", "Vui lòng nhập tên giỏ quà"); return; }
    const token = localStorage.getItem("token") || "";
    if (!token) { addToast("error", "Vui lòng đăng nhập để clone giỏ quà"); return; }
    try {
      setCloning(true);
      const response = await productService.templates.clone(cloneProduct!.productid!, { customName }, token);
      const clonedBasket = response.data;
      setClonedBasketId(clonedBasket.productid);
      if (clonedBasket.productDetails) {
        setProductDetails(clonedBasket.productDetails.map((pd: any) => ({
          productid: pd.productid, quantity: pd.quantity, childProduct: pd.childProduct,
        })));
      }
      setCloneStep(2);
      addToast("success", "Clone thành công! Hãy tùy chỉnh giỏ quà của bạn.");
    } catch (error: any) {
      addToast("error", error.response?.data?.message || error.message || "Không thể clone giỏ quà");
    } finally {
      setCloning(false);
    }
  };

  const handleSaveCustomBasket = async () => {
    if (!clonedBasketId || !customName.trim()) { addToast("error", "Thiếu thông tin"); return; }
    if (productDetails.length === 0) { addToast("error", "Giỏ quà phải có ít nhất 1 sản phẩm"); return; }
    const errors = validateProductConfig();
    if (errors.length) { addToast("error", "Giỏ quà không đúng cấu hình: " + errors[0]); return; }
    try {
      setSaving(true);
      const token = localStorage.getItem("token") || "";
      const updateData: UpdateComboProductRequest = {
        productname: customName, status: "ACTIVE",
        productDetails: productDetails.map(pd => ({ productid: pd.productid, quantity: pd.quantity })),
      };
      await productService.updateCustom(clonedBasketId, updateData, token);
      setCloneStep(3);
      addToast("success", "Lưu giỏ quà thành công!");
    } catch (error: any) {
      addToast("error", error.response?.data?.message || error.message || "Không thể cập nhật giỏ quà");
    } finally {
      setSaving(false);
    }
  };

  const configErrors = useMemo(() => validateProductConfig(), [productDetails, selectedConfig]);
  const totalCloneValue = useMemo(
    () => productDetails.reduce((s, pd) => s + (pd.quantity || 0) * (pd.childProduct?.price || 0), 0),
    [productDetails]
  );

  /*  RENDER  */
  return (
    <div className="min-h-screen bg-[#fdf8f3]">
      {/*  Toast stack  */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold animate-in slide-in-from-right duration-300
              ${t.type === "success" ? "bg-emerald-500 text-white" : t.type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}
          >
            {t.type === "success" ? <CheckCircle size={18} /> : t.type === "error" ? <AlertCircle size={18} /> : <Sparkles size={18} />}
            {t.text}
          </div>
        ))}
      </div>

      <ProductHero />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {searchParams.get("q") && (
          <div className="mb-8 flex items-center gap-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 rounded-xl bg-tet-primary/10 flex items-center justify-center text-tet-primary">
              <Search size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Kết quả tìm kiếm cho:</p>
              <h2 className="text-xl font-bold text-gray-800">"{searchParams.get("q")}"</h2>
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
        <section>
          <SectionHeader
            icon=""
            title="Sản phẩm đơn lẻ"
            count={filteredSingleProducts.length}
            sub="Chọn từng món quà yêu thích cho mùa Tết"
          />

          {/* Controls */}
          <div className="flex flex-col gap-4 mb-7">
            {/* Category chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <span className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-gray-400 pr-1">
                <Filter size={12} /> Danh mục:
              </span>
              {[{ categoryid: 0, categoryname: "Tất cả" }, ...categories].map(c => (
                <button
                  key={c.categoryid}
                  onClick={() => setSelectedCategory(c.categoryid ?? 0)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200
                    ${selectedCategory === (c.categoryid ?? 0)
                      ? "bg-tet-primary text-white border-tet-primary shadow-sm shadow-tet-primary/30"
                      : "bg-white text-gray-600 border-gray-200 hover:border-tet-primary/50 hover:text-tet-primary"}`}
                >
                  {c.categoryname}
                </button>
              ))}
            </div>
            {/* Price range */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="shrink-0 text-xs font-semibold text-gray-400">₫ Khoảng giá:</span>
              {SINGLE_PRICE_PRESETS.map(p => {
                const active = singlePriceRange.min === p.range.min && singlePriceRange.max === p.range.max;
                return (
                  <button
                    key={p.label}
                    onClick={() => setSinglePriceRange(p.range)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                      ${active
                        ? "bg-tet-accent text-white border-tet-accent"
                        : "bg-white text-gray-600 border-gray-200 hover:border-tet-accent/50 hover:text-tet-accent"}`}
                  >
                    {p.label}
                  </button>
                );
              })}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="number" min={0}
                  value={singlePriceRange.min ?? ""}
                  onChange={e => setSinglePriceRange(prev => ({ ...prev, min: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Từ"
                  className="w-24 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-center focus:outline-none focus:border-tet-accent transition-all"
                />
                <span className="text-gray-300 font-bold">—</span>
                <input
                  type="number" min={0}
                  value={singlePriceRange.max ?? ""}
                  onChange={e => setSinglePriceRange(prev => ({ ...prev, max: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Đến"
                  className="w-24 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-center focus:outline-none focus:border-tet-accent transition-all"
                />
                <span className="text-xs text-gray-400 font-semibold">đ</span>
                {(singlePriceRange.min !== undefined || singlePriceRange.max !== undefined) && (
                  <button onClick={() => setSinglePriceRange({})} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
            {/* Sort */}
            <div className="flex items-center gap-2 self-end">
              <ArrowUpDown size={14} className="text-gray-400" />
              <div className="flex gap-1.5">
                {[
                  { value: "name", label: "Tên A→Z" },
                  { value: "price-asc", label: "Giá tăng" },
                  { value: "price-desc", label: "Giá giảm" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSingleSortBy(opt.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                      ${singleSortBy === opt.value
                        ? "bg-tet-accent text-white"
                        : "bg-white border border-gray-200 text-gray-500 hover:border-tet-accent/50"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {singleLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredSingleProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Package size={64} strokeWidth={1.2} />
              <p className="mt-4 text-base font-semibold text-gray-400">Không có sản phẩm nào</p>
              <p className="text-sm text-gray-300 mt-1">Thử chọn danh mục khác</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredSingleProducts.slice((singlePage - 1) * ITEMS_PER_PAGE, singlePage * ITEMS_PER_PAGE).map(product => (
                  <motion.div
                    key={product.productid}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <ProductCard
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
                    onClick={() => { setSinglePage(p => p - 1); window.scrollTo({ top: 300, behavior: "smooth" }); }}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                  >
                    Trang trước
                  </button>
                  <div className="flex gap-1.5">
                    {Array.from({ length: Math.ceil(filteredSingleProducts.length / ITEMS_PER_PAGE) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setSinglePage(i + 1); window.scrollTo({ top: 300, behavior: "smooth" }); }}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all
                          ${singlePage === i + 1 ? "bg-tet-primary text-white shadow-lg shadow-tet-primary/30" : "bg-white text-gray-500 border border-gray-100 hover:border-tet-primary"}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={singlePage === Math.ceil(filteredSingleProducts.length / ITEMS_PER_PAGE)}
                    onClick={() => { setSinglePage(p => p + 1); window.scrollTo({ top: 300, behavior: "smooth" }); }}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* 
            SECTION 2  Giỏ quà Tết
         */}
        <section>
          <SectionHeader
            icon=""
            title="Giỏ quà Tết"
            count={filteredBaskets.length}
            sub="Bộ sưu tập giỏ quà sang trọng, tặng người thân yêu"
          />

          {/* Controls */}
          <div className="flex flex-col gap-3 mb-7">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={basketSearch}
                  onChange={e => setBasketSearch(e.target.value)}
                  placeholder="Tìm kiếm giỏ quà..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tet-accent/40 focus:border-tet-accent transition-all shadow-sm"
                />
                {basketSearch && (
                  <button onClick={() => setBasketSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-gray-400" />
                <div className="flex gap-1.5">
                  {[
                    { value: "price-asc", label: "Giá tăng" },
                    { value: "price-desc", label: "Giá giảm" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setBasketSortBy(opt.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                        ${basketSortBy === opt.value
                          ? "bg-tet-accent text-white"
                          : "bg-white border border-gray-200 text-gray-500 hover:border-tet-accent/50"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Price range */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="shrink-0 text-xs font-semibold text-gray-400">₫ Khoảng giá:</span>
              {BASKET_PRICE_PRESETS.map(p => {
                const active = basketPriceRange.min === p.range.min && basketPriceRange.max === p.range.max;
                return (
                  <button
                    key={p.label}
                    onClick={() => setBasketPriceRange(p.range)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                      ${active
                        ? "bg-tet-accent text-white border-tet-accent"
                        : "bg-white text-gray-600 border-gray-200 hover:border-tet-accent/50 hover:text-tet-accent"}`}
                  >
                    {p.label}
                  </button>
                );
              })}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="number" min={0}
                  value={basketPriceRange.min ?? ""}
                  onChange={e => setBasketPriceRange(prev => ({ ...prev, min: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Từ"
                  className="w-24 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-center focus:outline-none focus:border-tet-accent transition-all"
                />
                <span className="text-gray-300 font-bold">—</span>
                <input
                  type="number" min={0}
                  value={basketPriceRange.max ?? ""}
                  onChange={e => setBasketPriceRange(prev => ({ ...prev, max: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Đến"
                  className="w-24 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-center focus:outline-none focus:border-tet-accent transition-all"
                />
                <span className="text-xs text-gray-400 font-semibold">đ</span>
                {(basketPriceRange.min !== undefined || basketPriceRange.max !== undefined) && (
                  <button onClick={() => setBasketPriceRange({})} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {basketLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} tall />)}
            </div>
          ) : filteredBaskets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Gift size={64} strokeWidth={1.2} />
              <p className="mt-4 text-base font-semibold text-gray-400">{basketSearch ? "Không tìm thấy kết quả" : "Chưa có giỏ quà nào"}</p>
              {basketSearch && (
                <button onClick={() => setBasketSearch("")} className="mt-3 text-sm text-tet-accent font-semibold underline">Xóa bộ lọc</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredBaskets.slice((basketPage - 1) * ITEMS_PER_PAGE, basketPage * ITEMS_PER_PAGE).map(basket => (
                  <motion.div
                    key={basket.productid}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <ProductCard
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
                    onClick={() => { setBasketPage(p => p - 1); window.scrollTo({ top: 800, behavior: "smooth" }); }}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                  >
                    Trang trước
                  </button>
                  <div className="flex gap-1.5">
                    {Array.from({ length: Math.ceil(filteredBaskets.length / ITEMS_PER_PAGE) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setBasketPage(i + 1); window.scrollTo({ top: 800, behavior: "smooth" }); }}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all
                          ${basketPage === i + 1 ? "bg-tet-primary text-white shadow-lg shadow-tet-primary/30" : "bg-white text-gray-500 border border-gray-100 hover:border-tet-primary"}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={basketPage === Math.ceil(filteredBaskets.length / ITEMS_PER_PAGE)}
                    onClick={() => { setBasketPage(p => p + 1); window.scrollTo({ top: 800, behavior: "smooth" }); }}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* 
          DETAILS MODAL (Removed - navigated to detail page instead)
       */}

      {/* 
          CLONE MODAL
       */}
      {showCloneModal && cloneProduct && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" onClick={handleCloseCloneModal}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                    <Copy size={18} className="text-purple-500" /> Clone & Tùy chỉnh giỏ quà
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">Từ: <span className="font-semibold text-gray-600">{cloneProduct.productname}</span></p>
                </div>
                <button onClick={handleCloseCloneModal} disabled={cloning} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-all">
                  <X size={20} />
                </button>
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {[
                  { num: 1, label: "Đặt tên" },
                  { num: 2, label: "Tùy chỉnh" },
                  { num: 3, label: "Hoàn thành" },
                ].map((step, i) => (
                  <div key={step.num} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                      ${cloneStep > step.num ? "bg-emerald-100 text-emerald-700" : cloneStep === step.num ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-400"}`}
                    >
                      {cloneStep > step.num ? <CheckCircle size={12} /> : <span>{step.num}</span>}
                      {step.label}
                    </div>
                    {i < 2 && <ChevronRight size={14} className="text-gray-300 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">

              {/*  STEP 1: Name  */}
              {cloneStep === 1 && (
                <div className="max-w-md mx-auto space-y-6 py-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 mb-4">
                      <Gift size={32} className="text-purple-600" />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-800">Đặt tên cho giỏ quà của bạn</h3>
                    <p className="text-sm text-gray-400 mt-1">Sau đó bạn có thể tùy chỉnh nội dung bên trong</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tên giỏ quà <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCloneTemplate()}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 transition-all"
                      placeholder="VD: Giỏ quà ba mẹ 2025"
                    />
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-700">
                    <p className="font-semibold mb-0.5"> Gốc: {cloneProduct.productname}</p>
                    <p className="text-xs text-orange-500">{(cloneProduct.price || 0).toLocaleString("vi-VN")}đ &nbsp;&nbsp; {cloneProduct.productDetails?.length || 0} sản phẩm</p>
                  </div>
                  <button
                    onClick={handleCloneTemplate}
                    disabled={cloning || !customName.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                  >
                    {cloning ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang tạo...</> : <><Copy size={16} /> Tạo bản sao</>}
                  </button>
                </div>
              )}

              {/*  STEP 2: Customize  */}
              {cloneStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left  Basket contents */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-700">Giỏ quà của bạn <span className="text-gray-400 font-normal">({productDetails.length} SP)</span></p>
                      <p className="text-sm font-extrabold text-purple-600">{totalCloneValue.toLocaleString("vi-VN")}đ</p>
                    </div>

                    {/* Config rules */}
                    {selectedConfig?.configDetails?.length ? (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {selectedConfig.configDetails.map((detail, idx) => {
                          const current = productDetails.filter(pd => pd.childProduct?.categoryid === detail.categoryid).reduce((s, pd) => s + (pd.quantity || 0), 0);
                          const ok = current === detail.quantity;
                          const over = current > detail.quantity;
                          return (
                            <span key={idx} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                              ${ok ? "bg-emerald-100 text-emerald-700" : over ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                              {ok ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                              {detail.categoryName} {current}/{detail.quantity}
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
                          <p className="mt-2 text-sm text-gray-400">Chưa có sản phẩm</p>
                        </div>
                      ) : productDetails.map((detail, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          {detail.childProduct?.imageUrl
                            ? <img src={detail.childProduct.imageUrl} alt={detail.childProduct.productname} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            : <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0"><Gift size={18} className="text-gray-400" /></div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{detail.childProduct?.productname}</p>
                            <p className="text-xs text-gray-400">{((detail.quantity || 0) * (detail.childProduct?.price || 0)).toLocaleString("vi-VN")}đ</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleQuantityChange(index, (detail.quantity || 1) - 1)} disabled={(detail.quantity || 1) <= 1}
                              className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-sm font-bold"></button>
                            <span className="w-7 text-center text-sm font-bold text-gray-700">{detail.quantity}</span>
                            <button onClick={() => handleQuantityChange(index, (detail.quantity || 1) + 1)}
                              className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-bold">+</button>
                            <button onClick={() => handleRemoveProductDetail(index)} className="ml-1 p-1 text-red-300 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Config errors */}
                    {configErrors.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-xs font-bold text-red-600 mb-1"> Chưa đúng cấu hình:</p>
                        {configErrors.map((e, i) => <p key={i} className="text-xs text-red-500"> {e}</p>)}
                      </div>
                    )}
                  </div>

                  {/* Right  Add products */}
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3">Thêm sản phẩm <span className="text-gray-400 font-normal">(nhấn để thêm)</span></p>
                    <div className="relative mb-3">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text" value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 max-h-[340px] overflow-y-auto">
                      {filteredAvailableProducts.map(product => {
                        const inCart = productDetails.find(pd => pd.productid === product.productid);
                        return (
                          <div key={product.productid} onClick={() => handleAddProduct(product)}
                            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border border-transparent hover:border-purple-200 hover:bg-purple-50 transition-all">
                            {product.imageUrl
                              ? <img src={product.imageUrl} alt={product.productname} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                              : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Gift size={14} className="text-gray-400" /></div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{product.productname}</p>
                              <p className="text-xs text-gray-400">{(product.price || 0).toLocaleString("vi-VN")}đ</p>
                            </div>
                            {inCart
                              ? <span className="shrink-0 text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">{inCart.quantity}</span>
                              : <span className="shrink-0 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">+ Thêm</span>
                            }
                          </div>
                        );
                      })}
                    </div>

                    {/* Name field */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Tên giỏ quà</label>
                      <input
                        type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/*  STEP 3: Done  */}
              {cloneStep === 3 && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-800">Hoàn thành!</h3>
                  <p className="text-gray-400 max-w-sm">Giỏ quà <span className="font-semibold text-gray-700">"{customName}"</span> đã được lưu thành công với {productDetails.length} sản phẩm.</p>
                  <p className="text-2xl font-extrabold text-tet-accent">{totalCloneValue.toLocaleString("vi-VN")}đ</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={handleCloseCloneModal}
                disabled={cloning || saving}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                {cloneStep === 3 ? "Đóng" : "Hủy"}
              </button>
              <div className="flex gap-2.5">
                {cloneStep === 2 && (
                  <button
                    onClick={handleSaveCustomBasket}
                    disabled={saving || productDetails.length === 0 || configErrors.length > 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-bold rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all"
                  >
                    {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang lưu...</> : <><Save size={15} /> Lưu giỏ quà</>}
                  </button>
                )}
                {cloneStep === 3 && (
                  <button
                    onClick={() => { handleCloseCloneModal(); addToast("info", "Chức năng thanh toán đang phát triển"); }}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl hover:shadow-lg flex items-center gap-2 transition-all"
                  >
                    <ShoppingCart size={15} /> Thanh toán ngay
                  </button>
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
