import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  FileText,
  Filter,
  Package,
  ShoppingCart,
  X,
} from "lucide-react";
import { categoryService, type Category } from "@/api/categoryService";
import {
  quotationService,
  type QuotationCreateManualRequest,
  type QuotationProduct,
  type QuotationProductDetail,
} from "@/feature/quotation/services/quotationService";

type QuoteItem = {
  product: QuotationProduct;
  quantity: number;
};

type PriceRange = { min?: number; max?: number };

const PRICE_PRESETS: { label: string; range: PriceRange }[] = [
  { label: "Tất cả", range: {} },
  { label: "< 100k", range: { max: 100_000 } },
  { label: "100k - 500k", range: { min: 100_000, max: 500_000 } },
  { label: "500k - 1tr", range: { min: 500_000, max: 1_000_000 } },
  { label: "> 1tr", range: { min: 1_000_000 } },
];

const ITEMS_PER_PAGE = 10;
const GIFT_BOX_CATEGORY_VALUE = "__gift_box__";
const VAT_RATE_PREVIEW = 0.08;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [priceFilterOpen, setPriceFilterOpen] = useState(false);

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [draftQuantities, setDraftQuantities] = useState<Record<number, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<QuotationProductDetail | null>(null);
  const [form, setForm] = useState({
    company: "",
    address: "",
    email: "",
    phone: "",
    desiredPriceNote: "",
    note: "",
    requireVatInvoice: false,
    vatCompanyName: "",
    vatCompanyTaxCode: "",
    vatCompanyAddress: "",
    vatInvoiceEmail: "",
  });

  const getDisplayProduct = (product: QuotationProduct): QuotationProductDetail => {
    return productDetails[product.productid] || (product as QuotationProductDetail);
  };

  const getCategoryName = (product: QuotationProductDetail) => {
    if (product.categoryid == null) return "Hộp quà";
    return (
      categories.find((category) => category.categoryid === product.categoryid)
        ?.categoryname || "Chưa phân loại"
    );
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

    const list = products.filter((product) => {
      const displayProduct = getDisplayProduct(product);
      if (keyword) {
        const name = displayProduct.productname?.toLowerCase() || "";
        const sku = displayProduct.sku?.toLowerCase() || "";
        if (!name.includes(keyword) && !sku.includes(keyword)) return false;
      }

      if (selectedCategory) {
        if (selectedCategory === GIFT_BOX_CATEGORY_VALUE) {
          if (displayProduct.categoryid != null) return false;
        } else if (String(displayProduct.categoryid ?? "") !== selectedCategory) {
          return false;
        }
      }

      if (min !== undefined && displayProduct.price < min) return false;
      if (max !== undefined && displayProduct.price > max) return false;

      return true;
    });

    switch (sortBy) {
      case "price-asc":
        return list.sort((a, b) => getDisplayProduct(a).price - getDisplayProduct(b).price);
      case "price-desc":
        return list.sort((a, b) => getDisplayProduct(b).price - getDisplayProduct(a).price);
      default:
        return list.sort((a, b) =>
          (getDisplayProduct(a).productname || "").localeCompare(
            getDisplayProduct(b).productname || "",
            "vi",
          ),
        );
    }
  }, [products, productDetails, search, selectedCategory, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, minPrice, maxPrice, sortBy]);

  const pageCount = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const activePricePreset = (range: PriceRange) =>
    (range.min?.toString() || "") === minPrice &&
    (range.max?.toString() || "") === maxPrice;

  const handleSelectPricePreset = (range: PriceRange) => {
    setMinPrice(range.min?.toString() || "");
    setMaxPrice(range.max?.toString() || "");
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("name");
  };

  const selectedProductCategory = selectedProduct
    ? getCategoryName(selectedProduct)
    : undefined;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalItems = items.length;
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * (item.product.price || 0),
    0,
  );
  const vatAmountPreview = form.requireVatInvoice
    ? Math.round(totalPrice * VAT_RATE_PREVIEW)
    : 0;
  const finalPayablePreview = totalPrice + vatAmountPreview;

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

    if (form.requireVatInvoice) {
      if (
        !form.vatCompanyName.trim() ||
        !form.vatCompanyTaxCode.trim() ||
        !form.vatCompanyAddress.trim() ||
        !form.vatInvoiceEmail.trim()
      ) {
        setFormError("Vui lòng nhập đầy đủ thông tin VAT.");
        return;
      }

      if (!EMAIL_PATTERN.test(form.vatInvoiceEmail.trim())) {
        setFormError("Email xác thực VAT không hợp lệ.");
        return;
      }
    }

    const payload: QuotationCreateManualRequest = {
      company: form.company.trim(),
      address: form.address.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      desiredPriceNote: form.desiredPriceNote.trim(),
      note: form.note.trim(),
      requireVatInvoice: form.requireVatInvoice,
      vatCompanyName: form.requireVatInvoice ? form.vatCompanyName.trim() : null,
      vatCompanyTaxCode: form.requireVatInvoice ? form.vatCompanyTaxCode.trim() : null,
      vatCompanyAddress: form.requireVatInvoice ? form.vatCompanyAddress.trim() : null,
      vatInvoiceEmail: form.requireVatInvoice ? form.vatInvoiceEmail.trim() : null,
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
      <div className="container mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Chọn sản phẩm</h1>
              <p className="mt-2 text-sm text-[#7b5a4c]">
                Tìm kiếm và thêm sản phẩm vào yêu cầu báo giá của bạn.
              </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-5 items-start">
              <aside className="w-full xl:w-52 shrink-0 space-y-4 xl:sticky xl:top-24 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Filter size={15} className="text-tet-primary" /> Tìm kiếm
                  </h3>
                  <div className="relative w-full">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-700 transition-all focus:border-tet-primary focus:outline-none focus:ring-2 focus:ring-tet-primary/10"
                      placeholder="Tên, SKU..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">
                    Danh mục
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { categoryid: "", categoryname: "Tất cả" },
                      {
                        categoryid: GIFT_BOX_CATEGORY_VALUE,
                        categoryname: "Hộp quà",
                      },
                      ...categories,
                    ].map(
                      (category) => {
                        const value = String(category.categoryid);
                        const active = selectedCategory === value;
                        return (
                          <button
                            type="button"
                            key={value || "all"}
                            onClick={() => setSelectedCategory(value)}
                            className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                              active
                                ? "bg-tet-primary text-white shadow-md shadow-tet-primary/20"
                                : "text-gray-500 hover:bg-gray-50 hover:text-tet-primary"
                            }`}
                          >
                            {category.categoryname}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setPriceFilterOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                  >
                    <span>Khoảng giá</span>
                    {priceFilterOpen ? (
                      <Minus size={15} className="text-tet-primary" />
                    ) : (
                      <Plus size={15} className="text-tet-primary" />
                    )}
                  </button>

                  {priceFilterOpen && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-col gap-1.5">
                        {PRICE_PRESETS.map((preset) => {
                          const active = activePricePreset(preset.range);
                          return (
                            <button
                              type="button"
                              key={preset.label}
                              onClick={() => handleSelectPricePreset(preset.range)}
                              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                active
                                  ? "bg-tet-primary text-white shadow-md shadow-tet-primary/20"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-tet-primary"
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs focus:border-tet-primary focus:outline-none"
                          placeholder="Từ"
                          value={minPrice}
                          onChange={(event) => setMinPrice(event.target.value)}
                        />
                        <input
                          className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs focus:border-tet-primary focus:outline-none"
                          placeholder="Đến"
                          value={maxPrice}
                          onChange={(event) => setMaxPrice(event.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full bg-tet-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-tet-accent shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <X size={16} /> Xóa bộ lọc
                </button>
              </aside>

              <div className="flex-1 w-full min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div className="flex items-end gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                        Sản phẩm báo giá
                      </h2>
                      <p className="text-sm text-gray-400 mt-0.5">
                        Chọn từng món quà cần gửi yêu cầu báo giá
                      </p>
                    </div>
                    <span className="mb-1 text-xs font-bold text-white bg-tet-accent px-2.5 py-0.5 rounded-full">
                      {filteredProducts.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-gray-500">
                      Sắp xếp:
                    </span>
                    <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
                      {[
                        { value: "name", label: "Tên" },
                        { value: "price-asc", label: "Giá tăng" },
                        { value: "price-desc", label: "Giá giảm" },
                      ].map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            sortBy === option.value
                              ? "bg-gray-100 text-gray-800"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                      >
                        <div className="aspect-square bg-gray-200" />
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-5 bg-gray-100 rounded w-1/2" />
                          <div className="h-9 bg-gray-100 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : fetchError ? (
                  <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                    {fetchError}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-20 text-gray-300 shadow-sm">
                    <Package size={64} strokeWidth={1.2} />
                    <p className="mt-4 text-base font-semibold text-gray-400">
                      Không có sản phẩm nào
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      Thử đổi từ khóa hoặc bộ lọc khác
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {paginatedProducts.map((product) => {
                        const displayProduct = getDisplayProduct(product);
                        const quantity = draftQuantities[product.productid] || 1;

                        return (
                          <div
                            key={product.productid}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedProduct(displayProduct)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedProduct(displayProduct);
                              }
                            }}
                            className="bg-white rounded-2xl p-3.5 shadow-sm border border-transparent hover:border-tet-secondary hover:shadow-xl transition-all group relative min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-tet-primary/25"
                          >
                            <div className="aspect-[4/3] overflow-hidden rounded-xl mb-3 bg-gray-50">
                              {displayProduct.imageUrl ? (
                                <img
                                  src={displayProduct.imageUrl}
                                  alt={displayProduct.productname}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase text-gray-300">
                                  No Image
                                </div>
                              )}
                            </div>

                            <h3 className="font-serif text-tet-primary text-base sm:text-lg mb-1.5 line-clamp-1">
                              {displayProduct.productname}
                            </h3>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">
                              SKU: {displayProduct.sku || "N/A"}
                            </p>
                            <p className="text-tet-accent font-bold text-lg sm:text-xl mb-3">
                              {displayProduct.price.toLocaleString("vi-VN")}đ
                            </p>

                            <div
                              className="grid grid-cols-[104px_minmax(0,1fr)] gap-2"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex h-9 items-center justify-between border border-gray-200 rounded-full px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftQuantities((prev) => ({
                                      ...prev,
                                      [product.productid]: Math.max(1, quantity - 1),
                                    }))
                                  }
                                  className="text-gray-400 hover:text-tet-primary transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-9 bg-transparent text-center text-sm font-bold focus:outline-none"
                                  value={quantity}
                                  onChange={(event) =>
                                    setDraftQuantities((prev) => ({
                                      ...prev,
                                      [product.productid]: Math.max(1, Number(event.target.value) || 1),
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftQuantities((prev) => ({
                                      ...prev,
                                      [product.productid]: quantity + 1,
                                    }))
                                  }
                                  className="text-gray-400 hover:text-tet-primary transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddItem(product)}
                                className="min-w-0 h-9 bg-tet-primary text-white px-3 rounded-full flex items-center justify-center gap-1.5 text-sm font-bold hover:brightness-110 transition-all"
                              >
                                <ShoppingCart size={16} className="shrink-0" />
                                <span className="truncate">Thêm</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {pageCount > 1 && (
                      <div className="mt-12 flex flex-wrap justify-center items-center gap-2">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                        >
                          Trang trước
                        </button>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {Array.from({ length: pageCount }).map((_, index) => (
                            <button
                              type="button"
                              key={index}
                              onClick={() => setCurrentPage(index + 1)}
                              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                                currentPage === index + 1
                                  ? "bg-tet-primary text-white shadow-lg shadow-tet-primary/30"
                                  : "bg-white text-gray-500 border border-gray-100 hover:border-tet-primary"
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={currentPage === pageCount}
                          onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                          className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-tet-primary hover:border-tet-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-bold"
                        >
                          Trang sau
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:mt-[118px]">
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
                <div className="flex justify-between"><span>Ước tính trước VAT:</span><span className="font-semibold">{totalPrice.toLocaleString("vi-VN")}đ</span></div>
                {form.requireVatInvoice && (
                  <>
                    <div className="flex justify-between"><span>VAT tạm tính (8%):</span><span className="font-semibold">{vatAmountPreview.toLocaleString("vi-VN")}đ</span></div>
                    <div className="mt-2 flex justify-between border-t border-[#f1e1d6] pt-2 text-[#7a160e]"><span>Tạm tính gồm VAT:</span><span className="font-bold">{finalPayablePreview.toLocaleString("vi-VN")}đ</span></div>
                  </>
                )}
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

              <div className="mt-6 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.requireVatInvoice}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        requireVatInvoice: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-[#d7b8a5] text-[#7a160e] focus:ring-[#7a160e]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[#7a160e]">Yêu cầu VAT</span>
                  </span>
                </label>

                {form.requireVatInvoice && (
                  <div className="mt-4 space-y-3">
                    <input className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Tên công ty *" value={form.vatCompanyName} onChange={(event) => setForm((prev) => ({ ...prev, vatCompanyName: event.target.value }))} />
                    <input className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Mã số thuế *" value={form.vatCompanyTaxCode} onChange={(event) => setForm((prev) => ({ ...prev, vatCompanyTaxCode: event.target.value }))} />
                    <input className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Địa chỉ công ty *" value={form.vatCompanyAddress} onChange={(event) => setForm((prev) => ({ ...prev, vatCompanyAddress: event.target.value }))} />
                    <input type="email" className="w-full rounded-2xl border border-[#f1e1d6] bg-white px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none" placeholder="Email xác thực VAT *" value={form.vatInvoiceEmail} onChange={(event) => setForm((prev) => ({ ...prev, vatInvoiceEmail: event.target.value }))} />
                  </div>
                )}
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

      {selectedProduct && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-tet-accent">
                  Chi tiết sản phẩm
                </p>
                <h2 className="mt-1 text-2xl font-serif font-bold text-tet-primary">
                  {selectedProduct.productname}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-tet-primary"
              >
                <X size={22} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-92px)] overflow-y-auto p-6">
              <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
                <div className="aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.productname}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold uppercase text-gray-300">
                      No Image
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-5">
                  <div>
                    <p className="text-sm font-bold uppercase text-gray-400">
                      SKU: {selectedProduct.sku || "N/A"}
                    </p>
                    <p className="mt-3 text-3xl font-black italic text-tet-primary">
                      {selectedProduct.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                      {selectedProduct.status}
                    </span>
                    <span className="rounded-full bg-tet-primary/10 px-3 py-1.5 text-tet-primary">
                      {selectedProductCategory || "Chưa phân loại"}
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
                      {selectedProduct.isCustom ? "Tùy chỉnh" : "Tiêu chuẩn"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                    <h3 className="font-serif text-lg font-bold text-tet-primary">
                      Mô tả
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {selectedProduct.description || "Sản phẩm quà tặng cao cấp."}
                    </p>
                  </div>

                </div>
              </div>

              {Array.isArray(selectedProduct.productDetails) &&
                selectedProduct.productDetails.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] p-4">
                    <h3 className="font-serif text-lg font-bold text-tet-primary">
                      Chi tiết giỏ quà
                    </h3>
                    <div className="mt-3 space-y-3">
                      {selectedProduct.productDetails.map((detail: any, index: number) => (
                        <div
                          key={detail.productdetailid || detail.productid || index}
                          className="flex items-center gap-3 rounded-xl bg-white p-3"
                        >
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {(detail.imageurl || detail.imageUrl || detail.childProduct?.imageUrl) ? (
                              <img
                                src={
                                  detail.imageurl ||
                                  detail.imageUrl ||
                                  detail.childProduct?.imageUrl
                                }
                                alt={
                                  detail.productname ||
                                  detail.childProduct?.productname ||
                                  "Sản phẩm"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-100" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-tet-primary">
                              {detail.productname ||
                                detail.childProduct?.productname ||
                                "Sản phẩm"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Số lượng: {detail.quantity || 1}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-tet-primary">
                            {Number(detail.price || detail.childProduct?.price || 0).toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






