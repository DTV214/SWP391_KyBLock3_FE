import { motion } from "framer-motion";
import { Info, Clock, Check } from "lucide-react";
import type { PromotionResponse } from "../services/promotionService";

interface VoucherSelectionCardProps {
    promotion: PromotionResponse;
    color: string;
    isSelected: boolean;
    onSelect: () => void;
}

const formatDate = (dateStr: string | number | Date | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
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

export default function VoucherSelectionCard({
    promotion,
    color,
    isSelected,
    onSelect,
}: VoucherSelectionCardProps) {
    const isActive = promotion.status === "ACTIVE";

    const dateLabel =
        promotion.status === "WAIT_FOR_ACTIVE" ? "Hiệu lực từ" : "HSD";
    const dateValue =
        promotion.status === "WAIT_FOR_ACTIVE"
            ? formatDate(promotion.startTime)
            : formatDate(promotion.expiryDate);

    const usagePercentage =
        promotion.isLimited && promotion.limitedCount && promotion.limitedCount > 0
            ? Math.min(
                ((promotion.usedCount || 0) / promotion.limitedCount) * 100,
                100
            )
            : 0;

    const minPrice = promotion.minPriceToApply
        ? formatCurrency(promotion.minPriceToApply)
        : "0đ";

    return (
        <motion.button
            onClick={onSelect}
            whileHover={{ y: -2 }}
            className={`w-full text-left transition-all ${isSelected ? "ring-2 ring-tet-primary ring-offset-2" : ""
                }`}
        >
            <div className={`flex gap-4 p-4 bg-white rounded-2xl border-2 transition-all ${isSelected ? "border-tet-primary bg-tet-primary/5" : "border-gray-100 hover:border-gray-200"
                }`}>
                {/* Left Section - Color Block */}
                <div className={`w-20 h-20 ${color} rounded-xl flex flex-col items-center justify-center text-white shrink-0 relative`}>
                    <p className="text-xl font-black">{getPromotionValue(promotion)}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">
                        Giảm
                    </p>

                    {/* Selected Indicator */}
                    {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-tet-primary rounded-full p-1 text-white">
                            <Check size={14} />
                        </div>
                    )}
                </div>

                {/* Right Section - Details */}
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h4 className="text-sm font-bold text-tet-primary line-clamp-1">
                                {getPromotionTitle(promotion)}
                            </h4>
                            <p className="text-[11px] text-gray-400">
                                Mã: <span className="font-bold text-gray-600">{promotion.code}</span>
                            </p>
                        </div>
                        <span
                            className={`text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shrink-0 ${isActive
                                ? "bg-green-50 text-green-600"
                                : "bg-yellow-50 text-yellow-600"
                                }`}
                        >
                            {isActive ? "Có thể dùng" : "Sắp áp dụng"}
                        </span>
                    </div>

                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Info size={10} /> Đơn tối thiểu: {minPrice}
                    </p>

                    {promotion.maxDiscountPrice > 0 && (
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Info size={10} /> Giảm tối đa: {formatCurrency(promotion.maxDiscountPrice)}
                        </p>
                    )}

                    {/* Progress bar if limited */}
                    {promotion.isLimited && (
                        <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-bold text-gray-600">
                                    Lượt sử dụng: {promotion.usedCount || 0}/{promotion.limitedCount}
                                </p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                                <div
                                    className="bg-tet-primary h-full rounded-full transition-all duration-300"
                                    style={{ width: `${usagePercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <p className="text-[10px] text-gray-400 flex items-center gap-1 pt-1">
                        <Clock size={10} /> {dateLabel}: {dateValue}
                    </p>
                </div>
            </div>
        </motion.button>
    );
}
