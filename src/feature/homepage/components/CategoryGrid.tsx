import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoryService, type Category } from "@/api/categoryService";

const CARD_GRADIENTS = [
  "from-tet-primary to-tet-primary/70",
  "from-tet-accent/80 to-tet-primary/90",
  "from-tet-secondary/70 to-tet-primary/80",
  "from-tet-primary/80 to-tet-accent/60",
];

export default function CategoryGrid() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAll();
        const data: Category[] = (response as any)?.data ?? [];
        setCategories(data);
      } catch (err) {
        console.error("Không thể tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="relative py-10 md:py-16 bg-tet-bg/50 overflow-hidden border-t border-tet-secondary/20">
      

      <div className="container mx-auto max-w-7xl px-6 relative z-10">
        <div className="text-center mb-8 md:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <p className="text-tet-accent font-serif italic text-base md:text-lg">
              Bộ Sưu Tập Đặc Biệt
            </p>
            <h2 className="text-3xl md:text-5xl font-serif text-tet-primary tracking-tight">
              Khám Phá Danh Mục Quà Tết
            </h2>
            <div className="w-20 md:w-24 h-1 bg-tet-accent mx-auto rounded-full"></div>
            <p className="text-gray-500 italic text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
              Những món quà sang trọng được chọn lọc kỹ lưỡng, mang đậm nét tinh
              hoa văn hóa Việt cho mọi dịp lễ.
            </p>
          </motion.div>
        </div>

        {/* Lưới danh mục: 1 cột mobile, 2 cột tablet, 4 cột desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.categoryid ?? index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
              onClick={() => navigate(`/products?category=${cat.categoryid}`)}
            >
              <div className={`relative h-[140px] md:h-[160px] rounded-2xl overflow-hidden shadow-md border-2 border-white/20 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_12px_32px_rgba(90,17,7,0.3)] bg-gradient-to-br ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]}`}>
                {/* Họa tiết nền trang trí */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,_white_1px,_transparent_1px)] bg-[length:18px_18px]" />

                {/* Nội dung chữ trên Card */}
                <div className="absolute inset-0 flex flex-col justify-center px-6">
                  <h3 className="text-white text-lg md:text-xl font-serif mb-2 transform group-hover:translate-x-1 transition-transform duration-300">
                    {cat.categoryname}
                  </h3>
                  <div className="w-8 h-0.5 bg-tet-secondary group-hover:w-16 transition-all duration-500 rounded-full"></div>
                </div>

                {/* Số thứ tự trang trí */}
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 text-7xl font-serif font-bold select-none">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
