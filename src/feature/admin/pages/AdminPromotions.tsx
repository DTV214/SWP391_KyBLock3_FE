import { useEffect, useState, useRef } from 'react';
import type { PromotionResponse, CreatePromotionRequest } from '../../checkout/services/promotionService';
import promotionService from '../../checkout/services/promotionService';
import PromotionModal from './PromotionModal';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { Plus, Edit, Trash2, Search, ChevronDown } from 'lucide-react';

interface FormData extends CreatePromotionRequest { }

const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    WAIT_FOR_ACTIVE: 'bg-yellow-100 text-yellow-800',
    LIMITED_REACHED: 'bg-red-100 text-red-800',
    OUT_OF_DATE: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    WAIT_FOR_ACTIVE: 'Chờ kích hoạt',
    LIMITED_REACHED: 'Hết lượt',
    OUT_OF_DATE: 'Đã hết hạn',
};

const formatDate = (dateStr: string | number | Date | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);

    // Lấy ngày, tháng, năm trực tiếp từ phương thức UTC để không bị cộng/trừ 7 tiếng
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
};

export default function AdminPromotions() {
    const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
    const [filteredPromotions, setFilteredPromotions] = useState<PromotionResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search, Filter, Sort states
    const [searchCode, setSearchCode] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Dropdown open states
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [formData, setFormData] = useState<FormData>({
        code: '',
        minPriceToApply: 0,
        discountValue: 0,
        maxDiscountPrice: 0,
        isPercentage: false,
        startTime: '',
        expiryDate: '',
        isLimited: false,
        limitedCount: 0,
    });

    // Fetch all promotions
    const fetchPromotions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await promotionService.getAllPromotions();
            setPromotions(data);
        } catch (err) {
            setError('Lỗi khi tải danh sách promotion');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Apply search, filter, and sort
    useEffect(() => {
        let result = promotions;

        // Search by code
        if (searchCode) {
            result = result.filter((promo) =>
                promo.code.toUpperCase().includes(searchCode.toUpperCase())
            );
        }

        // Filter by status
        if (filterStatus && filterStatus !== 'ALL') {
            result = result.filter((promo) => promo.status === filterStatus);
        }

        // Sort by expiry date
        result.sort((a, b) => {
            const dateA = new Date(a.expiryDate).getTime();
            const dateB = new Date(b.expiryDate).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredPromotions(result);
    }, [promotions, searchCode, filterStatus, sortOrder]);

    useEffect(() => {
        fetchPromotions();
    }, []);

    // Handle click outside to close dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setStatusDropdownOpen(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setSortDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Reset form
    const resetForm = () => {
        setFormData({
            code: '',
            minPriceToApply: 0,
            discountValue: 0,
            maxDiscountPrice: 0,
            isPercentage: false,
            startTime: '',
            expiryDate: '',
            isLimited: false,
            limitedCount: 0,
        });
        setEditingId(null);
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await promotionService.updatePromotion(editingId, formData);
            } else {
                await promotionService.createPromotion(formData);
            }
            setShowModal(false);
            resetForm();
            fetchPromotions();
        } catch (err) {
            setError('Lỗi khi lưu promotion');
            console.error(err);
        }
    };

    // Handle edit
    const handleEdit = async (id: number) => {
        try {
            const promotion = await promotionService.getPromotionById(id);
            setFormData({
                code: promotion.code,
                minPriceToApply: promotion.minPriceToApply || 0,
                discountValue: promotion.discountValue,
                maxDiscountPrice: promotion.maxDiscountPrice || 0,
                isPercentage: promotion.isPercentage,
                startTime: promotion.startTime || '',
                expiryDate: promotion.expiryDate,
                isLimited: promotion.isLimited,
                limitedCount: promotion.limitedCount || 0,
            });
            setEditingId(id);
            setShowModal(true);
        } catch (err) {
            setError('Lỗi khi tải thông tin promotion');
            console.error(err);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (deleteId === null) return;
        try {
            await promotionService.deletePromotion(deleteId);
            setShowDeleteDialog(false);
            setDeleteId(null);
            fetchPromotions();
        } catch (err) {
            setError('Lỗi khi xóa promotion');
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Quản lý Promotion</h1>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-tet-primary hover:bg-tet-accent"
                >
                    <Plus size={18} className="mr-2" />
                    Thêm Promotion
                </Button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Search, Filter, Sort Bar */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Nhóm Search và Filter bên trái */}
                    <div className="flex flex-1 flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Tìm theo mã code..."
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                className="pl-10 bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:border-gray-400"
                            />
                            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                        </div>

                        {/* Filter by Status */}
                        <div className="w-full md:w-48 relative" ref={statusDropdownRef}>
                            <button
                                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-left flex justify-between items-center hover:border-gray-400 hover:shadow-sm transition-all"
                            >
                                <span className="text-gray-700">
                                    {filterStatus === 'ALL' ? 'Tất cả trạng thái' :
                                        filterStatus === 'ACTIVE' ? 'Đang hoạt động' :
                                            filterStatus === 'WAIT_FOR_ACTIVE' ? 'Chờ kích hoạt' :
                                                filterStatus === 'LIMITED_REACHED' ? 'Hết lượt' :
                                                    filterStatus === 'OUT_OF_DATE' ? 'Đã hết hạn' : filterStatus}
                                </span>
                                <ChevronDown size={16} className={`transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {statusDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                                    <div
                                        onClick={() => {
                                            setFilterStatus('ALL');
                                            setStatusDropdownOpen(false);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                    >
                                        Tất cả trạng thái
                                    </div>
                                    <div
                                        onClick={() => {
                                            setFilterStatus('ACTIVE');
                                            setStatusDropdownOpen(false);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                    >
                                        Đang hoạt động
                                    </div>
                                    <div
                                        onClick={() => {
                                            setFilterStatus('WAIT_FOR_ACTIVE');
                                            setStatusDropdownOpen(false);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                    >
                                        Chờ kích hoạt
                                    </div>
                                    <div
                                        onClick={() => {
                                            setFilterStatus('LIMITED_REACHED');
                                            setStatusDropdownOpen(false);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                    >
                                        Hết lượt
                                    </div>
                                    <div
                                        onClick={() => {
                                            setFilterStatus('OUT_OF_DATE');
                                            setStatusDropdownOpen(false);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                    >
                                        Đã hết hạn
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sort by Expiry Date - Đẩy sang phải cùng */}
                    <div className="w-full md:w-48 relative " ref={sortDropdownRef}>
                        <button
                            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-left flex justify-between items-center hover:border-gray-400 hover:shadow-sm transition-all"
                        >
                            <span className="text-gray-700 whitespace-nowrap">
                                {sortOrder === 'asc' ? 'Hạn sớm nhất trước' : 'Hạn muộn nhất trước'}
                            </span>
                            <ChevronDown size={16} className={`transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {sortDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                                <div
                                    onClick={() => {
                                        setSortOrder('asc');
                                        setSortDropdownOpen(false);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                >
                                    Hạn sớm nhất trước
                                </div>
                                <div
                                    onClick={() => {
                                        setSortOrder('desc');
                                        setSortDropdownOpen(false);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                >
                                    Hạn muộn nhất trước
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Promotions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-6 text-center">Đang tải...</div>
                ) : filteredPromotions.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">Không có promotion nào</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mã Code</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Giảm giá</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hạn sử dụng</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sử dụng</th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredPromotions.map((promo) => (
                                    <tr key={promo.promotionId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{promo.code}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-tet-primary font-bold">
                                                {promo.discountValue}
                                                {promo.isPercentage ? '%' : ' đ'}
                                            </span>
                                            {!!promo.maxDiscountPrice && promo.maxDiscountPrice > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    Max: {promo.maxDiscountPrice.toLocaleString()} đ
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(promo.startTime)} - {formatDate(promo.expiryDate)}                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={statusColors[promo.status]}>
                                                {statusLabels[promo.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {promo.usedCount || 0} / {promo.isLimited ? promo.limitedCount : '∞'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(promo.promotionId)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    <Edit size={16} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setDeleteId(promo.promotionId);
                                                        setShowDeleteDialog(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <PromotionModal
                showModal={showModal}
                editingId={editingId}
                formData={formData}
                onFormChange={setFormData}
                onSubmit={handleSubmit}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa promotion này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-3">
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Xóa
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
