import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  // Thuật toán hiển thị số trang có kèm dấu "..."
  const getVisiblePages = () => {
    const delta = 1; // Số trang hiển thị bên trái và phải của trang hiện tại
    const range: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {/* Nút Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-tet-secondary hover:text-tet-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Danh sách các trang */}
      {getVisiblePages().map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-gray-400 font-bold"
            >
              ...
            </span>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page as number)}
            className={`w-10 h-10 rounded-full font-bold transition-all ${
              isCurrent
                ? "bg-tet-primary text-white shadow-md"
                : "text-gray-500 hover:bg-gray-100 hover:text-tet-primary"
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Nút Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-tet-secondary hover:text-tet-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
