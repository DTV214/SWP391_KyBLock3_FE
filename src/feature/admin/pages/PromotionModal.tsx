import React from 'react';
import type { CreatePromotionRequest } from '../../checkout/services/promotionService';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

interface PromotionModalProps {
    showModal: boolean;
    editingId: number | null;
    formData: CreatePromotionRequest;
    onFormChange: (data: CreatePromotionRequest) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

interface FormErrors {
    [key: string]: string;
}

const formatDatetimeForInput = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        // Lấy thời gian địa phương theo định dạng YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
};

// Convert Local datetime string from input to ISO string (UTC) for Backend
export const formatDatetimeToISO = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        // Sử dụng getUTC... để giữ nguyên giá trị thời gian từ Backend
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
};

export default function PromotionModal({
    showModal,
    editingId,
    formData,
    onFormChange,
    onSubmit,
    onClose,
}: PromotionModalProps) {
    const [errors, setErrors] = React.useState<FormErrors>({});

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Kiểm tra Giảm giá >= 0
        if (formData.discountValue < 0) {
            newErrors.discountValue = 'Giảm giá phải lớn hơn hoặc bằng 0';
        }

        // Kiểm tra Giảm giá theo phần trăm: 0 <= discountValue <= 100
        if (formData.isPercentage) {
            if (formData.discountValue < 0 || formData.discountValue > 100) {
                newErrors.discountValue = 'Giảm giá theo phần trăm phải từ 0 đến 100';
            }
            // Kiểm tra Giảm giá tối đa >= 0
            if (formData.maxDiscountPrice < 0) {
                newErrors.maxDiscountPrice = 'Giảm giá tối đa phải lớn hơn hoặc bằng 0';
            }
        }

        // Kiểm tra Giá trị đơn tối thiểu >= 0
        if (formData.minPriceToApply < 0) {
            newErrors.minPriceToApply = 'Giá trị đơn tối thiểu phải lớn hơn hoặc bằng 0';
        }

        // Kiểm tra Số lượng giới hạn >= 0
        if (formData.isLimited && formData.limitedCount < 0) {
            newErrors.limitedCount = 'Số lượng giới hạn phải lớn hơn hoặc bằng 0';
        }

        // Kiểm tra thời gian hết hạn phải sau thời gian bắt đầu
        if (formData.startTime && formData.expiryDate) {
            const startTime = new Date(formData.startTime).getTime();
            const expiryDate = new Date(formData.expiryDate).getTime();
            if (expiryDate <= startTime) {
                newErrors.expiryDate = 'Thời gian hết hạn phải sau thời gian bắt đầu';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(e);
        }
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-102 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b p-6 flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold">
                        {editingId ? 'Sửa Promotion' : 'Thêm Promotion'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Mã Code *
                        </label>
                        <Input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) =>
                                onFormChange({ ...formData, code: e.target.value })
                            }
                            disabled={!!editingId}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Discount Value */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Giảm giá *
                            </label>
                            <Input
                                type="number"
                                required
                                min="0"
                                max={formData.isPercentage ? "100" : undefined}
                                value={formData.discountValue}
                                onChange={(e) =>
                                    onFormChange({
                                        ...formData,
                                        discountValue: parseFloat(e.target.value) || 0,
                                    })
                                }
                                className={errors.discountValue ? 'border-red-500' : ''}
                            />
                            {errors.discountValue && (
                                <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>
                            )}
                        </div>

                        {/* Min Price To Apply */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Giá trị đơn tối thiểu để áp dụng *
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.minPriceToApply}
                                onChange={(e) =>
                                    onFormChange({
                                        ...formData,
                                        minPriceToApply: parseFloat(e.target.value) || 0,
                                    })
                                }
                                className={errors.minPriceToApply ? 'border-red-500' : ''}
                            />
                            {errors.minPriceToApply && (
                                <p className="text-red-500 text-sm mt-1">{errors.minPriceToApply}</p>
                            )}
                        </div>

                        {/* Start Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thời gian bắt đầu *
                            </label>
                            <Input
                                type="datetime-local"
                                value={editingId ? formatDatetimeToISO(formData.startTime) : formatDatetimeForInput(formData.startTime)}
                                onChange={(e) =>
                                    onFormChange({
                                        ...formData,
                                        startTime: formatDatetimeForInput(e.target.value)
                                    })
                                }
                            />
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thời gian hết hạn *
                            </label>
                            <Input
                                type="datetime-local"
                                required
                                value={editingId ? formatDatetimeToISO(formData.expiryDate) : formatDatetimeForInput(formData.expiryDate)}
                                onChange={(e) =>
                                    onFormChange({
                                        ...formData,
                                        expiryDate: formatDatetimeForInput(e.target.value)
                                    })
                                }
                                className={errors.expiryDate ? 'border-red-500' : ''}
                            />
                            {errors.expiryDate && (
                                <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                            )}
                        </div>

                        {/* Is Percentage */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isPercentage"
                                checked={formData.isPercentage}
                                onChange={(e) =>
                                    onFormChange({
                                        ...formData,
                                        isPercentage: e.target.checked,
                                    })
                                }
                                disabled={!!editingId}
                                className="w-4 h-4"
                            />
                            <label htmlFor="isPercentage" className="text-sm font-medium text-gray-700">
                                Giảm giá theo phần trăm
                            </label>
                        </div>

                        {/* Is Limited */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isLimited"
                                checked={formData.isLimited}
                                onChange={(e) =>
                                    onFormChange({ ...formData, isLimited: e.target.checked })
                                }
                                disabled={!!editingId}
                                className="w-4 h-4"
                            />
                            <label htmlFor="isLimited" className="text-sm font-medium text-gray-700">
                                Giới hạn số lượng
                            </label>
                        </div>

                        {/* Max Discount Price */}
                        {formData.isPercentage && (

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giảm giá tối đa
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.maxDiscountPrice}
                                    onChange={(e) =>
                                        onFormChange({
                                            ...formData,
                                            maxDiscountPrice: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    className={errors.maxDiscountPrice ? 'border-red-500' : ''}
                                />
                                {errors.maxDiscountPrice && (
                                    <p className="text-red-500 text-sm mt-1">{errors.maxDiscountPrice}</p>
                                )}
                            </div>
                        )}

                        {/* Limited Count */}
                        {formData.isLimited && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số lượng giới hạn
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.limitedCount}
                                    disabled={!!editingId}
                                    onChange={(e) =>
                                        onFormChange({
                                            ...formData,
                                            limitedCount: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    className={errors.limitedCount ? 'border-red-500' : ''}
                                />
                                {errors.limitedCount && (
                                    <p className="text-red-500 text-sm mt-1">{errors.limitedCount}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            className="bg-tet-primary hover:bg-tet-accent"

                        >
                            {editingId ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
