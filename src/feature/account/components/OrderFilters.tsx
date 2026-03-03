import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { SortBy } from '../utils/orderFilterUtils';
import { getDateRangeOptions } from '../utils/orderFilterUtils';
import { ORDER_STATUS } from '../utils/orderStatusUtils';

interface OrderFiltersProps {
    onSearchChange: (query: string) => void;
    onStatusChange: (status: string) => void;
    onDateRangeChange: (range: string) => void;
    onSortChange: (sort: SortBy) => void;
    sortBy: SortBy;
}

export default function OrderFilters({
    onSearchChange,
    onStatusChange,
    onDateRangeChange,
    onSortChange,
    sortBy,
}: OrderFiltersProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        onSearchChange(value);
    };

    const dateRangeOptions = getDateRangeOptions();

    return (
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Mã đơn hàng hoặc tên sản phẩm..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-tet-secondary outline-none transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-tet-primary hover:bg-tet-bg/10 transition-all"
                >
                    <SlidersHorizontal size={16} />
                    Bộ lọc
                </button>

                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value as SortBy)}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-tet-primary outline-none focus:ring-2 focus:ring-tet-secondary cursor-pointer"
                >
                    <option value="date-desc">Mới nhất</option>
                    <option value="date-asc">Cũ nhất</option>
                    <option value="price-desc">Giá cao nhất</option>
                    <option value="price-asc">Giá thấp nhất</option>
                </select>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            Trạng thái đơn hàng
                        </label>
                        <select
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-tet-primary outline-none focus:ring-2 focus:ring-tet-secondary cursor-pointer"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value={ORDER_STATUS.PENDING}>Chờ xác nhận</option>
                            <option value={ORDER_STATUS.CONFIRMED}>Đã xác nhận</option>
                            <option value={ORDER_STATUS.PROCESSING}>Đang xử lý</option>
                            <option value={ORDER_STATUS.SHIPPED}>Đã gửi</option>
                            <option value={ORDER_STATUS.DELIVERED}>Đã giao</option>
                            <option value={ORDER_STATUS.COMPLETED}>Hoàn thành</option>
                            <option value={ORDER_STATUS.CANCELLED}>Đã hủy</option>
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            Khoảng thời gian
                        </label>
                        <select
                            onChange={(e) => onDateRangeChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-tet-primary outline-none focus:ring-2 focus:ring-tet-secondary cursor-pointer"
                        >
                            {dateRangeOptions.map((option) => (
                                <option key={option.label} value={option.label}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </section>
    );
}
