import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Search,
  Package,
  X,
  Plus,
  Minus,
  ChevronRight,
  Check,
  AlertCircle,
  LogIn,
  Pencil,
  Sparkles,
  Tag,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/feature/cart/context/CartContext";
import { useNavigate } from "react-router-dom";
import {
  productService,
  type Product,
  type CreateComboProductRequest,
} from "@/api/productService";
import { configService, type ProductConfig } from "@/api/configService";

/* ─────────────────────────────────────── types ─────────────────────────────────────── */

interface PickedItem {
  productid: number;
  categoryid: number;
  product: Product;
  quantity: number;
}

/* ════════════════════════════════ Main Page ════════════════════════════════ */

export default function CustomBasketPage() {
  const { addToCart, openCart } = useCart();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [configs, setConfigs] = useState<ProductConfig[]>([]);
  const [singleProducts, setSingleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Customization state ── */
  const [selectedConfig, setSelectedConfig] = useState<ProductConfig | null>(
    null,
  );
  const [customName, setCustomName] = useState("");
  const [pickedItems, setPickedItems] = useState<PickedItem[]>([]);
  const [configSearch, setConfigSearch] = useState("");
  // Search per category slot
  const [slotSearch, setSlotSearch] = useState<Record<number, string>>({});

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* -- Category Products Map (New) -- */
  const [categoryProductsMap, setCategoryProductsMap] = useState<Record<number, Product[]>>({});
  const [categoryLoading, setCategoryLoading] = useState(false);

  /* ── Mobile panel ── */
  const [panelOpen, setPanelOpen] = useState(false);

  /* ── Fetch initial configs ── */
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true);
        const configsData = await configService.getAllConfig();
        setConfigs(configsData);
      } catch (err: unknown) {
        const error = err as unknown;
        setError((error as any)?.message || "Không thể tải danh sách mẫu giỏ.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  /* -- Fetch products for each category slot when config selected -- */
  useEffect(() => {
    const details = selectedConfig?.configDetails;
    if (!details) return;

    const fetchCategoryProducts = async () => {
      try {
        setCategoryLoading(true);
        const categoryIds = details.map(d => d.categoryid);
        
        // Fetch products for each required category in parallel
        const results = await Promise.all(
          categoryIds.map(id => productService.getByCategoryId(id))
        );
        
        const newMap: Record<number, Product[]> = {};
        categoryIds.forEach((id, index) => {
          newMap[id] = (results[index] as any)?.data ?? [];
        });
        
        setCategoryProductsMap(newMap);
      } catch (err) {
        console.error("[CustomBasket] Error fetching category products:", err);
        setSaveError("Không thể tải danh sách sản phẩm theo danh mục.");
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [selectedConfig]);

  /* ── Handlers ── */
  const handleSelectConfig = (config: ProductConfig) => {
    setSelectedConfig(config);
    setCustomName(config.configname || "Giỏ quà của tôi");
    setPickedItems([]);
    setSlotSearch({});
    setSaveSuccess(false);
    setSaveError(null);
    setPanelOpen(true);
  };

  const handlePickProduct = (product: Product, categoryid: number) => {
    setPickedItems((prev) => {
      const required =
        selectedConfig?.configDetails?.find((d) => d.categoryid === categoryid)
          ?.quantity ?? 0;
      const totalPicked = prev
        .filter((i) => i.categoryid === categoryid)
        .reduce((s, i) => s + i.quantity, 0);
      if (totalPicked >= required) return prev;
      if (prev.some((i) => i.productid === product.productid!)) return prev;
      return [
        ...prev,
        { productid: product.productid!, categoryid, product, quantity: 1 },
      ];
    });
  };

  const handleRemovePicked = (productid: number) => {
    setPickedItems((prev) => prev.filter((i) => i.productid !== productid));
  };

  const handleChangeQuantity = (productid: number, delta: number) => {
    setPickedItems((prev) => {
      const item = prev.find((i) => i.productid === productid);
      if (!item) return prev;
      if (delta > 0) {
        const required =
          selectedConfig?.configDetails?.find(
            (d) => d.categoryid === item.categoryid,
          )?.quantity ?? 0;
        const totalPicked = prev
          .filter((i) => i.categoryid === item.categoryid)
          .reduce((s, i) => s + i.quantity, 0);
        if (totalPicked >= required) return prev;
      }
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.productid !== productid);
      return prev.map((i) =>
        i.productid === productid ? { ...i, quantity: newQty } : i,
      );
    });
  };

  /** So sánh 2 giỏ có cùng bộ sản phẩm (productid + quantity) không */
  const isSameBasket = (
    pickedList: PickedItem[],
    existing: import("@/api/productService").CustomerBasketDto,
  ): boolean => {
    const details = existing.productDetails ?? [];
    if (pickedList.length !== details.length) return false;
    const sorted = (arr: { productid: number; quantity: number }[]) =>
      [...arr].sort((a, b) => a.productid - b.productid);
    const a = sorted(
      pickedList.map((i) => ({ productid: i.productid, quantity: i.quantity })),
    );
    const b = sorted(
      details.map((d) => ({ productid: d.productid, quantity: d.quantity })),
    );
    return a.every(
      (item, idx) =>
        item.productid === b[idx].productid &&
        item.quantity === b[idx].quantity,
    );
  };

  const handleAddToCart = async () => {
    if (!selectedConfig) return;
    if (!token) {
      navigate("/login");
      return;
    }

    // validate all slots filled
    const unmet = (selectedConfig.configDetails || []).filter((d) => {
      const picked = pickedItems
        .filter((i) => i.categoryid === d.categoryid)
        .reduce((s, i) => s + i.quantity, 0);
      return picked < d.quantity;
    });
    if (unmet.length > 0) {
      setSaveError(
        "Chưa đủ sản phẩm: " +
          unmet
            .map((d) => {
              const picked = pickedItems
                .filter((i) => i.categoryid === d.categoryid)
                .reduce((s, i) => s + i.quantity, 0);
              return `${d.categoryName} (còn thiếu ${d.quantity - picked} món)`;
            })
            .join(", "),
      );
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      // ── Step 1: Check for an identical existing DRAFT basket ──
      const mybasketsRes = await productService.getMyBaskets(token);
      const responseData = (mybasketsRes as unknown as Record<string, unknown>)
        ?.data;
      const rawBaskets = Array.isArray(responseData)
        ? responseData
        : Array.isArray((responseData as Record<string, unknown>)?.data)
          ? ((responseData as Record<string, unknown>)?.data as unknown[])
          : [];
      const existingDrafts: import("@/api/productService").CustomerBasketDto[] =
        rawBaskets.filter(
          (b: import("@/api/productService").CustomerBasketDto) =>
            b.configid === selectedConfig.configid &&
            b.status?.toUpperCase() === "DRAFT",
        );

      const duplicate = existingDrafts.find((b) =>
        isSameBasket(pickedItems, b),
      );

      if (duplicate) {
        // ── Same basket already exists → just add existing product to cart ──
        console.log(
          "[CustomBasket] ♻️ Duplicate basket found (id:",
          duplicate.productid,
          "), adding to cart without creating new.",
        );
        const existingProduct: Product = {
          productid: duplicate.productid,
          configid: duplicate.configid,
          productname: duplicate.productname,
          description: duplicate.description,
          imageUrl: duplicate.imageUrl,
          status: duplicate.status,
          price: duplicate.totalPrice,
        } as Product;
        await addToCart(existingProduct, 1);
      } else {
        // ── Different basket → create new in DB then add to cart ──
        const payload: CreateComboProductRequest = {
          configid: selectedConfig.configid,
          productname: customName,
          status: "DRAFT",
          productDetails: pickedItems.map((i) => ({
            productid: i.productid,
            quantity: i.quantity,
          })),
        };

        console.log(
          "[CustomBasket] 📤 Creating new custom basket:",
          JSON.stringify(payload, null, 2),
        );
        const createRes = await productService.createCustom(payload, token);
        const createResData = (createRes as unknown as Record<string, unknown>)
          ?.data;
        const rawCreated = createResData as Record<string, unknown>;
        let created: Product | null =
          (rawCreated?.data as unknown as Product) ??
          (rawCreated as unknown as Product) ??
          null;

        // If backend didn't return productid (old server), fetch my-baskets to locate the new one
        if (!created?.productid) {
          console.log(
            "[CustomBasket] productid not in create response, fetching my-baskets to locate new basket...",
          );
          const refetchRes = await productService.getMyBaskets(token);
          const refetchResData = (
            refetchRes as unknown as Record<string, unknown>
          )?.data;
          const refetchRaw = Array.isArray(refetchResData)
            ? refetchResData
            : Array.isArray((refetchResData as Record<string, unknown>)?.data)
              ? ((refetchResData as Record<string, unknown>)?.data as unknown[])
              : [];
          const newBaskets: import("@/api/productService").CustomerBasketDto[] =
            refetchRaw.filter(
              (b: import("@/api/productService").CustomerBasketDto) =>
                b.configid === selectedConfig.configid &&
                b.status?.toUpperCase() === "DRAFT",
            );
          const matched = newBaskets.find((b) => isSameBasket(pickedItems, b));
          if (!matched)
            throw new Error("Không tạo được giỏ quà, vui lòng thử lại.");
          created = {
            productid: matched.productid,
            configid: matched.configid,
            productname: matched.productname,
            description: matched.description,
            imageUrl: matched.imageUrl,
            status: matched.status,
            price: matched.totalPrice,
          } as Product;
        }

        console.log(
          "[CustomBasket] ✅ New basket (id:",
          created.productid,
          "), adding to cart.",
        );
        await addToCart(created, 1);
      }

      setSaveSuccess(true);
      openCart();
    } catch (err: unknown) {
      console.error("[CustomBasket] ❌ Error in handleAddToCart:", err);
      const errorMsg =
        (err as Record<string, unknown>)?.message ||
        "Không thể tạo giỏ hàng. Vui lòng thử lại.";
      setSaveError(errorMsg.toString());
    } finally {
      setSaving(false);
    }
  };

  /* ── Derived ── */
  const filteredConfigs = useMemo(() => {
    if (!configSearch.trim()) return configs;
    const q = configSearch.toLowerCase();
    return configs.filter(
      (c) =>
        c.configname?.toLowerCase().includes(q) ||
        c.suitablesuggestion?.toLowerCase().includes(q),
    );
  }, [configs, configSearch]);

  // Products available per category slot (not yet picked)
  const productsByCategory = useMemo(() => {
    const map: Record<number, Product[]> = {};
    if (!selectedConfig?.configDetails) return map;
    
    for (const detail of selectedConfig.configDetails) {
      const picked = new Set(pickedItems.map((i) => i.productid));
      // Use products from the specialized category map
      const availableInCategory = categoryProductsMap[detail.categoryid] || [];
      
      map[detail.categoryid] = availableInCategory.filter(
        (p) => !picked.has(p.productid!),
      );
    }
    return map;
  }, [selectedConfig, categoryProductsMap, pickedItems]);

  const totalPrice = useMemo(
    () =>
      pickedItems.reduce((s, i) => s + (i.product.price ?? 0) * i.quantity, 0),
    [pickedItems],
  );

  // Validation: slots filled?
  const slotStatus = useMemo(() => {
    if (!selectedConfig?.configDetails) return [];
    return selectedConfig.configDetails.map((d) => {
      const picked = pickedItems
        .filter((i) => i.categoryid === d.categoryid)
        .reduce((s, i) => s + i.quantity, 0);
      return {
        ...d,
        picked,
        done: picked >= d.quantity,
      };
    });
  }, [selectedConfig, pickedItems]);

  const allSlotsFilled = slotStatus.every((s) => s.done);

  const panelProps: CustomizationPanelProps = {
    config: selectedConfig!,
    customName,
    onNameChange: setCustomName,
    pickedItems,
    onRemovePicked: handleRemovePicked,
    onPickProduct: handlePickProduct,
    productsByCategory,
    slotSearch,
    onSlotSearchChange: (catId, v) =>
      setSlotSearch((prev) => ({ ...prev, [catId]: v })),
    slotStatus,
    allSlotsFilled,
    totalPrice,
    onAddToCart: handleAddToCart,
    saving,
    saveSuccess,
    saveError,
    isLoggedIn: !!token,
    onChangeQuantity: handleChangeQuantity,
    onLoginClick: () => navigate("/login"),
  };

  /* ── Render ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-linear-to-b from-[#FBF5E8]/40 to-white pb-20"
    >
      {/* ── Hero Banner Nâng Cấp ── */}
      <section className="relative bg-linear-to-r from-[#4a0d06] via-[#7a160e] to-tet-accent text-white overflow-hidden rounded-b-[3rem] shadow-xl">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />
        <div className="absolute inset-0 bg-black/10" />{" "}
        {/* Overlay tạo chiều sâu */}
        <div className="w-full max-w-7xl mx-auto px-6 py-16 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center gap-3 mb-6 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20"
          >
            <Sparkles size={20} className="text-amber-300" />
            <span className="text-sm font-bold uppercase tracking-widest text-amber-50">
              Happybox Exclusive
            </span>
            <Sparkles size={20} className="text-amber-300" />
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-serif font-black mb-6 drop-shadow-lg leading-tight">
            Tự Tay Thiết Kế <br />{" "}
            <span className="text-amber-300">Giỏ Quà Tết Thượng Hạng</span>
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto font-medium leading-relaxed">
            Lựa chọn từ các mẫu thiết kế hộp quà độc quyền và lấp đầy bằng những
            sản phẩm tuyệt hảo nhất dành tặng đối tác, gia đình.
          </p>

          <div className="flex justify-center gap-12 mt-10">
            <div className="text-center">
              <p className="text-4xl font-black text-amber-300">
                {configs.length}
              </p>
              <p className="text-sm font-bold uppercase tracking-wider opacity-80 mt-1">
                Mẫu hộp quà
              </p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-4xl font-black text-amber-300">
                {singleProducts.length}
              </p>
              <p className="text-sm font-bold uppercase tracking-wider opacity-80 mt-1">
                Sản phẩm tuyển chọn
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works (Breadcrumb Steps) ── */}
      <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 md:p-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm font-medium">
          <StepBadge num={1} text="Chọn thiết kế hộp" active />
          <ChevronRight className="hidden sm:block text-gray-300" size={20} />
          <StepBadge num={2} text="Thêm sản phẩm" active={!!selectedConfig} />
          <ChevronRight className="hidden sm:block text-gray-300" size={20} />
          <StepBadge num={3} text="Hoàn tất giỏ quà" active={saveSuccess} />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-tet-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">
              Đang chuẩn bị bộ sưu tập...
            </p>
          </div>
        ) : /* Error */
        error ? (
          <div className="flex items-center justify-center py-20">
            <div className="bg-red-50 border border-red-100 p-10 rounded-[3rem] text-center max-w-md">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
              <p className="text-tet-primary font-black text-xl mb-2">
                Đã xảy ra sự cố
              </p>
              <p className="text-gray-600 text-sm mb-8">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-md"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        ) : (
          /* Content */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── Left: Template catalog (Chiếm 7 cột) ── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section heading */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                  <h2 className="text-2xl font-serif font-black text-tet-primary flex items-center gap-3">
                    <Gift size={24} />
                    Bộ sưu tập hộp quà
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Chọn mẫu hộp bạn ưng ý nhất để bắt đầu.
                  </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={configSearch}
                    onChange={(e) => setConfigSearch(e.target.value)}
                    placeholder="Tìm kiếm mẫu hộp..."
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tet-accent bg-gray-50 transition-all"
                  />
                  {configSearch && (
                    <button
                      onClick={() => setConfigSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid */}
              {filteredConfigs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">
                    Không tìm thấy mẫu hộp quà phù hợp.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  <AnimatePresence>
                    {filteredConfigs.map((c) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={c.configid}
                      >
                        <ConfigCard
                          config={c}
                          isSelected={selectedConfig?.configid === c.configid}
                          onSelect={() => handleSelectConfig(c)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ── Right: Customization panel (desktop - Chiếm 5 cột) ── */}
            <div className="hidden lg:block lg:col-span-5 sticky top-24">
              {selectedConfig ? (
                <CustomizationPanel {...panelProps} />
              ) : (
                <EmptyPanel />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: sticky button + bottom-sheet ── */}
      {!loading && !error && selectedConfig && (
        <>
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <button
              onClick={() => setPanelOpen(true)}
              className="w-full py-4 rounded-2xl bg-tet-primary hover:bg-tet-accent text-white font-bold flex items-center justify-center gap-2 shadow-xl transition-all"
            >
              <Pencil size={20} />
              Tiếp tục tùy chỉnh: {selectedConfig?.configname}
            </button>
          </div>

          {panelOpen && (
            <div className="lg:hidden fixed inset-0 z-100 flex flex-col justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setPanelOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative bg-white rounded-t-[2.5rem] flex flex-col shadow-2xl h-[85vh]"
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <h3 className="font-serif font-bold text-xl text-tet-primary">
                    Hoàn thiện giỏ quà
                  </h3>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 bg-gray-50">
                  <CustomizationPanel {...panelProps} mobile />
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

/* ════════════════════════════ StepBadge ════════════════════════════ */

function StepBadge({
  num,
  text,
  active,
}: {
  num: number;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 transition-colors ${active ? "text-tet-primary" : "text-gray-400"}`}
    >
      <span
        className={`w-8 h-8 rounded-full text-sm font-black flex items-center justify-center shadow-sm transition-colors ${
          active ? "bg-tet-primary text-white" : "bg-gray-100 text-gray-400"
        }`}
      >
        {num}
      </span>
      <span
        className={`font-bold tracking-wide ${active ? "text-tet-primary" : ""}`}
      >
        {text}
      </span>
    </div>
  );
}

/* ════════════════════════════ ConfigCard ════════════════════════════ */

interface ConfigCardProps {
  config: ProductConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function ConfigCard({ config, isSelected, onSelect }: ConfigCardProps) {
  const totalItems =
    config.configDetails?.reduce((s, d) => s + (d.quantity ?? 0), 0) ?? 0;

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden flex flex-col h-full ${
        isSelected
          ? "border-tet-primary ring-4 ring-tet-primary/20 shadow-xl"
          : "border-transparent shadow-sm hover:shadow-xl hover:border-tet-accent/50"
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[#FBF5E8]">
        {config.imageurl ? (
          <img
            src={config.imageurl}
            alt={config.configname}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-tet-primary/40">
            <Gift size={48} />
          </div>
        )}

        {/* Selected badge overlay */}
        {isSelected && (
          <div className="absolute top-3 right-3 bg-tet-primary text-white rounded-full p-2 shadow-lg animate-in zoom-in">
            <Check size={16} strokeWidth={3} />
          </div>
        )}

        {/* Item count tag */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-tet-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
          <Package size={14} /> {totalItems} món
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2 mb-2">
          {config.configname}
        </h3>
        {config.suitablesuggestion && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {config.suitablesuggestion}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`text-sm font-bold px-5 py-2 rounded-full transition-all ${
              isSelected
                ? "bg-[#fffaf5] text-tet-primary border border-tet-primary"
                : "bg-gray-100 text-gray-600 group-hover:bg-tet-primary group-hover:text-white"
            }`}
          >
            {isSelected ? "Đang tùy chỉnh" : "Chọn mẫu này"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ EmptyPanel ════════════════════════════ */

function EmptyPanel() {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 text-center shadow-sm h-full flex flex-col items-center justify-center min-h-125">
      <div className="w-24 h-24 rounded-full bg-[#FBF5E8] flex items-center justify-center mx-auto mb-6">
        <Sparkles size={40} className="text-tet-accent" />
      </div>
      <h3 className="font-serif font-black text-2xl text-tet-primary mb-3">
        Chưa có mẫu được chọn
      </h3>
      <p className="text-gray-500 leading-relaxed max-w-sm mx-auto mb-8">
        Hãy bắt đầu bằng việc chọn một thiết kế hộp quà tuyệt đẹp ở danh sách
        bên trái để tự tay tạo ra phiên bản giới hạn của riêng bạn.
      </p>

      <div className="bg-gray-50 rounded-3xl p-6 w-full text-left space-y-4">
        <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">
          Quy trình 3 bước:
        </h4>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm text-tet-primary flex items-center justify-center font-black">
            1
          </div>
          <span className="text-sm font-medium text-gray-600">
            Chọn vỏ hộp thiết kế
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm text-tet-primary flex items-center justify-center font-black">
            2
          </div>
          <span className="text-sm font-medium text-gray-600">
            Lựa chọn các loại bánh kẹo, rượu...
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm text-tet-primary flex items-center justify-center font-black">
            3
          </div>
          <span className="text-sm font-medium text-gray-600">
            Hoàn tất và thanh toán
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ CustomizationPanel ════════════════════════════ */

interface SlotStatus {
  configdetailid?: number;
  categoryid: number;
  categoryName?: string;
  quantity: number;
  picked: number;
  done: boolean;
}

interface CustomizationPanelProps {
  config: ProductConfig;
  customName: string;
  onNameChange: (v: string) => void;
  pickedItems: PickedItem[];
  onRemovePicked: (productid: number) => void;
  onPickProduct: (p: Product, categoryid: number) => void;
  productsByCategory: Record<number, Product[]>;
  slotSearch: Record<number, string>;
  onSlotSearchChange: (catId: number, v: string) => void;
  slotStatus: SlotStatus[];
  allSlotsFilled: boolean;
  totalPrice: number;
  onAddToCart: () => void;
  saving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  isLoggedIn: boolean;
  onChangeQuantity: (productid: number, delta: number) => void;
  onLoginClick: () => void;
  mobile?: boolean;
}

function CustomizationPanel({
  config,
  customName,
  onNameChange,
  pickedItems,
  onRemovePicked,
  onPickProduct,
  productsByCategory,
  slotSearch,
  onSlotSearchChange,
  slotStatus,
  allSlotsFilled,
  totalPrice,
  onAddToCart,
  saving,
  saveSuccess,
  saveError,
  isLoggedIn,
  onChangeQuantity,
  onLoginClick,
  mobile,
}: CustomizationPanelProps) {
  const totalQuantity = pickedItems.reduce((s, i) => s + i.quantity, 0);
  const totalWeight = pickedItems.reduce(
    (s, i) => s + (i.product.unit ?? 0) * i.quantity,
    0,
  );
  const maxQuantity = slotStatus.reduce((s, d) => s + d.quantity, 0);

  return (
    <div
      className={`bg-white border-gray-100 flex flex-col ${mobile ? "h-full" : "rounded-[2.5rem] shadow-2xl border max-h-[85vh]"}`}
    >
      {/* Header Hóa Đơn */}
      <div className="bg-tet-primary p-6 text-white shrink-0 rounded-t-[2.5rem]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-tet-accent/80 border border-tet-accent/30 px-2 py-1 rounded">
            Bản Thiết Kế
          </span>
          <Gift size={20} className="text-tet-accent" />
        </div>
        <h3 className="font-serif font-black text-2xl truncate mb-1">
          {config.configname}
        </h3>
      </div>

      {/* Nội dung Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-gray-50/50">
        {/* Custom name Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Tên giỏ quà của bạn
          </label>
          <div className="relative">
            <Pencil
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={customName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="VD: Quà biếu sếp 2026..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-tet-accent focus:border-transparent bg-white font-medium"
            />
          </div>
        </div>

        {/* Tiến trình chọn */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-700">
              Tiến độ hoàn thiện
            </span>
            <span
              className={`text-sm font-black px-3 py-1 rounded-full ${allSlotsFilled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
            >
              {totalQuantity} / {maxQuantity}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allSlotsFilled ? "bg-green-500" : "bg-tet-primary"}`}
              style={{
                width: `${maxQuantity > 0 ? Math.min(100, (totalQuantity / maxQuantity) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Các Khe cắm (Slots) */}
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 text-lg">
            Lựa chọn thành phần
          </h4>
          {slotStatus.map((slot) => {
            const slotPicked = pickedItems.filter(
              (i) => i.categoryid === slot.categoryid,
            );
            const available = productsByCategory[slot.categoryid] ?? [];
            const q = (slotSearch[slot.categoryid] ?? "").toLowerCase();
            const filtered = q
              ? available.filter(
                  (p) =>
                    p.productname?.toLowerCase().includes(q) ||
                    p.sku?.toLowerCase().includes(q),
                )
              : available;

            return (
              <div
                key={slot.categoryid}
                className={`bg-white border rounded-2xl overflow-hidden transition-all ${slot.done ? "border-green-200" : "border-gray-200"}`}
              >
                {/* Tiêu đề Slot */}
                <div
                  className={`px-5 py-4 flex items-center justify-between border-b ${slot.done ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}
                >
                  <div className="flex items-center gap-3">
                    {slot.done ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <Tag size={18} className="text-gray-400" />
                    )}
                    <span
                      className={`font-bold ${slot.done ? "text-green-800" : "text-gray-800"}`}
                    >
                      {slot.categoryName}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-black ${slot.done ? "text-green-600" : "text-gray-500"}`}
                  >
                    Cần chọn: {slot.quantity}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Sản phẩm ĐÃ CHỌN */}
                  {slotPicked.length > 0 && (
                    <div className="space-y-2">
                      {slotPicked.map((item) => (
                        <div
                          key={item.productid}
                          className="flex items-center gap-3 bg-white border border-tet-primary/20 rounded-xl p-2 shadow-sm"
                        >
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.productname}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#FBF5E8] flex items-center justify-center shrink-0">
                              <Package
                                size={16}
                                className="text-tet-primary/50"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-tet-primary truncate">
                              {item.product.productname}
                            </p>
                            <p className="text-xs font-medium text-gray-500">
                              {(item.product.price ?? 0).toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </p>
                          </div>
                          {/* Control SL */}
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100 shrink-0">
                            <button
                              onClick={() =>
                                onChangeQuantity(item.productid, -1)
                              }
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-tet-primary hover:bg-white rounded-md transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-4 text-center text-sm font-black text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                onChangeQuantity(item.productid, +1)
                              }
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-tet-primary hover:bg-white rounded-md transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          {/* Nút xóa */}
                          <button
                            onClick={() => onRemovePicked(item.productid)}
                            className="w-8 h-8 flex items-center justify-center text-red-300 hover:text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-1 shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Danh sách Sản phẩm CHƯA CHỌN (Chỉ hiện khi chưa đủ) */}
                  {!slot.done && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={slotSearch[slot.categoryid] ?? ""}
                          onChange={(e) =>
                            onSlotSearchChange(slot.categoryid, e.target.value)
                          }
                          placeholder={`Tìm kiếm trong ${slot.categoryName}...`}
                          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tet-primary/50 bg-gray-50/50"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                        {filtered.length === 0 ? (
                          <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-500">
                              Không tìm thấy sản phẩm phù hợp.
                            </p>
                          </div>
                        ) : (
                          filtered.map((p) => (
                            <button
                              key={p.productid}
                              onClick={() => onPickProduct(p, slot.categoryid)}
                              className="w-full flex items-center gap-3 p-2 hover:bg-tet-primary/5 rounded-xl transition-colors text-left group border border-transparent hover:border-tet-primary/20"
                            >
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.productname}
                                  className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                  <Package
                                    size={14}
                                    className="text-gray-400"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 group-hover:text-tet-primary transition-colors truncate">
                                  {p.productname}
                                </p>
                                <p className="text-xs font-bold text-gray-500">
                                  {(p.price ?? 0).toLocaleString("vi-VN")}đ
                                </p>
                              </div>
                              <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-tet-primary group-hover:text-white group-hover:border-tet-primary transition-all shrink-0">
                                <Plus size={16} />
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bill Summary & Action Footer */}
      <div className="bg-white p-6 border-t border-gray-100 shrink-0 rounded-b-[2.5rem]">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm font-medium text-gray-500">
            <span>Tổng trọng lượng ước tính:</span>
            <span className="text-gray-800">
              {totalWeight.toLocaleString("vi-VN")}g
            </span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-gray-500 font-bold uppercase tracking-wider text-sm">
              Tạm tính:
            </span>
            <span className="text-3xl font-black text-tet-primary">
              {totalPrice.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>

        {/* Thông báo Alert */}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm font-bold mb-4 animate-in slide-in-from-bottom-2">
            <Check size={18} className="shrink-0" /> Thêm vào giỏ hàng thành
            công!
          </div>
        )}
        {saveError && (
          <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium mb-4 animate-in slide-in-from-bottom-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Nút hành động */}
        {!isLoggedIn ? (
          <button
            onClick={onLoginClick}
            className="w-full py-4 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <LogIn size={20} /> Vui lòng đăng nhập để tiếp tục
          </button>
        ) : (
          <button
            onClick={onAddToCart}
            disabled={saving || !allSlotsFilled}
            className="w-full py-4 rounded-2xl bg-tet-primary hover:bg-tet-accent text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-tet-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <ShoppingBag size={20} />
                {allSlotsFilled ? "Thêm Vào Giỏ Hàng" : "Hãy chọn đủ sản phẩm"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
