import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket } from "lucide-react";
import { useState, useEffect } from "react";
import promotionService from "../../checkout/services/promotionService";
import type { PromotionResponse } from "../../checkout/services/promotionService";
import VoucherSelectionCard from "./VoucherSelectionCard";

interface PromotionSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (promotion: PromotionResponse) => void;
    selectedPromotionId?: number;
    totalPrice: number;
}

const COLORS = [
    "bg-[#9F3025]",
    "bg-[#D97706]",
    "bg-[#3B82F6]",
    "bg-[#7C3AED]",
    "bg-[#DB2777]",
    "bg-[#0D9488]",
];

export default function PromotionSelectionModal({
    isOpen,
    onClose,
    onSelect,
    selectedPromotionId,
    totalPrice,
}: PromotionSelectionModalProps) {
    const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
    const [filteredPromotions, setFilteredPromotions] = useState<PromotionResponse[]>([]);
    const [searchCode, setSearchCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPromotions();
        }
    }, [isOpen]);

    useEffect(() => {
        filterAndSortPromotions();
    }, [promotions, searchCode, totalPrice]);

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
        // 1. Filter by status (only ACTIVE)
        let filtered = promotions.filter(
            (p) => p.status === "ACTIVE"
        );

        // 2. Filter by search code
        if (searchCode.trim()) {
            filtered = filtered.filter((p) =>
                p.code.toLowerCase().includes(searchCode.toLowerCase())
            );
        }

        // 3. Filter by minPriceToApply - chỉ hiển thị những mã có thể sử dụng
        filtered = filtered.filter((p) => {
            if (p.minPriceToApply && p.minPriceToApply > totalPrice) {
                return false; // Ẩn promotion nếu đơn hàng nhỏ hơn minPrice
            }
            return true; // Hiển thị
        });

        // 4. Sort by expiry date (ascending)
        filtered.sort(
            (a, b) =>
                new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );

        setFilteredPromotions(filtered);
    };

    const getColorForPromotion = (index: number) => {
        return COLORS[index % COLORS.length];
    };

    const handleSelectPromotion = (promotion: PromotionResponse) => {
        onSelect(promotion);
        onClose();
    };

    const handleRemovePromotion = () => {
        onSelect(null as any);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-102 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 md:p-8 flex items-center justify-between rounded-t-[2.5rem]">
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-tet-primary">
                                        Chọn mã giảm giá
                                    </h2>
                                    <p className="text-sm text-gray-400 italic mt-1">
                                        Chọn mã để áp dụng cho đơn hàng của bạn
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-all"
                                >
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 md:p-8 space-y-6">
                                {/* Search Bar */}
                                <div className="flex flex-col sm:flex-row gap-3">
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

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                                        {error}
                                    </div>
                                )}

                                {/* Loading State */}
                                {loading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tet-primary"></div>
                                    </div>
                                ) : filteredPromotions.length === 0 ? (
                                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center">
                                        <p className="text-gray-500 font-medium">Không tìm thấy mã giảm giá</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Info Bar */}
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <p>
                                                Tổng cộng:{" "}
                                                <span className="font-bold text-tet-primary">
                                                    {filteredPromotions.length}
                                                </span>{" "}
                                                mã
                                            </p>
                                        </div>

                                        {/* Voucher Grid */}
                                        <div className="space-y-4">
                                            {filteredPromotions.map((promo, index) => (
                                                <VoucherSelectionCard
                                                    key={promo.promotionId}
                                                    promotion={promo}
                                                    color={getColorForPromotion(index)}
                                                    isSelected={selectedPromotionId === promo.promotionId}
                                                    onSelect={() => handleSelectPromotion(promo)}
                                                />
                                            ))}
                                        </div>

                                        {/* Remove Promotion Option */}
                                        {selectedPromotionId && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <button
                                                    onClick={handleRemovePromotion}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                                >
                                                    Bỏ chọn mã giảm giá
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
