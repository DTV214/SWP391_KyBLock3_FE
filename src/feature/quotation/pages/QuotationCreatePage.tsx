import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { categoryService, type Category } from "@/api/categoryService";
import {
  quotationService,
  type ManualQuotationRequest,
  type QuotationProduct,
  type QuotationProductDetail,
} from "@/feature/quotation/services/quotationService";

type QuoteItem = {
  product: QuotationProduct;
  quantity: number;
};

export default function QuotationCreatePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<QuotationProduct[]>([]);
  const [productDetails, setProductDetails] = useState<Record<number, QuotationProductDetail>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [draftQuantities, setDraftQuantities] = useState<Record<number, number>>({});
  const [form, setForm] = useState({
    company: "",
    address: "",
    email: "",
    phone: "",
    desiredPriceNote: "",
    note: "",
  });

  const getDisplayProduct = (product: QuotationProduct): QuotationProductDetail => {
    return productDetails[product.productid] || (product as QuotationProductDetail);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productRes, categoryRes] = await Promise.all([
          quotationService.getProducts({ pageNumber: 1, pageSize: 200, status: "ACTIVE" }),
          categoryService.getAll(),
        ]);

        const productData = productRes?.data?.data || [];
        const activeProducts = productData.filter(
          (p: QuotationProduct) => p.status === "ACTIVE",
        );
        const categoryData = categoryRes?.data || [];

        setProducts(activeProducts);
        setCategories(categoryData);

        const detailEntries = await Promise.all(
          activeProducts.map(async (product: QuotationProduct) => {
            try {
              const detailRes = await quotationService.getProductById(product.productid);
              const detail = detailRes?.data as QuotationProductDetail | undefined;
              return [product.productid, detail || (product as QuotationProductDetail)] as const;
            } catch {
              return [product.productid, product as QuotationProductDetail] as const;
            }
          }),
        );

        const detailMap = Object.fromEntries(detailEntries) as Record<number, QuotationProductDetail>;
        setProductDetails(detailMap);
        } catch (err) {
        console.error(err);
        setFetchError("Không thể tải danh sách sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;

    return products.filter((product) => {
      const displayProduct = getDisplayProduct(product);
      if (keyword) {
        const name = displayProduct.productname?.toLowerCase() || "";
        const sku = displayProduct.sku?.toLowerCase() || "";
        if (!name.includes(keyword) && !sku.includes(keyword)) return false;
      }

      if (selectedCategory) {
        if (String(displayProduct.categoryid || "") !== selectedCategory) return false;
      }

      if (min !== undefined && displayProduct.price < min) return false;
      if (max !== undefined && displayProduct.price > max) return false;

      return true;
    });
  }, [products, productDetails, search, selectedCategory, minPrice, maxPrice]);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalItems = items.length;
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * (item.product.price || 0),
    0,
  );

  const handleAddItem = (product: QuotationProduct) => {
    const draftQty = Math.max(1, draftQuantities[product.productid] || 1);
    const displayProduct = getDisplayProduct(product);
    setItems((prev) => {
      const existing = prev.find((item) => item.product.productid === product.productid);
      if (existing) {
        return prev.map((item) =>
          item.product.productid === product.productid
            ? { ...item, quantity: item.quantity + draftQty }
            : item,
        );
      }
      return [...prev, { product: displayProduct, quantity: draftQty }];
    });
  };

  const handleChangeQuantity = (productId: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.product.productid === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleSetQuantity = (productId: number, value: number) => {
    const nextValue = Math.max(1, Number.isFinite(value) ? value : 1);
    setItems((prev) =>
      prev.map((item) =>
        item.product.productid === productId
          ? { ...item, quantity: nextValue }
          : item,
      ),
    );
  };

  const handleRemoveItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.productid !== productId));
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.company || !form.address || !form.email || !form.phone) {
      setFormError("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    if (items.length === 0) {
      setFormError("Vui lòng chọn ít nhất 1 sản phẩm.");
      return;
    }

    const payload: ManualQuotationRequest = {
      company: form.company,
      address: form.address,
      email: form.email,
      phone: form.phone,
      desiredPriceNote: form.desiredPriceNote,
      note: form.note,
      items: items.map((item) => ({
        productId: item.product.productid,
        quantity: item.quantity,
      })),
    };

    try {
      setSubmitting(true);
      const response = await quotationService.createManual(payload);
      const data = response?.data;

      if (!data?.quotationId) {
        throw new Error("Tạo yêu cầu thất bại.");
      }

      navigate(`/quotation/status/${data.quotationId}`, {
        state: {
          quotationId: data.quotationId,
          status: data.status,
          company: form.company,
          address: form.address,
          email: form.email,
          phone: form.phone,
          items: items.map((item) => ({
            productname: item.product.productname,
            sku: item.product.sku,
            quantity: item.quantity,
          })),
        },
      });
    } catch (err: any) {
      console.error(err);
      setFormError(
        err?.response?.data?.msg ||
          err?.message ||
          "Không thể tạo nháp báo giá.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FBF5E8]/40 text-[#4a0d06] min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Chọn sản phẩm</h1>
              <p className="mt-2 text-sm text-[#7b5a4c]">
                Tìm kiếm và thêm sản phẩm vào yêu cầu báo giá của bạn.
              </p>
            </div>

            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-5 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b48a7a]" />
                <input
                  className="w-full rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] py-3 pl-11 pr-4 text-sm focus:border-[#7a160e] focus:outline-none"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <select
                  className="w-full rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-3 py-2 text-sm focus:border-[#7a160e] focus:outline-none"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  <option value="">Danh mục</option>
                  {categories.map((category) => (
                    <option key={category.categoryid} value={category.categoryid}>
                      {category.categoryname}
                    </option>
                  ))}
                </select>

                <input
                  className="w-full rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-3 py-2 text-sm focus:border-[#7a160e] focus:outline-none"
                  placeholder="Giá từ"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                />

                <input
                  className="w-full rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-3 py-2 text-sm focus:border-[#7a160e] focus:outline-none"
                  placeholder="Giá đến"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-[#f1e1d6] bg-white p-10 text-center text-sm text-[#7b5a4c]">
                Đang tải sản phẩm...
              </div>
            ) : fetchError ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                {fetchError}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => {
                  const displayProduct = getDisplayProduct(product);
                  const categoryName = categories.find(
                    (category) => category.categoryid === displayProduct.categoryid,
                  )?.categoryname;

                  return (
                    <div
                      key={product.productid}
                      className="flex flex-col gap-4 rounded-3xl border border-[#f1e1d6] bg-white p-5 shadow-sm md:flex-row md:items-center"
                    >
                      <div className="h-24 w-24 overflow-hidden rounded-2xl bg-[#f7ebe2]">
                        {displayProduct.imageUrl ? (
                          <img
                            src={displayProduct.imageUrl}
                            alt={displayProduct.productname}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-[#b48a7a]">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <h3 className="text-base font-semibold">{displayProduct.productname}</h3>
                        <p className="text-xs text-[#8a5b4f]">SKU: {displayProduct.sku || "N/A"}</p>
                        <p className="text-xs text-[#8a5b4f] line-clamp-2">
                          {displayProduct.description || "Sản phẩm quà tặng cao cấp."}
                        </p>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <span className="rounded-full bg-[#edf8f1] px-2 py-1 text-[#276749]">{displayProduct.status}</span>
                          <span className="rounded-full bg-[#f7ebe2] px-2 py-1 text-[#7a160e]">{categoryName || "Chưa phân loại"}</span>
                          <span className="rounded-full bg-[#eef5ff] px-2 py-1 text-[#1e3a8a]">{displayProduct.isCustom ? "Tùy chỉnh" : "Tiêu chuẩn"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                        <p className="text-lg font-bold text-[#7a160e]">
                          {displayProduct.price.toLocaleString("vi-VN")}đ
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 rounded-full border border-[#f1e1d6] bg-white px-2 py-1">
                            <button
                              className="text-[#7a160e]"
                              onClick={() =>
                                setDraftQuantities((prev) => ({
                                  ...prev,
                                  [product.productid]: Math.max(1, (prev[product.productid] || 1) - 1),
                                }))
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              className="w-14 bg-transparent text-center text-sm font-semibold text-[#4a0d06] focus:outline-none"
                              value={draftQuantities[product.productid] || 1}
                              onChange={(event) =>
                                setDraftQuantities((prev) => ({
                                  ...prev,
                                  [product.productid]: Math.max(1, Number(event.target.value) || 1),
                                }))
                              }
                            />
                            <button
                              className="text-[#7a160e]"
                              onClick={() =>
                                setDraftQuantities((prev) => ({
                                  ...prev,
                                  [product.productid]: (prev[product.productid] || 1) + 1,
                                }))
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            className="inline-flex items-center gap-2 rounded-full bg-[#7a160e] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5c0f09]"
                            onClick={() => handleAddItem(product)}
                          >
                            <Plus className="h-4 w-4" /> Thêm vào yêu cầu
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Yêu cầu báo giá</h2>
                <span className="rounded-full bg-[#f7ebe2] px-3 py-1 text-xs font-semibold text-[#7a160e]">Nháp</span>
              </div>

              <div className="mt-4 space-y-4">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#f1e1d6] p-6 text-center text-sm text-[#8a5b4f]">
                    Chưa có sản phẩm nào trong yêu cầu.
                  </div>
                ) : (
                  items.map((item) => {
                    const displayProduct = getDisplayProduct(item.product);
                    return (
                      <div key={item.product.productid} className="rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#f7ebe2]">
                              {displayProduct.imageUrl ? (
                                <img
                                  src={displayProduct.imageUrl}
                                  alt={displayProduct.productname}
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{displayProduct.productname}</p>
                              <p className="text-xs text-[#8a5b4f]">SKU: {displayProduct.sku || "N/A"}</p>
                              <p className="text-xs text-[#8a5b4f]">
                                Đơn giá ước tính: {displayProduct.price.toLocaleString("vi-VN")}đ
                              </p>
                            </div>
                          </div>
                          <button
                            className="text-[#b48a7a] hover:text-red-500"
                            onClick={() => handleRemoveItem(item.product.productid)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-xs text-[#8a5b4f]">Số lượng:</span>
                          <div className="flex items-center gap-2 rounded-full border border-[#f1e1d6] bg-white px-2 py-1">
                            <button className="text-[#7a160e]" onClick={() => handleChangeQuantity(item.product.productid, -1)}>
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              className="w-12 bg-transparent text-center text-sm font-semibold text-[#4a0d06] focus:outline-none"
                              value={item.quantity}
                              onChange={(event) =>
                                handleSetQuantity(item.product.productid, Number(event.target.value) || 1)
                              }
                            />
                            <button className="text-[#7a160e]" onClick={() => handleChangeQuantity(item.product.productid, 1)}>
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 border-t border-[#f1e1d6] pt-4 text-sm text-[#7b5a4c]">
                <div className="flex justify-between"><span>Tổng sản phẩm:</span><span className="font-semibold">{totalItems}</span></div>
                <div className="flex justify-between"><span>Tổng số lượng:</span><span className="font-semibold">{totalQuantity}</span></div>
                <div className="flex justify-between"><span>Ước tính:</span><span className="font-semibold">{totalPrice.toLocaleString("vi-VN")}đ</span></div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3 text-xs text-[#8a5b4f]">
                <AlertTriangle className="h-4 w-4 text-[#b48a7a]" />
                Giá chính thức sẽ được báo sau khi đội ngũ xử lý.
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-semibold">Thông tin công ty</h3>
                <input className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Tên công ty *" value={form.company} onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))} />
                <input className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Địa chỉ *" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
                <input className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Email *" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
                <input className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Số điện thoại *" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
                <input className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Ghi chú về ngân sách (tuỳ chọn)" value={form.desiredPriceNote} onChange={(event) => setForm((prev) => ({ ...prev, desiredPriceNote: event.target.value }))} />
                <textarea rows={4} className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Ghi chú thêm (tuỳ chọn)" value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} />
              </div>

              {formError && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{formError}</div>}

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#7a160e] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7a160e]/20 transition hover:-translate-y-0.5 hover:bg-[#5c0f09] disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  <FileText className="h-4 w-4" />
                  {submitting ? "Đang tạo nháp..." : "Tạo nháp báo giá"}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-[#f1e1d6] bg-[#fff7ee] p-5 text-xs text-[#7b5a4c]">
              <p className="font-semibold text-[#7a160e]">Mẹo hữu ích</p>
              <p className="mt-2">
                Hãy nhập số lượng chính xác để nhận báo giá tốt nhất. Đội ngũ
                của chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






