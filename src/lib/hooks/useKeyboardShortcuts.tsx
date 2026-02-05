import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Custom hook để thêm keyboard shortcuts cho navigation
 * 
 * Shortcuts:
 * - Alt + H: Về trang Home
 * - Alt + A: Vào Admin Panel (chỉ cho Admin/Staff)
 * - Ctrl + K: Focus vào search bar
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const isAdmin = role === "ADMIN" || role === "STAFF";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + H: Về trang Home
      if (event.altKey && event.key === "h") {
        event.preventDefault();
        navigate("/home");
      }

      // Alt + A: Vào Admin Panel (chỉ cho Admin)
      if (event.altKey && event.key === "a" && isAdmin) {
        event.preventDefault();
        navigate("/admin");
      }

      // Ctrl + K: Focus vào search bar
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Esc: Clear search hoặc đóng modal
      if (event.key === "Escape") {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]') as HTMLInputElement;
        if (searchInput && document.activeElement === searchInput) {
          searchInput.value = "";
          searchInput.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, isAdmin]);

  return { isAdmin };
}

/**
 * Component hiển thị shortcuts hint
 */
export function KeyboardShortcutsHint() {
  const role = localStorage.getItem("role");
  const isAdmin = role === "ADMIN" || role === "STAFF";

  return (
    <div className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-3 text-xs z-50 hidden lg:block max-w-xs">
      <p className="font-bold text-tet-primary mb-2 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Phím tắt
      </p>
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between items-center">
          <span>Về trang chủ</span>
          <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono text-[10px]">
            Alt + H
          </kbd>
        </div>
        {isAdmin && (
          <div className="flex justify-between items-center">
            <span>Admin Panel</span>
            <kbd className="px-2 py-0.5 bg-purple-100 rounded border border-purple-300 font-mono text-[10px]">
              Alt + A
            </kbd>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span>Tìm kiếm</span>
          <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono text-[10px]">
            Ctrl + K
          </kbd>
        </div>
      </div>
    </div>
  );
}
