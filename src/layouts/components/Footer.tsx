import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";

const LOGO_URL =
  "https://res.cloudinary.com/dratbz8bh/image/upload/v1769523263/Gemini_Generated_Image_h7qrtzh7qrtzh7qr_uszekn.png";

export default function Footer() {
  return (
    <footer className="relative bg-tet-primary text-[#FBF5E8] pt-16 md:pt-24 pb-10 px-6 md:px-10 overflow-hidden">
      {/* Họa tiết mây chìm trang trí */}
      <div className="absolute inset-0 bg-cloud-pattern opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
          {/* CỘT 1: GIỚI THIỆU & LOGO */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded-full border-2 border-tet-secondary shadow-2xl transition-transform group-hover:rotate-[360deg] duration-1000">
                <img
                  src={LOGO_URL}
                  alt="Happybox Logo"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <span className="text-3xl font-serif font-bold italic tracking-tighter text-white">
                Happybox
              </span>
            </div>
            <p className="text-sm leading-relaxed opacity-80 italic max-w-xs">
              Nhà cung cấp quà tặng cao cấp hàng đầu Việt Nam. Chúng tôi mang
              tinh hoa Tết truyền thống gói trọn trong từng món quà gửi trao.
            </p>
            {/* Mạng xã hội */}
            <div className="flex gap-4 pt-2">
              <Facebook
                size={20}
                className="cursor-pointer hover:text-tet-secondary transition-colors"
              />
              <Instagram
                size={20}
                className="cursor-pointer hover:text-tet-secondary transition-colors"
              />
              <Youtube
                size={20}
                className="cursor-pointer hover:text-tet-secondary transition-colors"
              />
            </div>
          </div>

          {/* CỘT 2: HỖ TRỢ KHÁCH HÀNG */}
          <div className="text-center sm:text-left">
            <h3 className="text-xl md:text-2xl font-bold mb-8 font-serif text-tet-secondary uppercase tracking-widest">
              Hỗ Trợ
            </h3>
            <ul className="space-y-4 text-sm opacity-80">
              {[
                "Chính Sách Vận Chuyển",
                "Đổi Trả & Hoàn Tiền",
                "Điều Khoản Dịch Vụ",
                "Bảo Mật Thông Tin",
                "Câu Hỏi Thường Gặp",
              ].map((item) => (
                <li
                  key={item}
                  className="hover:text-tet-secondary cursor-pointer transition-all hover:translate-x-2 flex items-center justify-center sm:justify-start gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-tet-secondary rounded-full opacity-50"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: ĐỊA CHỈ & LIÊN HỆ */}
          <div className="text-center sm:text-left">
            <h3 className="text-xl md:text-2xl font-bold mb-8 font-serif text-tet-secondary uppercase tracking-widest">
              Liên Hệ
            </h3>
            <div className="space-y-6 text-sm opacity-90">
              <div className="flex items-start justify-center sm:justify-start gap-3">
                <MapPin
                  size={18}
                  className="text-tet-secondary shrink-0 mt-1"
                />
                <p>123 Trần Hưng Đạo, Quận Hoàn Kiếm, TP. Hà Nội</p>
              </div>
              <div className="flex items-start justify-center sm:justify-start gap-3">
                <MapPin
                  size={18}
                  className="text-tet-secondary shrink-0 mt-1"
                />
                <p>456 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 border-t border-white/10 pt-4 group">
                <Phone
                  size={18}
                  className="text-tet-secondary group-hover:animate-bounce"
                />
                <p className="text-xl font-bold text-white tracking-wider">
                  1900 1234
                </p>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <Mail size={18} className="text-tet-secondary" />
                <p className="hover:underline cursor-pointer">
                  contact@happybox.vn
                </p>
              </div>
            </div>
          </div>

          {/* CỘT 4: THANH TOÁN & TIN TỨC */}
          <div className="text-center sm:text-left space-y-8">
            
            {/* Đăng ký nhận tin */}
            <div className="pt-2">
              <p className="text-xs italic opacity-70 mb-3 text-center sm:text-left">
                Đăng ký nhận ưu đãi Tết sớm nhất:
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="bg-white/10 border border-white/20 px-3 py-2 text-xs rounded-l-lg focus:outline-none w-full"
                />
                <button className="bg-tet-secondary text-tet-primary px-3 py-2 text-xs font-bold rounded-r-lg hover:bg-white transition-colors">
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BẢN QUYỀN */}
        <div className="border-t border-white/10 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs opacity-50 uppercase tracking-[0.2em]">
          <p>© 2026 Happybox - Tinh Hoa Quà Tết Việt. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-white cursor-pointer">
              Terms of Use
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
