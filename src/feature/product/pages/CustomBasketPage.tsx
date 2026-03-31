import { useState, useEffect, useMemo } from "react";
import {
  Gift,
  ShoppingCart,
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
} from "lucide-react";
import { useCart } from "@/feature/cart/context/CartContext";
import { useNavigate } from "react-router-dom";
import { productService, type Product, type CreateComboProductRequest } from "@/api/productService";
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
  const [selectedConfig, setSelectedConfig] = useState<ProductConfig | null>(null);
  const [customName, setCustomName] = useState("");
  const [pickedItems, setPickedItems] = useState<PickedItem[]>([]);
  const [configSearch, setConfigSearch] = useState("");
  // Search per category slot
  const [slotSearch, setSlotSearch] = useState<Record<number, string>>({});

  /* ── Action state ── */
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ── Mobile panel ── */
  const [panelOpen, setPanelOpen] = useState(false);

  /* ── Fetch data ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [configsData, availableProducts] = await Promise.all([
          configService.getAllConfig(),
          productService.getAvailableProductsForCustomer(),
        ]);

        setConfigs(configsData);
        setSingleProducts(
          availableProducts.filter(
            (p: Product) =>
              p.status?.toUpperCase() === "ACTIVE" && !p.configid
          )
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.msg ||
            err?.response?.data?.message ||
            err?.message ||
            "Không thể tải dữ liệu. Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      const required = selectedConfig?.configDetails?.find(
        (d) => d.categoryid === categoryid
      )?.quantity ?? 0;
      const totalPicked = prev
        .filter((i) => i.categoryid === categoryid)
        .reduce((s, i) => s + i.quantity, 0);
      if (totalPicked >= required) return prev;
      if (prev.some((i) => i.productid === product.productid!)) return prev;
      return [...prev, { productid: product.productid!, categoryid, product, quantity: 1 }];
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
        const required = selectedConfig?.configDetails?.find(
          (d) => d.categoryid === item.categoryid
        )?.quantity ?? 0;
        const totalPicked = prev
          .filter((i) => i.categoryid === item.categoryid)
          .reduce((s, i) => s + i.quantity, 0);
        if (totalPicked >= required) return prev;
      }
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.productid !== productid);
      return prev.map((i) =>
        i.productid === productid ? { ...i, quantity: newQty } : i
      );
    });
  };

  /** So sánh 2 giỏ có cùng bộ sản phẩm (productid + quantity) không */
  const isSameBasket = (
    pickedList: PickedItem[],
    existing: import("@/api/productService").CustomerBasketDto
  ): boolean => {
    const details = existing.productDetails ?? [];
    if (pickedList.length !== details.length) return false;
    const sorted = (arr: { productid: number; quantity: number }[]) =>
      [...arr].sort((a, b) => a.productid - b.productid);
    const a = sorted(pickedList.map((i) => ({ productid: i.productid, quantity: i.quantity })));
    const b = sorted(details.map((d) => ({ productid: d.productid, quantity: d.quantity })));
    return a.every((item, idx) => item.productid === b[idx].productid && item.quantity === b[idx].quantity);
  };

  const handleAddToCart = async () => {
    if (!selectedConfig) return;
    if (!token) { navigate("/login"); return; }

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
            .join(", ")
      );
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      // ── Step 1: Check for an identical existing DRAFT basket ──
      const mybasketsRes = await productService.getMyBaskets(token);
      const rawBaskets = (mybasketsRes as any)?.data?.data ?? (mybasketsRes as any)?.data ?? [];
      const existingDrafts: import("@/api/productService").CustomerBasketDto[] = rawBaskets.filter(
        (b: import("@/api/productService").CustomerBasketDto) =>
          b.configid === selectedConfig.configid &&
          b.status?.toUpperCase() === "DRAFT"
      );

      const duplicate = existingDrafts.find((b) => isSameBasket(pickedItems, b));

      if (duplicate) {
        // ── Same basket already exists → just add existing product to cart ──
        console.log("[CustomBasket] ♻️ Duplicate basket found (id:", duplicate.productid, "), adding to cart without creating new.");
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

        console.log("[CustomBasket] 📤 Creating new custom basket:", JSON.stringify(payload, null, 2));
        const createRes = await productService.createCustom(payload, token);
        const rawCreated = (createRes as any)?.data;
        let created: Product | null = rawCreated?.data ?? rawCreated ?? null;

        // If backend didn't return productid (old server), fetch my-baskets to locate the new one
        if (!created?.productid) {
          console.log("[CustomBasket] productid not in create response, fetching my-baskets to locate new basket...");
          const refetchRes = await productService.getMyBaskets(token);
          const refetchRaw = (refetchRes as any)?.data?.data ?? (refetchRes as any)?.data ?? [];
          const newBaskets: import("@/api/productService").CustomerBasketDto[] = refetchRaw.filter(
            (b: import("@/api/productService").CustomerBasketDto) =>
              b.configid === selectedConfig.configid &&
              b.status?.toUpperCase() === "DRAFT"
          );
          const matched = newBaskets.find((b) => isSameBasket(pickedItems, b));
          if (!matched) throw new Error("Không tạo được giỏ quà, vui lòng thử lại.");
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

        console.log("[CustomBasket] ✅ New basket (id:", created.productid, "), adding to cart.");
        await addToCart(created, 1);
      }

      setSaveSuccess(true);
      openCart();
    } catch (err: any) {
      console.error("[CustomBasket] ❌ Error in handleAddToCart:", err);
      setSaveError(
        err?.response?.data?.msg ||
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tạo giỏ hàng. Vui lòng thử lại."
      );
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
        c.suitablesuggestion?.toLowerCase().includes(q)
    );
  }, [configs, configSearch]);

  // Products available per category slot (not yet picked)
  const productsByCategory = useMemo(() => {
    const map: Record<number, Product[]> = {};
    if (!selectedConfig?.configDetails) return map;
    for (const detail of selectedConfig.configDetails) {
      const picked = new Set(pickedItems.map((i) => i.productid));
      map[detail.categoryid] = singleProducts.filter(
        (p) =>
          p.categoryid === detail.categoryid && !picked.has(p.productid!)
      );
    }
    return map;
  }, [selectedConfig, singleProducts, pickedItems]);

  const totalPrice = useMemo(
    () => pickedItems.reduce((s, i) => s + (i.product.price ?? 0) * i.quantity, 0),
    [pickedItems]
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
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-amber-50">

      {/* ── Hero Banner ── */}
      <section className="relative bg-gradient-to-r from-[#3D0B05] via-[#5A1107] to-[#9F3025] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/oriental.png')]" />
        <div className="w-full px-8 py-8 relative z-10 text-center">
          <div className="flex justify-center gap-3 mb-4 text-3xl">🎁 🧧 ✨</div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 drop-shadow">
            Tùy Chỉnh Giỏ Quà Tết
          </h1>
          <p className="text-lg opacity-90 max-w-xl mx-auto">
            Chọn mẫu giỏ quà có sẵn, cá nhân hóa theo sở thích — tạo món quà
            Tết độc đáo cho người thân yêu
          </p>
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <p className="text-3xl font-black">{configs.length}</p>
              <p className="text-sm opacity-75">Mẫu cấu hình</p>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-black">{singleProducts.length}</p>
              <p className="text-sm opacity-75">Sản phẩm lẻ</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="w-full px-8 py-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-sm font-medium text-gray-600">
          <StepBadge num={1} text="Chọn cấu hình giỏ" active />
          <ChevronRight className="hidden sm:block text-gray-300" size={18} />
          <StepBadge num={2} text="Chọn sản phẩm theo quy tắc" active={!!selectedConfig} />
          <ChevronRight className="hidden sm:block text-gray-300" size={18} />
          <StepBadge num={3} text="Thêm vào giỏ hàng" active={saveSuccess} />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="w-full px-8 py-6">

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Đang tải mẫu giỏ quà...</p>
            </div>
          </div>

        /* Error */
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-600 font-bold text-lg mb-2">Không thể tải dữ liệu</p>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-tet-primary text-white rounded-full text-sm font-bold hover:bg-tet-accent transition"
              >
                Thử lại
              </button>
            </div>
          </div>

        /* Content */
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* ── Left: Template catalog ── */}
            <div className="min-w-0">

              {/* Section heading */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  Chọn cấu hình giỏ quà
                </h2>
                <span className="text-sm text-gray-400">{filteredConfigs.length} mẫu</span>
              </div>

              {/* Search */}
              <div className="relative mb-6 max-w-md">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={configSearch}
                  onChange={(e) => setConfigSearch(e.target.value)}
                  placeholder="Tìm cấu hình giỏ quà..."
                  className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white shadow-sm"
                />
                {configSearch && (
                  <button
                    onClick={() => setConfigSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Grid */}
              {filteredConfigs.length === 0 ? (
                <div className="text-center py-12">
                  <Gift size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Không tìm thấy cấu hình giỏ quà</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredConfigs.map((c) => (
                    <ConfigCard
                      key={c.configid}
                      config={c}
                      isSelected={selectedConfig?.configid === c.configid}
                      onSelect={() => handleSelectConfig(c)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Customization panel (desktop) ── */}
            <div className="hidden lg:block sticky top-24">
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
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3 safe-area-pb">
            <button
              onClick={() => setPanelOpen(true)}
              className="w-full py-3 rounded-full bg-tet-primary hover:bg-tet-accent text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Pencil size={16} />
              Chọn sản phẩm: {selectedConfig?.configname}
            </button>
          </div>

          {panelOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setPanelOpen(false)}
              />
              <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800">Tùy chỉnh giỏ quà</h3>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                  <CustomizationPanel {...panelProps} mobile />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
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
    <div className={`flex items-center gap-2 ${active ? "text-red-600" : "text-gray-400"}`}>
      <span
        className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
          active
            ? "bg-red-600 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {num}
      </span>
      <span className={`font-semibold ${active ? "text-gray-700" : ""}`}>{text}</span>
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
  const slotCount = config.configDetails?.length ?? 0;
  const totalItems = (() => {
    const raw = config.totalunit != null && !isNaN(Number(config.totalunit))
      ? Number(config.totalunit)
      : (config.configDetails?.reduce((s, d) => s + (d.quantity ?? 0), 0) ?? 0);
    return raw;
  })();

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer bg-white rounded-2xl border-2 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col ${
        isSelected
          ? "border-red-700 ring-2 ring-red-200 shadow-lg"
          : "border-gray-100 hover:border-red-200"
      }`}
    >
      {/* Image / placeholder */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-red-50 to-amber-50">
        {config.imageurl ? (
          <img
            src={config.imageurl}
            alt={config.configname}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <Gift size={36} className="text-purple-300" />
            {slotCount > 0 && (
              <div className="flex flex-wrap justify-center gap-1 px-2">
                {config.configDetails!.slice(0, 3).map((d, i) => (
                  <span key={i} className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                    {d.categoryName} ×{d.quantity}
                  </span>
                ))}
                {slotCount > 3 && (
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">+{slotCount - 3}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected badge */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-red-800 text-white rounded-full p-1.5 shadow">
            <Check size={13} />
          </div>
        )}

        {/* Slot count badge */}
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-800 text-white shadow">
            {totalItems} món · {slotCount} danh mục
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-xs leading-tight line-clamp-2 mb-1 min-h-[2rem]">
          {config.configname}
        </h3>
        {config.suitablesuggestion && (
          <p className="text-[10px] text-gray-400 line-clamp-1 mb-2">{config.suitablesuggestion}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Tag size={10} /> {slotCount} loại
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
              isSelected
                ? "bg-red-100 text-tet-primary"
                : "bg-tet-primary hover:bg-tet-accent text-white shadow-sm"
            }`}
          >
            {isSelected ? "Đang chọn ✓" : "Chọn →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ EmptyPanel ════════════════════════════ */

function EmptyPanel() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <Gift size={28} className="text-red-300" />
      </div>
      <p className="font-bold text-gray-500 mb-2">Chưa chọn mẫu</p>
      <p className="text-sm text-gray-400 leading-relaxed">
        Chọn một mẫu giỏ quà bên trái để bắt đầu tùy chỉnh theo ý thích của bạn.
      </p>
      <div className="mt-6 flex flex-col gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold shrink-0">1</div>
          Chọn mẫu giỏ quà từ danh sách
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold shrink-0">2</div>
          Thêm / bớt / điều chỉnh số lượng
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold shrink-0">3</div>
          Thêm vào giỏ hàng và thanh toán
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
}: CustomizationPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Panel header */}
      <div className="bg-gradient-to-r from-[#3D0B05] to-[#9F3025] px-5 py-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={16} />
          <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Đang tùy chỉnh theo cấu hình</span>
        </div>
        <p className="font-bold truncate">{config.configname}</p>
        {config.suitablesuggestion && (
          <p className="text-xs opacity-70 mt-0.5 truncate">{config.suitablesuggestion}</p>
        )}
      </div>

      <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* Custom name */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
            Tên giỏ quà
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nhập tên giỏ quà..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tiến độ chọn sản phẩm</span>
            <span className={`text-xs font-bold ${ allSlotsFilled ? "text-green-600" : "text-purple-600" }`}>
              {pickedItems.reduce((s, i) => s + i.quantity, 0)}/{slotStatus.reduce((s, d) => s + d.quantity, 0)} món
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${ allSlotsFilled ? "bg-green-500" : "bg-gradient-to-r from-red-600 to-amber-400" }`}
              style={{
                width: `${Math.min(
                  100,
                  slotStatus.reduce((s, d) => s + d.quantity, 0) > 0
                    ? Math.round((pickedItems.reduce((s, i) => s + i.quantity, 0) / slotStatus.reduce((s, d) => s + d.quantity, 0)) * 100)
                    : 0
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Category slots */}
        {slotStatus.map((slot) => {
          const slotPicked = pickedItems.filter((i) => i.categoryid === slot.categoryid);
          const available = productsByCategory[slot.categoryid] ?? [];
          const q = (slotSearch[slot.categoryid] ?? "").toLowerCase();
          const filtered = q ? available.filter((p) => p.productname?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)) : available;

          return (
            <div key={slot.categoryid} className="border border-gray-100 rounded-2xl overflow-hidden">
              {/* Slot header */}
              <div className={`flex items-center justify-between px-4 py-2.5 ${ slot.done ? "bg-green-50 border-b border-green-100" : "bg-amber-50 border-b border-amber-100" }`}>
                <div className="flex items-center gap-2">
                  <Tag size={13} className={slot.done ? "text-green-500" : "text-amber-600"} />
                  <span className="text-xs font-bold text-gray-700">{slot.categoryName}</span>
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${ slot.done ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800" }`}>
                  {slotPicked.reduce((s, i) => s + i.quantity, 0)}/{slot.quantity}
                </span>
              </div>

              <div className="p-3 space-y-2">
                {/* Picked products for this slot */}
                {slotPicked.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {slotPicked.map((item) => (
                      <div key={item.productid} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-2 py-1.5">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.productname} className="w-6 h-6 rounded-md object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center shrink-0">
                            <Package size={10} className="text-red-400" />
                          </div>
                        )}
                        <span className="text-[10px] font-semibold text-red-800 flex-1 truncate min-w-0">
                          {item.product.productname}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onChangeQuantity(item.productid, -1)}
                            className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition"
                          >
                            <Minus size={9} />
                          </button>
                          <span className="text-[11px] font-black text-red-800 w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onChangeQuantity(item.productid, +1)}
                            className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition"
                          >
                            <Plus size={9} />
                          </button>
                          <button
                            onClick={() => onRemovePicked(item.productid)}
                            className="text-red-300 hover:text-red-600 transition ml-0.5"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search + product list (only if slot not full) */}
                {!slot.done && (
                  <>
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={slotSearch[slot.categoryid] ?? ""}
                        onChange={(e) => onSlotSearchChange(slot.categoryid, e.target.value)}
                        placeholder={`Tìm ${slot.categoryName}...`}
                        className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                    </div>

                    {filtered.length === 0 ? (
                      <p className="text-[11px] text-gray-400 text-center py-2">Không có sản phẩm khả dụng</p>
                    ) : (
                      <div className="max-h-36 overflow-y-auto [&::-webkit-scrollbar]:hidden space-y-1">
                        {filtered.slice(0, 15).map((p) => (
                          <button
                            key={p.productid}
                            onClick={() => onPickProduct(p, slot.categoryid)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-amber-50 rounded-lg transition text-left"
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.productname} className="w-7 h-7 rounded-md object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                                <Package size={12} className="text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-gray-800 truncate">{p.productname}</p>
                              <p className="text-[10px] text-gray-400">{(p.price ?? 0).toLocaleString("vi-VN")}đ</p>
                            </div>
                            <Plus size={13} className="text-amber-500 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {slot.done && (
                  <div className="flex items-center gap-1.5 text-green-600 text-[11px] font-semibold">
                    <Check size={13} /> Đủ số lượng
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="bg-gradient-to-r from-red-50 to-amber-50 rounded-xl px-4 py-3 flex items-center justify-between border border-amber-100">
          <span className="text-sm font-bold text-gray-600">Tổng giá trị:</span>
          <span className="text-xl font-black text-red-800">
            {totalPrice.toLocaleString("vi-VN")}đ
          </span>
        </div>

        {/* Feedback */}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3 text-sm font-semibold">
            <Check size={16} />
            Đã tạo và thêm vào giỏ hàng thành công!
          </div>
        )}
        {saveError && (
          <div className="flex items-start gap-2 text-red-700 bg-red-50 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Action button */}
        {!isLoggedIn ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-4 py-3 text-xs font-semibold">
              <LogIn size={14} />
              Đăng nhập để tạo và thêm giỏ quà vào giỏ hàng.
            </div>
            <a
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-tet-primary hover:bg-tet-accent text-white font-bold text-sm shadow-md transition-colors"
            >
              <LogIn size={16} />
              Đăng nhập ngay
            </a>
          </div>
        ) : (
          <button
            onClick={onAddToCart}
            disabled={saving || !allSlotsFilled}
            className="w-full py-3 rounded-full bg-tet-primary hover:bg-tet-accent text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tạo giỏ hàng...
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                {allSlotsFilled ? "Thêm vào giỏ hàng" : `Còn thiếu ${slotStatus.reduce((s, d) => s + Math.max(0, d.quantity - d.picked), 0)} sản phẩm`}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
