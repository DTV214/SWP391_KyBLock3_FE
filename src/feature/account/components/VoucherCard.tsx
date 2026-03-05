import { motion } from "framer-motion";
import { Info, Clock } from "lucide-react";
import type { PromotionResponse } from "../../checkout/services/promotionService";

interface VoucherCardProps {
    promotion: PromotionResponse;
    color: string;
}

const formatDate = (dateStr: string | number | Date | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);

    // Lấy ngày, tháng, năm trực tiếp từ phương thức UTC để không bị cộng/trừ 7 tiếng
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
};

const getPromotionValue = (promo: PromotionResponse) => {
    if (promo.isPercentage) {
        return `${promo.discountValue}%`;
    }
    return `${Math.round(promo.discountValue / 1000)}K`;
};

const getPromotionTitle = (promo: PromotionResponse) => {
    if (promo.isPercentage) {
        return `Giảm ${promo.discountValue}%`;
    }
    return `Giảm ${formatCurrency(promo.discountValue)}`;
};

export default function VoucherCard({ promotion, color }: VoucherCardProps) {
    const isActive = promotion.status === "ACTIVE";

    // Xác định ngày hiển thị dựa trên trạng thái
    const dateLabel =
        promotion.status === "WAIT_FOR_ACTIVE" ? "Hiệu lực từ" : "HSD";
    const dateValue =
        promotion.status === "WAIT_FOR_ACTIVE"
            ? formatDate(promotion.startTime)
            : formatDate(promotion.expiryDate);

    // Tính phần trăm sử dụng cho progress bar
    const usagePercentage =
        promotion.isLimited && promotion.limitedCount && promotion.limitedCount > 0
            ? Math.min(
                ((promotion.usedCount || 0) / promotion.limitedCount) * 100,
                100
            )
            : 0;

    const minPrice = promotion.minPriceToApply
        ? formatCurrency(promotion.minPriceToApply)
        : "Không có yêu cầu tối thiểu";

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="flex h-auto bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 group transition-all flex-col sm:flex-row"
        >
            {/* Phần màu trái (Value) */}
            <div
                className={`w-full sm:w-32 md:w-40 ${color} flex flex-col items-center justify-center text-white relative py-6 sm:py-0`}
            >
                {/* Ticket Cutouts (Mô phỏng đường xẻ vé) */}
                <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FBF5E8] rounded-full"></div>
                <div className="hidden sm:block absolute right-[-1px] top-0 bottom-0 w-[2px] border-l-2 border-dashed border-white/30"></div>

                <div className="z-10 text-center px-2">
                    <p className="text-2xl md:text-3xl font-black">
                        {getPromotionValue(promotion)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">
                        GIẢM GIÁ
                    </p>
                </div>
            </div>

            {/* Phần thông tin phải */}
            <div className="flex-1 p-5 flex flex-col justify-between relative">
                <span
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold border ${isActive
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-yellow-50 text-yellow-600 border-yellow-100"
                        }`}
                >
                    {isActive ? "Có thể dùng" : "Sắp áp dụng"}
                </span>

                <div className="space-y-2">
                    <h4 className="text-sm md:text-base font-bold text-tet-primary line-clamp-1">
                        {getPromotionTitle(promotion)}
                    </h4>
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                            <Info size={12} /> Đơn tối thiểu: {minPrice}
                        </p>
                        <p className="text-[11px] text-gray-400 italic">
                            Mã: <span className="font-bold text-gray-600">{promotion.code}</span>
                        </p>
                    </div>
                </div>

                {/* Progress bar nếu isLimited là true */}
                {promotion.isLimited && (
                    <div className="my-3 space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-600">
                                Lượt sử dụng
                            </p>
                            <p className="text-[10px] font-bold text-tet-primary">
                                {promotion.usedCount || 0}/{promotion.limitedCount}
                            </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-tet-primary h-full rounded-full transition-all duration-300"
                                style={{ width: `${usagePercentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Date info */}
                <div className="flex items-center justify-between mt-2 border-t border-gray-50 pt-3">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5 font-medium">
                        <Clock size={12} /> {dateLabel}: {dateValue}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
