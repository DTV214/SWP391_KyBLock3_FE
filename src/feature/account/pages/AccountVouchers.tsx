import { motion } from "framer-motion";
import { Ticket } from "lucide-react";
import { useState, useEffect } from "react";
import promotionService from "../../checkout/services/promotionService";
import type { PromotionResponse } from "../../checkout/services/promotionService";
import VoucherCard from "../components/VoucherCard";

const COLORS = [
  "bg-[#9F3025]",
  "bg-[#D97706]",
  "bg-[#3B82F6]",
  "bg-[#7C3AED]",
  "bg-[#DB2777]",
  "bg-[#0D9488]",
];

export default function AccountVouchers() {
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<PromotionResponse[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch promotions on component mount
  useEffect(() => {
    fetchPromotions();
  }, []);

  // Filter, sort and search whenever promotions or search code changes
  useEffect(() => {
    filterAndSortPromotions();
  }, [promotions, searchCode]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const data = await promotionService.getPromotionsByAccount(token || undefined);
      setPromotions(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching promotions:", err);
      setError("Không thể tải mã giảm giá. Vui lòng thử lại.");
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPromotions = () => {
    // 1. Filter by status (only ACTIVE and WAIT_FOR_ACTIVE)
    let filtered = promotions.filter(
      (p) => p.status === "ACTIVE" || p.status === "WAIT_FOR_ACTIVE"
    );

    // 2. Filter by search code
    if (searchCode.trim()) {
      filtered = filtered.filter((p) =>
        p.code.toLowerCase().includes(searchCode.toLowerCase())
      );
    }

    // 3. Sort by expiry date (ascending)
    filtered.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    setFilteredPromotions(filtered);
  };

  const getColorForPromotion = (index: number) => {
    return COLORS[index % COLORS.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 pb-10"
    >
      {/* Show error message if any */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* 1. HEADER & NHẬP MÃ */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-2xl font-serif font-bold text-tet-primary">
            Mã giảm giá
          </h3>
          <p className="text-sm text-gray-400 italic">
            Hãy áp dụng mã giảm giá để được giá ưu đãi
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Ticket
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm mã giảm giá..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-tet-secondary transition-all"
            />
          </div>
        </div>
      </section>

      {/* 2. LOADING & EMPTY STATE */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tet-primary"></div>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
          <p className="text-gray-500 font-medium">Không tìm thấy mã giảm giá</p>
        </div>
      ) : (
        <>
          {/* 3. INFO BAR */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Tổng cộng: <span className="font-bold text-tet-primary">{filteredPromotions.length}</span> mã</p>
            <p>Sắp xếp theo: Ngày hết hạn</p>
          </div>

          {/* 4. LƯỚI VOUCHER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPromotions.map((promo, index) => (
              <VoucherCard
                key={promo.promotionId}
                promotion={promo}
                color={getColorForPromotion(index)}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
