import { useEffect, useState } from "react";
import { Loader2, ShoppingBasket, TrendingUp } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";
import adminDashboardService, {
  type ProductAssociationItem,
} from "../services/adminDashboardService";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const percentFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

interface ProductOption {
  productId: number;
  productName: string;
}

export default function ProductAssociationsWidget() {
  const [selectedProductIdInput, setSelectedProductIdInput] = useState("76");
  const [topInput, setTopInput] = useState("10");
  const [minSupportInput, setMinSupportInput] = useState("1");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [query, setQuery] = useState({
    productId: 76,
    top: 10,
    minSupport: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [associations, setAssociations] = useState<ProductAssociationItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setProductsLoading(true);

        const response: any = await axiosClient.get(
          `${API_ENDPOINTS.PRODUCTS.LIST}?pageNumber=1&pageSize=1000`,
        );
        const paged = response?.data ?? response;
        const source = Array.isArray(paged?.data)
          ? paged.data
          : Array.isArray(paged)
            ? paged
            : [];

        const options: ProductOption[] = source
          .map((item: any) => ({
            productId: Number(item?.productid ?? item?.productId ?? 0),
            productName: String(
              item?.productname ?? item?.productName ?? "",
            ).trim(),
          }))
          .filter(
            (item: ProductOption) =>
              Number.isInteger(item.productId) &&
              item.productId > 0 &&
              item.productName.length > 0,
          )
          .sort((left: ProductOption, right: ProductOption) =>
            left.productName.localeCompare(right.productName, "vi"),
          );

        if (!isMounted) {
          return;
        }

        setProductOptions(options);

        if (options.length > 0) {
          const exists = options.some(
            (item) => String(item.productId) === selectedProductIdInput,
          );

          if (!exists) {
            const fallbackProductId = options[0].productId;
            setSelectedProductIdInput(String(fallbackProductId));
            setQuery((prev) => ({ ...prev, productId: fallbackProductId }));
          }
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load product options:", err);
        setProductOptions([]);
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchAssociations = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await adminDashboardService.getProductAssociations(
          query.productId,
          query.top,
          query.minSupport,
        );

        if (!isMounted) {
          return;
        }

        setAssociations(data);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load product associations:", err);
        setAssociations([]);
        setError("Không thể tải dữ liệu sản phẩm mua kèm.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchAssociations();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleApply = () => {
    const productId = Number(selectedProductIdInput);
    const top = Number(topInput);
    const minSupport = Number(minSupportInput);

    if (!Number.isInteger(productId) || productId <= 0) {
      setError("Vui lòng chọn sản phẩm hợp lệ.");
      return;
    }

    if (
      productOptions.length > 0 &&
      !productOptions.some((item) => item.productId === productId)
    ) {
      setError("Sản phẩm đã chọn không tồn tại trong danh sách.");
      return;
    }

    if (!Number.isInteger(top) || top <= 0) {
      setError("Top phải là số nguyên dương.");
      return;
    }

    if (!Number.isFinite(minSupport) || minSupport < 0) {
      setError("Min support phải là số không âm.");
      return;
    }

    setError(null);
    setQuery({ productId, top, minSupport });
  };

  const selectedProduct = productOptions.find(
    (item) => item.productId === query.productId,
  );

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 text-cyan-700">
            <ShoppingBasket size={20} />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-tet-primary">
              Sản phẩm thường mua kèm
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Market Basket Analysis đơn giản theo sản phẩm gốc.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700">
          Sản phẩm đang phân tích: {selectedProduct?.productName || "#"}
          {query.productId ? ` (#${query.productId})` : ""}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Sản phẩm
          <select
            value={selectedProductIdInput}
            onChange={(e) => setSelectedProductIdInput(e.target.value)}
            disabled={productsLoading || productOptions.length === 0}
            className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
          >
            {productsLoading ? (
              <option value="">Đang tải sản phẩm...</option>
            ) : productOptions.length > 0 ? (
              productOptions.map((product) => (
                <option
                  key={product.productId}
                  value={String(product.productId)}
                >
                  {product.productName} (#{product.productId})
                </option>
              ))
            ) : (
              <option value="">Không có sản phẩm</option>
            )}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Top
          <input
            type="number"
            min={1}
            value={topInput}
            onChange={(e) => setTopInput(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Min support
          <input
            type="number"
            min={0}
            step="0.1"
            value={minSupportInput}
            onChange={(e) => setMinSupportInput(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-tet-accent/30"
          />
        </label>

        <button
          type="button"
          onClick={handleApply}
          className="mt-[22px] h-10 rounded-xl bg-tet-primary text-sm font-bold text-white hover:opacity-95"
        >
          Áp dụng
        </button>
      </div>

      {error && !loading && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center gap-2 rounded-2xl bg-gray-50 text-sm text-gray-500">
          <Loader2 className="animate-spin" size={18} />
          Đang tải dữ liệu sản phẩm mua kèm...
        </div>
      ) : associations.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <div className="grid grid-cols-[88px_minmax(0,1fr)_140px_140px] bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">
            <span>ID</span>
            <span>Sản phẩm</span>
            <span className="text-right">Số lần mua kèm</span>
            <span className="text-right">Support</span>
          </div>

          <div className="divide-y divide-gray-100">
            {associations.map((item) => (
              <div
                key={item.productId}
                className="grid grid-cols-[88px_minmax(0,1fr)_140px_140px] items-center gap-3 px-4 py-3"
              >
                <span className="text-sm font-semibold text-tet-primary">
                  #{item.productId}
                </span>
                <p className="truncate text-sm font-medium text-gray-700">
                  {item.productName || "Sản phẩm chưa đặt tên"}
                </p>
                <span className="text-right text-sm font-semibold text-gray-700">
                  {numberFormatter.format(item.coPurchaseCount)}
                </span>
                <span className="text-right text-sm font-semibold text-cyan-700">
                  {percentFormatter.format(item.supportPercentage)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl bg-gray-50 text-sm text-gray-500">
          <TrendingUp size={18} />
          Chưa có dữ liệu mua kèm cho sản phẩm này.
        </div>
      )}
    </section>
  );
}
