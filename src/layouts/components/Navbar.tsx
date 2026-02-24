import { useState } from "react";
import {
  Search,
  User,
  Heart,
  ShoppingCart,
  Phone,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/feature/cart/context/CartContext";

const LOGO_URL =
  "https://res.cloudinary.com/dratbz8bh/image/upload/v1769523263/Gemini_Generated_Image_h7qrtzh7qrtzh7qr_uszekn.png";

const navItems = [
  { name: "Trang chủ", path: "/home" },
  { name: "Quà tặng", path: "/products" },
  { name: "Hộp quà Tết", path: "/products" },
  { name: "Giới thiệu", path: "/introduce" },
  { name: "Tin tức", path: "/blogs" },
  { name: "Liên hệ", path: "/contact" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { openCart, getTotalItems } = useCart();
  const navigate = useNavigate();

  // Kiểm tra token để xác định trạng thái đăng nhập
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = localStorage.getItem("role");
  const isAdmin = role === "ADMIN" || role === "STAFF";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setIsUserMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="w-full flex flex-col shadow-md sticky top-0 z-[100]">
      {/* 1. THANH CÔNG CỤ TRÊN (TOP BAR) */}
      <div className="bg-tet-primary py-2 md:py-3 px-4 md:px-8 flex items-center justify-between gap-4">
        <button
          className="text-white md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={28} />
        </button>

        <Link to="/home" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-12 h-12 md:w-14 md:h-14 overflow-hidden rounded-full border-2 border-tet-secondary shadow-[0_0_15px_rgba(237,229,181,0.3)] transition-transform group-hover:scale-105">
            <img
              src={LOGO_URL}
              alt="Happybox Logo"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <span className="hidden lg:block text-white font-serif font-bold text-2xl italic tracking-tighter">
            Quà Tết Yêu Thương
          </span>
        </Link>

        <div className="hidden sm:flex flex-1 max-w-xl mx-4 relative">
          <input
            type="text"
            placeholder="Tìm kiếm hộp quà cao cấp..."
            className="w-full py-2 px-5 pr-12 rounded-full bg-[#fdfaf3] text-sm focus:outline-none focus:ring-2 focus:ring-tet-secondary text-tet-primary placeholder:text-gray-400 shadow-inner"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-tet-primary p-1.5 rounded-full text-white cursor-pointer hover:bg-tet-accent transition-colors">
            <Search size={16} />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-5 text-white text-sm font-medium">
          {/* LOGIC HIỂN THỊ TÀI KHOẢN */}
          {!token ? (
            <Link
              to="/login"
              className="hidden lg:flex items-center gap-1.5 hover:text-tet-secondary transition-colors"
            >
              <User size={20} />
              <span>Đăng nhập</span>
            </Link>
          ) : (
            <div className="relative hidden lg:block">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 hover:text-tet-secondary transition-colors outline-none"
              >
                <div className="w-8 h-8 rounded-full border border-tet-secondary overflow-hidden bg-white/20">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.username || "User"}&background=random`}
                    alt="avatar"
                  />
                </div>
                <span className="max-w-[100px] truncate">
                  {user.username || "Tài khoản"}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* DROPDOWN MENU */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsUserMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 text-tet-primary overflow-hidden animate-in fade-in zoom-in duration-200">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-purple-50 transition-colors font-bold text-xs uppercase text-purple-600 border-b border-gray-50"
                      >
                        <Settings size={16} /> Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/account/overview"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#FBF5E8] transition-colors font-bold text-xs uppercase"
                    >
                      <User size={16} /> Trang cá nhân
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors font-bold text-xs uppercase border-t border-gray-50"
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 cursor-pointer hover:text-tet-secondary transition-colors">
            <Heart size={20} />
          </div>

          <div className="flex items-center gap-1.5 cursor-pointer relative hover:text-tet-secondary transition-colors group">

            <button
              onClick={openCart}
              className="p-2 group-hover:bg-white/10 rounded-full transition-colors"
            >
              <ShoppingCart size={22} />
              <span className="absolute top-0 right-0 bg-tet-accent text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-tet-primary shadow-lg">
                {getTotalItems()}
              </span>
            </button>

          </div>

          <button className="hidden md:flex bg-tet-secondary text-tet-primary px-5 py-2 rounded-full items-center gap-2 font-bold text-sm shadow-lg hover:bg-white hover:scale-105 transition-all">
            <Phone size={16} fill="currentColor" />
            <span>1900 1234</span>
          </button>
        </div>
      </div>

      {/* 2. THANH MENU CHÍNH (DESKTOP) */}
      <div className="hidden md:flex bg-[#4a0d06] text-white py-3 justify-center gap-10 lg:gap-14 text-xs lg:text-sm font-medium border-t border-white/5 uppercase tracking-widest">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="relative hover:text-tet-secondary transition-colors after:content-[''] after:absolute after:w-0 after:h-[1px] after:bg-tet-secondary after:bottom-[-4px] after:left-0 hover:after:w-full after:transition-all"
          >
            {item.name}
          </Link>
        ))}

        <div className="relative group">
          <button className="relative hover:text-tet-secondary transition-colors after:content-[''] after:absolute after:w-0 after:h-[1px] after:bg-tet-secondary after:bottom-[-4px] after:left-0 group-hover:after:w-full after:transition-all">
            BÁO GIÁ
          </button>
          <div className="invisible absolute left-1/2 top-full z-50 mt-3 w-52 -translate-x-1/2 rounded-xl bg-white py-2 text-xs font-semibold text-tet-primary shadow-xl opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
            <Link
              to="/quotation"
              className="block px-4 py-2 hover:bg-[#FBF5E8] transition-colors"
            >
              Trang giới thiệu
            </Link>
            <Link
              to="/quotation/create"
              className="block px-4 py-2 hover:bg-[#FBF5E8] transition-colors"
            >
              Tạo báo giá
            </Link>
            <Link
              to="/quotation/history"
              className="block px-4 py-2 hover:bg-[#FBF5E8] transition-colors"
            >
              Lịch sử báo giá
            </Link>
          </div>
        </div>
      </div>

      {/* 3. MENU DI ĐỘNG (MOBILE DRAWER) */}
      <div
        className={`fixed inset-0 bg-black/60 z-[110] transition-opacity duration-300 md:hidden ${isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <div
        className={`fixed top-0 left-0 h-full w-[300px] bg-tet-bg z-[120] shadow-2xl transform transition-transform duration-300 ease-out md:hidden ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="bg-tet-primary p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-tet-secondary overflow-hidden">
              <img
                src={LOGO_URL}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-serif font-bold text-xl italic">
              Happybox
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 text-tet-primary font-bold uppercase tracking-widest text-sm">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              className="py-2 border-b border-tet-secondary/20 hover:text-tet-accent transition-colors"
            >
              {item.name}
            </Link>
          ))}

          <div className="mt-8 pt-8 border-t border-tet-primary/10 flex flex-col gap-4 italic lowercase">
            {!token ? (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 text-tet-primary"
              >
                <User size={20} /> Đăng nhập / Đăng ký
              </Link>
            ) : (
              <>
                <Link
                  to="/account/overview"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 text-tet-primary font-bold"
                >
                  <User size={20} /> Chào, {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 text-red-600 font-bold text-left"
                >
                  <LogOut size={20} /> Đăng xuất
                </button>
              </>
            )}
            <div className="flex items-center gap-3 text-tet-accent">
              <Phone size={20} fill="currentColor" /> Hotline: 1900 1234
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
