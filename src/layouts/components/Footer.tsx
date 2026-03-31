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
    <footer className="relative overflow-hidden bg-tet-primary px-6 pb-10 pt-16 text-[#FBF5E8] md:px-10 md:pt-24">
      <div className="absolute inset-0 bg-cloud-pattern opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 md:gap-16">
          <div className="flex flex-col items-center space-y-6 text-center sm:items-start sm:text-left">
            <div className="group flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-tet-secondary shadow-2xl transition-transform duration-1000 group-hover:rotate-[360deg] md:h-20 md:w-20">
                <img
                  src={LOGO_URL}
                  alt="Happybox Logo"
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <span className="font-serif text-3xl font-bold italic tracking-tighter text-white">
                Happybox
              </span>
            </div>
            <p className="max-w-xs text-sm italic leading-relaxed opacity-80">
              Nhà cung cấp quà tặng cao cấp hàng đầu Việt Nam. Chúng tôi mang
              tinh hoa Tết truyền thống gói trọn trong từng món quà gửi trao.
            </p>
            <div className="flex gap-4 pt-2">
              <Facebook
                size={20}
                className="cursor-pointer transition-colors hover:text-tet-secondary"
              />
              <Instagram
                size={20}
                className="cursor-pointer transition-colors hover:text-tet-secondary"
              />
              <Youtube
                size={20}
                className="cursor-pointer transition-colors hover:text-tet-secondary"
              />
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="mb-8 font-serif text-xl font-bold uppercase tracking-widest text-tet-secondary md:text-2xl">
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
                  className="flex cursor-pointer items-center justify-center gap-2 transition-all hover:translate-x-2 hover:text-tet-secondary sm:justify-start"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-tet-secondary opacity-50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="mb-8 font-serif text-xl font-bold uppercase tracking-widest text-tet-secondary md:text-2xl">
              Liên Hệ
            </h3>
            <div className="space-y-6 text-sm opacity-90">
              <div className="flex items-start justify-center gap-3 sm:justify-start">
                <MapPin size={18} className="mt-1 shrink-0 text-tet-secondary" />
                <p>123 Trần Hưng Đạo, Quận Hoàn Kiếm, TP. Hà Nội</p>
              </div>
              <div className="flex items-start justify-center gap-3 sm:justify-start">
                <MapPin size={18} className="mt-1 shrink-0 text-tet-secondary" />
                <p>456 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className="group flex items-center justify-center gap-3 border-t border-white/10 pt-4 sm:justify-start">
                <Phone
                  size={18}
                  className="text-tet-secondary group-hover:animate-bounce"
                />
                <p className="text-xl font-bold tracking-wider text-white">1900 1234</p>
              </div>
              <div className="flex items-center justify-center gap-3 sm:justify-start">
                <Mail size={18} className="text-tet-secondary" />
                <p className="cursor-pointer hover:underline">contact@happybox.vn</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[10px] uppercase tracking-[0.2em] opacity-50 md:flex-row md:text-xs">
          <p>© 2026 Happybox - Tinh Hoa Quà Tết Việt. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-white">Privacy Policy</span>
            <span className="cursor-pointer hover:text-white">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
