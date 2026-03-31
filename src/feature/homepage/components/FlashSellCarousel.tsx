// src/feature/homepage/components/FlashSellCarousel.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PromotionCard from "./PromotionCard";
import promotionService, { type PromotionResponse } from "../../checkout/services/promotionService";

const colorOptions = [
  "bg-gradient-to-br from-red-500 to-red-600",
  "bg-gradient-to-br from-orange-500 to-orange-600",
  "bg-gradient-to-br from-yellow-500 to-yellow-600",
  "bg-gradient-to-br from-pink-500 to-pink-600",
];

export default function FlashSellCarousel() {
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let data: PromotionResponse[];

        if (token) {
          // If logged in, use limited_public API with token
          data = await promotionService.getLimitedPromotions(token);
        } else {
          // If not logged in, use limited API
          data = await promotionService.getLimitedPublicPromotions();
        }

        setPromotions(data);
      } catch (err) {
        console.error("Failed to fetch promotions:", err);
        setError("Không thể tải danh sách ưu đãi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, [token]);

  const handleSaveSuccess = (promotionId: number) => {
    // Update the promotion in the local state to reflect the change
    setPromotions((prev) =>
      prev.map((promo) =>
        promo.promotionId === promotionId
          ? { ...promo, isAlreadySave: true }
          : promo
      )
    );
  };

  return (
    <section className="relative py-12 md:py-20 px-4 md:px-10 bg-white overflow-hidden">
      
      <div className="absolute inset-0 bg-cloud-pattern opacity-[0.02] pointer-events-none"></div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Tiêu đề Banner: Tối ưu cho Mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-8 md:mb-12 border-b border-gray-100 pb-6 gap-4">
          <div className="text-center sm:text-left">
            <p className="text-tet-accent font-serif italic mb-1 text-sm md:text-base">
              Quà tặng từ tâm
            </p>
            <h2 className="text-3xl md:text-5xl font-serif text-tet-primary tracking-tight">
              Ưu Đãi Đặc Biệt
            </h2>
          </div>
          <Link
            to="/account/vouchers"
            className="text-tet-accent font-bold hover:underline flex items-center gap-2 text-sm md:text-base group"
          >
            Xem tất cả{" "}
            <span className="text-xl group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </Link>
        </div>

        {/* Lưới sản phẩm Responsive: 1 cột (Mobile), 2 cột (Tablet), 4 cột (Desktop) */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Đang tải ưu đãi...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-red-500">{error}</div>
          </div>
        ) : promotions.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Không có ưu đãi nào</div>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {promotions.map((promotion, index) => (
              <motion.div
                key={promotion.promotionId}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.4 }}
              >
                <PromotionCard
                  promotion={promotion}
                  color={colorOptions[index % colorOptions.length]}
                  token={token || undefined}
                  onSaveSuccess={handleSaveSuccess}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
