import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Gift,
  Minus,
  Plus,
  Trash2,
  Edit,
  X,
  Search,
  Package,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Loader2,
  Tag,
  Sparkles,
} from "lucide-react";
import {
  productService,
  type CustomerBasketDto,
  type Product,
  type UpdateComboProductRequest,
} from "@/api/productService";
import { configService, type ProductConfig } from "@/api/configService";
import { useCart } from "@/feature/cart/context/CartContext";

/* ─────────── types ─────────── */

interface PickedItem {
  productid: number;
  categoryid: number;
  product: Product;
  quantity: number;
}

interface SlotStatus {
  categoryid: number;
  categoryName?: string;
  quantity: number;
  picked: number;
  done: boolean;
}

/* ═══════════════════════ Main Page ═══════════════════════ */

export default function MyBasketsPage() {
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();
  const token = localStorage.getItem("token") || "";

  const [baskets, setBaskets] = useState<CustomerBasketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  /* ── Edit modal state ── */
  const [editBasket, setEditBasket] = useState<CustomerBasketDto | null>(null);
  const [editName, setEditName] = useState("");
  const [editConfig, setEditConfig] = useState<ProductConfig | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [pickedItems, setPickedItems] = useState<PickedItem[]>([]);
  const [slotSearch, setSlotSearch] = useState<Record<number, string>>({});
  const [loadingModal, setLoadingModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ── Delete state ── */
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  /* ── Cart state ── */
  const [cartingId, setCartingId] = useState<number | null>(null);

  /* ── Fetch baskets ── */
  const fetchBaskets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productService.getMyBaskets(token);
      setBaskets(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || err?.message || "Không thể tải giỏ quà.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchBaskets();
  }, []);

  /* ── Delete ── */
  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await productService.delete(id, token);
      setBaskets((prev) => prev.filter((b) => b.productid !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(err?.response?.data?.msg || err?.response?.data?.message || "Không thể xóa giỏ quà.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Add to cart ── */
  const handleAddToCart = async (basket: CustomerBasketDto) => {
    try {
      setCartingId(basket.productid);
      const res = await productService.getCustomProductById(basket.productid);
      await addToCart(res.data, 1);
      openCart();
    } catch (err: any) {
      alert(err?.response?.data?.msg || err?.response?.data?.message || "Không thể thêm vào giỏ hàng.");
    } finally {
      setCartingId(null);
    }
  };

  /* ── Open edit modal ── */
  const handleOpenEdit = async (basket: CustomerBasketDto) => {
    setEditBasket(basket);
    setEditName(basket.productname);
    setSaveError(null);
    setPickedItems([]);
    setSlotSearch({});
    setLoadingModal(true);

    try {
      // Load available single products
      const prodRes = await productService.getAll();
      const raw: Product[] =
        (prodRes as any)?.data?.data ?? (prodRes as any)?.data ?? [];
      const singles = raw.filter(
        (p: Product) => p.status?.toUpperCase() === "ACTIVE" && !p.configid
      );
      setAllProducts(singles);

      // Pre-fill picked items from existing basket details
      if (basket.configid) {
        const cfg = await configService.getById(basket.configid);
        setEditConfig(cfg);

        // Map existing basket details → PickedItem using config slots
        const prefilled: PickedItem[] = [];
        for (const detail of basket.productDetails ?? []) {
          const matchedProduct = singles.find((p) => p.productid === detail.productid);
          if (matchedProduct && matchedProduct.categoryid) {
            prefilled.push({
              productid: detail.productid,
              categoryid: matchedProduct.categoryid,
              product: matchedProduct,
              quantity: detail.quantity ?? 1,
            });
          }
        }
        setPickedItems(prefilled);
      } else {
        setEditConfig(null);
        // For no-config baskets, still pre-fill (flat list mode)
        const prefilled: PickedItem[] = [];
        for (const detail of basket.productDetails ?? []) {
          const matchedProduct = singles.find((p) => p.productid === detail.productid);
          if (matchedProduct) {
            prefilled.push({
              productid: detail.productid,
              categoryid: matchedProduct.categoryid ?? 0,
              product: matchedProduct,
              quantity: detail.quantity ?? 1,
            });
          }
        }
        setPickedItems(prefilled);
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingModal(false);
    }
  };

  /* ── Edit modal handlers ── */
  const handlePickProduct = (product: Product, categoryid: number) => {
    setPickedItems((prev) => {
      const required =
        editConfig?.configDetails?.find((d) => d.categoryid === categoryid)
          ?.quantity ?? Infinity;
      const alreadyPicked = prev
        .filter((i) => i.categoryid === categoryid)
        .reduce((s, i) => s + i.quantity, 0);
      if (alreadyPicked >= required) return prev;
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
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.productid !== productid);
      if (delta > 0 && editConfig?.configDetails) {
        const slot = editConfig.configDetails.find((d) => d.categoryid === item.categoryid);
        if (slot) {
          const slotSum = prev
            .filter((i) => i.categoryid === item.categoryid)
            .reduce((s, i) => s + i.quantity, 0);
          if (slotSum >= slot.quantity) return prev;
        }
      }
      return prev.map((i) =>
        i.productid === productid ? { ...i, quantity: newQty } : i
      );
    });
  };

  const handleSaveEdit = async () => {
    if (!editBasket) return;
    if (!editName.trim()) { setSaveError("Vui lòng nhập tên giỏ quà."); return; }
    if (pickedItems.length === 0) { setSaveError("Giỏ quà cần ít nhất 1 sản phẩm."); return; }

    // Validate slots if config exists
    if (editConfig?.configDetails) {
      const unmet = editConfig.configDetails.filter((d) => {
        const p = pickedItems
          .filter((i) => i.categoryid === d.categoryid)
          .reduce((s, i) => s + i.quantity, 0);
        return p < d.quantity;
      });
      if (unmet.length > 0) {
        setSaveError(
          "Chưa đủ: " +
            unmet
              .map((d) => {
                const p = pickedItems
                  .filter((i) => i.categoryid === d.categoryid)
                  .reduce((s, i) => s + i.quantity, 0);
                return `${d.categoryName} (thiếu ${d.quantity - p})`;
              })
              .join(", ")
        );
        return;
      }
    }

    try {
      setSaving(true);
      setSaveError(null);
      const payload: UpdateComboProductRequest = {
        productname: editName,
        status: editBasket.status,
        productDetails: pickedItems.map((i) => ({
          productid: i.productid,
          quantity: i.quantity,
        })),
      };
      await productService.updateCustom(editBasket.productid, payload, token);
      setEditBasket(null);
      await fetchBaskets();
    } catch (err: any) {
      setSaveError(
        err?.response?.data?.msg || err?.response?.data?.message || err?.message || "Không thể cập nhật. Thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Derived: slot status for edit modal ── */
  const slotStatus = useMemo((): SlotStatus[] => {
    if (!editConfig?.configDetails) return [];
    return editConfig.configDetails.map((d) => ({
      ...d,
      picked: pickedItems
        .filter((i) => i.categoryid === d.categoryid)
        .reduce((s, i) => s + i.quantity, 0),
      done:
        pickedItems
          .filter((i) => i.categoryid === d.categoryid)
          .reduce((s, i) => s + i.quantity, 0) >= d.quantity,
    }));
  }, [editConfig, pickedItems]);

  const allSlotsFilled = editConfig
    ? slotStatus.every((s) => s.done)
    : pickedItems.length > 0;

  const productsByCategory = useMemo(() => {
    const map: Record<number, Product[]> = {};
    if (!editConfig?.configDetails) return map;
    for (const detail of editConfig.configDetails) {
      const picked = new Set(pickedItems.map((i) => i.productid));
      map[detail.categoryid] = allProducts.filter(
        (p) => p.categoryid === detail.categoryid && !picked.has(p.productid!)
      );
    }
    return map;
  }, [editConfig, allProducts, pickedItems]);

  /* ══════════════════ RENDER ══════════════════ */

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-tet-primary flex items-center gap-2">
            <Gift size={24} /> Giỏ quà của tôi
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {baskets.length > 0
              ? `Bạn có ${baskets.length} giỏ quà đã tùy chỉnh`
              : "Chưa có giỏ quà nào"}
          </p>
        </div>
        <Link
          to="/custom-basket"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3D0B05] to-[#9F3025] text-white rounded-full font-bold text-sm hover:shadow-lg transition-all"
        >
          <Plus size={16} />
          Tạo giỏ hàng mới
        </Link>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-tet-accent" />
            <p className="text-gray-400">Đang tải giỏ quà...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <p className="text-red-600 font-bold mb-1">{error}</p>
            <button
              onClick={fetchBaskets}
              className="mt-4 px-5 py-2 bg-tet-primary text-white rounded-full text-sm font-bold hover:opacity-90"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : baskets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-24 text-center">
          <Gift size={56} className="mx-auto text-gray-200 mb-4" />
          <p className="font-bold text-gray-400 text-lg mb-2">Chưa có giỏ quà nào</p>
          <p className="text-sm text-gray-400 mb-6">
            Hãy tạo giỏ quà tùy chỉnh đầu tiên của bạn!
          </p>
          <Link
            to="/custom-basket"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3D0B05] to-[#9F3025] text-white rounded-full font-bold hover:shadow-lg transition"
          >
            <Sparkles size={16} />
            Tạo giỏ quà ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {baskets.map((basket) => (
            <BasketCard
              key={basket.productid}
              basket={basket}
              expanded={expandedId === basket.productid}
              onToggleExpand={() =>
                setExpandedId((prev) =>
                  prev === basket.productid ? null : basket.productid
                )
              }
              onEdit={() => handleOpenEdit(basket)}
              onConfirmDelete={() => setConfirmDeleteId(basket.productid)}
              onAddToCart={() => handleAddToCart(basket)}
              carting={cartingId === basket.productid}
            />
          ))}
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Xóa giỏ quà?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 py-2.5 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId === confirmDeleteId ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editBasket && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditBasket(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-[#3D0B05] to-[#9F3025] px-6 py-5 text-white rounded-t-3xl flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Edit size={15} />
                  <span className="text-xs font-bold opacity-75 uppercase tracking-wider">Chỉnh sửa giỏ quà</span>
                </div>
                <p className="font-bold text-lg truncate max-w-[380px]">
                  {editBasket.productname}
                </p>
                {editBasket.configName && (
                  <p className="text-xs opacity-70 mt-0.5">Cấu hình: {editBasket.configName}</p>
                )}
              </div>
              <button
                onClick={() => setEditBasket(null)}
                className="p-2 hover:bg-white/20 rounded-full transition mt-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loadingModal ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin text-tet-accent" />
                </div>
              ) : (
                <>
                  {/* Basket name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Tên giỏ quà
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Tên giỏ quà..."
                    />
                  </div>

                  {/* Progress bar */}
                  {editConfig?.configDetails && editConfig.configDetails.length > 0 && (
                    <ProgressSection
                      slotStatus={slotStatus}
                      pickedCount={pickedItems.reduce((s, i) => s + i.quantity, 0)}
                      allFilled={allSlotsFilled}
                    />
                  )}

                  {/* Slot pickers (with config) or flat list (without config) */}
                  {editConfig?.configDetails && editConfig.configDetails.length > 0 ? (
                    <div className="space-y-4">
                      {slotStatus.map((slot) => {
                        const slotPicked = pickedItems.filter(
                          (i) => i.categoryid === slot.categoryid
                        );
                        const available = productsByCategory[slot.categoryid] ?? [];
                        const q = (slotSearch[slot.categoryid] ?? "").toLowerCase();
                        const filtered = q
                          ? available.filter(
                              (p) =>
                                p.productname?.toLowerCase().includes(q) ||
                                p.sku?.toLowerCase().includes(q)
                            )
                          : available;

                        return (
                          <SlotPicker
                            key={slot.categoryid}
                            slot={slot}
                            slotPicked={slotPicked}
                            filtered={filtered}
                            search={slotSearch[slot.categoryid] ?? ""}
                            onSearchChange={(v) =>
                              setSlotSearch((prev) => ({
                                ...prev,
                                [slot.categoryid]: v,
                              }))
                            }
                            onPick={(p) => handlePickProduct(p, slot.categoryid)}
                            onRemove={handleRemovePicked}
                            onChangeQuantity={handleChangeQuantity}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    /* No-config: flat product picker */
                    <FlatProductPicker
                      allProducts={allProducts}
                      pickedItems={pickedItems}
                      onPick={(p) => handlePickProduct(p, p.categoryid ?? 0)}
                      onRemove={handleRemovePicked}
                      onChangeQuantity={handleChangeQuantity}
                    />
                  )}

                  {/* Total price */}
                  <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-600">Tổng giá trị:</span>
                    <span className="text-lg font-black text-red-800">
                      {pickedItems
                        .reduce((s, i) => s + (i.product.price ?? 0) * i.quantity, 0)
                        .toLocaleString("vi-VN")}
                      đ
                    </span>
                  </div>

                  {/* Error */}
                  {saveError && (
                    <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{saveError}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex gap-3">
              <button
                onClick={() => setEditBasket(null)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || loadingModal}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#3D0B05] to-[#9F3025] text-white font-bold text-sm hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ BasketCard ═══════════════════════ */

interface BasketCardProps {
  basket: CustomerBasketDto;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onConfirmDelete: () => void;
  onAddToCart: () => void;
  carting: boolean;
}

function BasketCard({
  basket,
  expanded,
  onToggleExpand,
  onEdit,
  onConfirmDelete,
  onAddToCart,
  carting,
}: BasketCardProps) {
  const statusColor =
    basket.status === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : basket.status === "DRAFT"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-red-50 to-amber-50 overflow-hidden">
        {basket.imageUrl ? (
          <img
            src={basket.imageUrl}
            alt={basket.productname}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift size={48} className="text-red-200" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow ${statusColor}`}>
            {basket.status}
          </span>
        </div>
        {basket.configName && (
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-bold bg-[#3D0B05]/80 text-white px-2 py-0.5 rounded-full">
              {basket.configName}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-bold text-tet-primary text-base mb-1 line-clamp-2 min-h-[3rem]">
          {basket.productname}
        </h4>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Giá</p>
            <p className="text-xs font-black text-red-800">
              {basket.totalPrice.toLocaleString()}đ
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Số món</p>
            <p className="text-xs font-black text-amber-700">
              {basket.productDetails?.length ?? 0}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Trọng lượng</p>
            <p className="text-xs font-black text-orange-700">{basket.totalWeight}g</p>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={onAddToCart}
            disabled={carting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-[#3D0B05] to-[#9F3025] text-white text-xs font-bold hover:shadow-md transition disabled:opacity-50"
          >
            {carting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ShoppingCart size={12} />
            )}
            Thêm vào giỏ
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
            title="Chỉnh sửa"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={onConfirmDelete}
            className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Expand/collapse details */}
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
        >
          {expanded ? (
            <>
              <ChevronUp size={13} /> Ẩn chi tiết
            </>
          ) : (
            <>
              <ChevronDown size={13} /> Xem chi tiết sản phẩm
            </>
          )}
        </button>

        {/* Expanded product list */}
        {expanded && (
          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
            {(basket.productDetails ?? []).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">Không có sản phẩm</p>
            ) : (
              basket.productDetails.map((detail, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  {detail.imageUrl ? (
                    <img
                      src={detail.imageUrl}
                      alt={detail.productname}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <Package size={14} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {detail.productname}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {detail.price.toLocaleString()}đ · {detail.unit}g
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-500 shrink-0">
                    ×{detail.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ ProgressSection ═══════════════════════ */

function ProgressSection({
  slotStatus,
  pickedCount,
  allFilled,
}: {
  slotStatus: SlotStatus[];
  pickedCount: number;
  allFilled: boolean;
}) {
  const total = slotStatus.reduce((s, d) => s + d.quantity, 0);
  const pct = total > 0 ? Math.round((pickedCount / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Tiến độ chọn sản phẩm
        </span>
        <span className={`text-xs font-bold ${allFilled ? "text-green-600" : "text-amber-600"}`}>
          {pickedCount}/{total} món
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${allFilled ? "bg-green-500" : "bg-gradient-to-r from-red-600 to-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════ SlotPicker ═══════════════════════ */

interface SlotPickerProps {
  slot: SlotStatus;
  slotPicked: PickedItem[];
  filtered: Product[];
  search: string;
  onSearchChange: (v: string) => void;
  onPick: (p: Product) => void;
  onRemove: (productid: number) => void;
  onChangeQuantity: (productid: number, delta: number) => void;
}

function SlotPicker({
  slot,
  slotPicked,
  filtered,
  search,
  onSearchChange,
  onPick,
  onRemove,
  onChangeQuantity,
}: SlotPickerProps) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 ${
          slot.done
            ? "bg-green-50 border-b border-green-100"
            : "bg-amber-50 border-b border-amber-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <Tag size={13} className={slot.done ? "text-green-500" : "text-amber-600"} />
          <span className="text-xs font-bold text-gray-700">{slot.categoryName}</span>
        </div>
        <span
          className={`text-xs font-black px-2 py-0.5 rounded-full ${
            slot.done ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
          }`}
        >
          {slot.picked}/{slot.quantity}
        </span>
      </div>

      <div className="p-3 space-y-2">
        {/* Picked chips */}
        {slotPicked.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {slotPicked.map((item) => (
              <div
                key={item.productid}
                className="flex items-center gap-0.5 bg-red-50 border border-red-100 rounded-full pl-2 pr-1 py-0.5"
              >
                <span className="text-[10px] font-semibold text-red-800 max-w-[80px] truncate">
                  {item.product.productname}
                </span>
                <button
                  onClick={() => onChangeQuantity(item.productid, -1)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-200 text-red-500 transition shrink-0"
                >
                  <Minus size={9} />
                </button>
                <span className="text-[10px] font-black text-red-800 min-w-[14px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onChangeQuantity(item.productid, 1)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-200 text-red-500 transition shrink-0"
                >
                  <Plus size={9} />
                </button>
                <button
                  onClick={() => onRemove(item.productid)}
                  className="text-red-300 hover:text-red-600 transition ml-0.5"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search + product list (only if slot not full) */}
        {!slot.done && (
          <>
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={`Tìm ${slot.categoryName}...`}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            {filtered.length === 0 ? (
              <p className="text-[11px] text-gray-400 text-center py-2">
                Không có sản phẩm khả dụng
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 [&::-webkit-scrollbar]:hidden">
                {filtered.slice(0, 15).map((p) => (
                  <button
                    key={p.productid}
                    onClick={() => onPick(p)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-amber-50 rounded-lg transition text-left"
                  >
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.productname}
                        className="w-7 h-7 rounded-md object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                        <Package size={12} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-gray-800 truncate">
                        {p.productname}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {(p.price ?? 0).toLocaleString("vi-VN")}đ
                      </p>
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
}

/* ═══════════════════════ FlatProductPicker (no config) ═══════════════════════ */

interface FlatProductPickerProps {
  allProducts: Product[];
  pickedItems: PickedItem[];
  onPick: (p: Product) => void;
  onRemove: (productid: number) => void;
  onChangeQuantity: (productid: number, delta: number) => void;
}

function FlatProductPicker({
  allProducts,
  pickedItems,
  onPick,
  onRemove,
  onChangeQuantity,
}: FlatProductPickerProps) {
  const [search, setSearch] = useState("");
  const pickedSet = new Set(pickedItems.map((i) => i.productid));
  const filtered = allProducts
    .filter((p) => !pickedSet.has(p.productid!))
    .filter((p) =>
      search
        ? p.productname?.toLowerCase().includes(search.toLowerCase())
        : true
    );

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
        Sản phẩm trong giỏ
      </label>

      {/* Picked chips */}
      {pickedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pickedItems.map((item) => (
            <div
              key={item.productid}
              className="flex items-center gap-0.5 bg-red-50 border border-red-100 rounded-full pl-2 pr-1 py-0.5"
            >
              <span className="text-[10px] font-semibold text-red-800 max-w-[80px] truncate">
                {item.product.productname}
              </span>
              <button
                onClick={() => onChangeQuantity(item.productid, -1)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-200 text-red-500 transition shrink-0"
              >
                <Minus size={9} />
              </button>
              <span className="text-[10px] font-black text-red-800 min-w-[14px] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => onChangeQuantity(item.productid, 1)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-200 text-red-500 transition shrink-0"
              >
                <Plus size={9} />
              </button>
              <button
                onClick={() => onRemove(item.productid)}
                className="text-red-300 hover:text-red-600 transition ml-0.5"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm sản phẩm..."
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      {/* Product list */}
      <div className="max-h-48 overflow-y-auto space-y-1 [&::-webkit-scrollbar]:hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">Không tìm thấy sản phẩm</p>
        ) : (
          filtered.slice(0, 20).map((p) => (
            <button
              key={p.productid}
              onClick={() => onPick(p)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-amber-50 rounded-xl transition text-left"
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.productname}
                  className="w-9 h-9 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <Package size={14} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{p.productname}</p>
                <p className="text-[10px] text-gray-400">
                  {(p.price ?? 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
              <Plus size={14} className="text-amber-500 shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
