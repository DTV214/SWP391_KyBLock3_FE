// src/feature/homepage/components/ProductGridHome.tsx
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../../components/common/ProductCard";
import { productService, type Product } from "@/api/productService";
import { useCart } from "@/feature/cart/context/CartContext";

const DEFAULT_IMAGE =
  "https://res.cloudinary.com/dratbz8bh/image/upload/v1769521638/HOP-BANH-TRUNG-THU-VEN-TRON-3_get5up.jpg";

const MAX_DISPLAY = 9;

// Hiệu ứng cho Container (Stagger)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Hiệu ứng cho từng sản phẩm
const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

export default function ProductGridHome() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBaskets = async () => {
      try {
        const response = await productService.templates.getAll();
        const all: Product[] = (response as any)?.data ?? [];
        const active = all.filter(
          (p) =>
            p.status?.toUpperCase() === "ACTIVE" ||
            p.status?.toUpperCase() === "TEMPLATE"
        );
        setProducts(active.slice(0, MAX_DISPLAY));
      } catch (err) {
        console.error("Không thể tải giỏ quà:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBaskets();
  }, []);

  return (
    <section className="py-16 md:py-24 px-6 md:px-10 bg-white relative overflow-hidden">
      {/* Container căn giữa nội dung */}
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Tiêu đề Banner 5 */}
        <div className="text-center mb-12 md:mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-tet-accent font-serif italic text-base md:text-lg mb-2"
          >
            Món quà từ tâm
          </motion.p>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif text-tet-primary mb-6 tracking-tight"
          >
            Hộp Quà Tết 2026
          </motion.h2>
          <div className="w-20 md:w-24 h-1 bg-tet-secondary mx-auto rounded-full mb-6"></div>
          <p className="max-w-xl mx-auto text-gray-500 font-medium italic text-sm md:text-base leading-relaxed">
            Gói trọn tinh hoa quà Việt, gửi gắm lời chúc an khang cho những
            người thân yêu nhất.
          </p>
        </div>

        {/* Lưới sản phẩm Responsive: 1 cột (Mobile), 2 cột (Tablet), 3 cột (Desktop) */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {loading
            ? Array(3)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-gray-100 animate-pulse aspect-[3/4]"
                  />
                ))
            : products.map((p) => (
                <motion.div key={p.productid} variants={itemVariants}>
                  <ProductCard
                    title={p.productname ?? "Giỏ quà Tết"}
                    price={(p.price ?? 0).toLocaleString("vi-VN")}
                    image={p.imageUrl?.trim() ? p.imageUrl : DEFAULT_IMAGE}
                    onAddToCart={(qty) => addToCart(p, qty)}
                  />
                </motion.div>
              ))}
        </motion.div>

        {/* Nút Xem thêm phong cách Tết */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 md:mt-20 text-center"
        >
          <button
            onClick={() => { navigate("/all-products"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="bg-tet-primary text-white px-10 md:px-12 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:bg-[#4a0d06] hover:scale-105 transition-all shadow-[0_10px_30px_rgba(90,17,7,0.2)]"
          >
            Xem thêm sản phẩm
          </button>
        </motion.div>
      </div>

      {/* Họa tiết lượn sóng trang trí ở dưới banner */}
      <div className="absolute bottom-0 left-0 w-full opacity-5 pointer-events-none">
        <svg
          viewBox="0 0 1440 320"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            fill="#5A1107"
            d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,122.7C672,128,768,192,864,213.3C960,235,1056,213,1152,181.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </section>
  );
}
