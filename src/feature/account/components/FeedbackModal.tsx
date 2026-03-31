import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import type { CreateFeedbackRequest, UpdateFeedbackRequest } from '../services/feedbackService';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateFeedbackRequest | UpdateFeedbackRequest) => Promise<void>;
    initialRating?: number;
    initialComment?: string;
    isEditMode?: boolean;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialRating = 5,
    initialComment = '',
    isEditMode = false
}) => {
    const [rating, setRating] = useState(initialRating);
    const [comment, setComment] = useState(initialComment);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setRating(initialRating);
            setComment(initialComment || '');
            setError(null);
        }
    }, [isOpen, initialRating, initialComment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (rating < 1 || rating > 5) {
            setError('Vui lòng chọn số sao từ 1 đến 5.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await onSubmit({ rating, comment });
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi gửi đánh giá.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) onClose();
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md border border-gray-100"
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                                <h2 className="text-xl font-semibold text-[#690000]">
                                    {isEditMode ? 'Chỉnh sửa đánh giá' : 'Đánh giá đơn hàng'}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Chất lượng sản phẩm</label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className={`transition-colors focus:outline-none rounded-full p-1 ${
                                                        star <= rating 
                                                            ? 'text-yellow-400' 
                                                            : 'text-gray-300 hover:text-yellow-200'
                                                    }`}
                                                >
                                                    <Star className="w-8 h-8 md:w-10 md:h-10 fill-current border-none outline-none" />
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2 font-medium">
                                            {rating === 5 ? 'Tuyệt vời' 
                                                : rating === 4 ? 'Rất tốt' 
                                                : rating === 3 ? 'Khá tốt' 
                                                : rating === 2 ? 'Tạm được' 
                                                : 'Không hài lòng'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nhận xét (Tùy chọn)
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#690000] focus:border-[#690000] transition-colors resize-none"
                                            placeholder="Hãy chia sẻ nhận xét của bạn về đơn hàng này..."
                                            maxLength={1000}
                                        />
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {comment.length}/1000
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 text-sm font-medium text-white bg-[#690000] hover:bg-[#800000] border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#690000] focus:ring-offset-2 disabled:opacity-50 transition-colors inline-flex items-center justify-center min-w-[100px]"
                                        >
                                            {isSubmitting ? (
                                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            ) : (
                                                isEditMode ? 'Cập nhật' : 'Gửi đánh giá'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
