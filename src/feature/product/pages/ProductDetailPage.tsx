// src/feature/product/pages/ProductDetailPage.tsx
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  RefreshCcw,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { productService, type Product } from "@/api/productService";
import { useCart } from "@/feature/cart/context/CartContext";
import { feedbackService, type FeedbackResponse } from "@/feature/account/services/feedbackService";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart, isLoading: cartLoading, error: cartError } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    window.scrollTo({ top: 0, behavior: "smooth" });

    Promise.all([
      productService.getById(id).then((res) => setProduct(res.data)).catch((err) => console.error("Error fetching product:", err)),
      productService.getAvailableProductsForCustomer().then(res => {
        const products = res || [];
        const filtered = products.filter((p: Product) => p.productid !== Number(id)).slice(0, 4);
        setRecommended(filtered);
      }).catch(err => console.error("Error fetching recommended products:", err)),
      feedbackService.getProductFeedbacks(Number(id)).then(res => setFeedbacks(res)).catch(err => console.error("Error fetching feedbacks:", err))
    ]).finally(() => setLoading(false));
  }, [id]);

  const formattedPrice = product?.price
    ? product.price.toLocaleString("vi-VN") + "đ"
    : "—";

  const safeFeedbacks = feedbacks || [];
  const totalRating = safeFeedbacks.reduce((acc, curr) => acc + (curr.rating || 0), 0);
  const averageRating = safeFeedbacks.length > 0 ? (totalRating / safeFeedbacks.length).toFixed(1) : "0.0";
  
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  safeFeedbacks.forEach(f => {
      if (f.rating >= 1 && f.rating <= 5) {
          ratingCounts[f.rating as keyof typeof ratingCounts]++;
      }
  });

  const handleAddToCart = async () => {
    if (!product) return;
    setAddSuccess(false);
    await addToCart(product, 1);
    // If no error after adding, show success
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-tet-primary font-bold text-xl">
        Đang tải sản phẩm...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-bold text-xl">
        Không tìm thấy sản phẩm.
      </div>
    );
  }

  return (
    <div className="bg-[#FBF5E8]/30 min-h-screen pb-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* 1. BREADCRUMB & QUAY LẠI */}
        <div className="flex items-center justify-between py-8">
          <Link
            to="/products"
            className="flex items-center gap-2 text-tet-primary font-bold hover:text-tet-accent transition-all group"
          >
            <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
              <ChevronLeft size={20} />
            </div>
            <span className="text-sm uppercase tracking-widest">
              Quay lại cửa hàng
            </span>
          </Link>
          <div className="flex gap-4">
            <button className="p-3 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors">
              <Heart size={20} />
            </button>
            <button className="p-3 bg-white rounded-full text-gray-400 hover:text-tet-primary shadow-sm transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* 2. KHU VỰC CHÍNH */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mb-24">
          {/* Gallery Ảnh cao cấp */}
          <div className="w-full lg:w-1/2 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-[3.5rem] overflow-hidden bg-white border-8 border-white shadow-2xl relative group"
            >
              <img
                src={product.imageUrl || "https://res.cloudinary.com/dratbz8bh/image/upload/v1769521637/IN-VO-HOP-QUA-TET_z1cmai.jpg"}
                className="w-full h-full object-cover duration-700 group-hover:scale-105"
                alt={product.productname || "Sản phẩm"}
              />
              <div className="absolute top-8 left-8 bg-tet-accent text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                Bán chạy nhất
              </div>
            </motion.div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-3xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-tet-primary shadow-sm transition-all hover:-translate-y-1"
                >
                  <img
                    src={product.imageUrl || "https://res.cloudinary.com/dratbz8bh/image/upload/v1769313271/1714504461883_xqmhva.png"}
                    className="w-full h-full object-cover"
                    alt="thumb"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Thông tin & Hành động */}
          <div className="w-full lg:w-1/2 space-y-10">
            <div className="space-y-4">
              <p className="text-xs font-black text-tet-accent uppercase tracking-[0.4em]">
                Bộ sưu tập 2026
              </p>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-tet-primary leading-tight">
                {product.productname || "Sản phẩm"}
              </h1>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex text-yellow-500">
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill={Number(averageRating) >= 4.5 ? "currentColor" : "none"} />
                </div>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest border-l pl-4 border-gray-200">
                  {averageRating}/5 ({feedbacks.length} nhận xét)
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <p className="text-5xl font-black text-tet-primary italic tracking-tighter">
                {formattedPrice}
              </p>
            </div>

            <div className="space-y-8 pt-8 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="flex-1 bg-[#4a0d06] hover:bg-tet-accent text-white py-4 rounded-[1.5rem] text-lg font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={24} /> {cartLoading ? "Đang thêm..." : "THÊM VÀO GIỎ HÀNG"}
                </button>
              </div>
              {cartError && (
                <p className="text-sm font-bold text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                  ⚠️ {cartError}
                </p>
              )}
              {addSuccess && !cartError && (
                <p className="text-sm font-bold text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                  ✅ Đã thêm vào giỏ hàng!
                </p>
              )}
            </div>

            {/* Đặc điểm hỗ trợ */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              {[
                {
                  icon: <ShieldCheck className="text-green-600" />,
                  text: "Bảo hành 12 tháng",
                },
                {
                  icon: <Truck className="text-tet-accent" />,
                  text: "Giao nhanh 2h",
                },
                {
                  icon: <RefreshCcw className="text-blue-600" />,
                  text: "Đổi trả 7 ngày",
                },
                {
                  icon: <Star className="text-yellow-600" />,
                  text: "Hàng chính hãng",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-[10px] font-black text-tet-primary uppercase tracking-widest bg-white/50 p-4 rounded-2xl border border-white"
                >
                  {item.icon} {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. PHẦN ĐÁNH GIÁ CHI TIẾT */}
        <section className="bg-white rounded-[4rem] p-10 md:p-20 shadow-sm border border-gray-50 mb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-tet-primary italic font-serif text-9xl">
            Happybox
          </div>
          <div className="flex flex-col lg:flex-row gap-20 relative z-10">
            <div className="w-full lg:w-1/3 space-y-10">
              <h3 className="text-4xl font-serif font-bold text-tet-primary">
                Đánh giá thực tế
              </h3>
              <div className="flex items-baseline gap-4">
                <span className="text-9xl font-black text-tet-primary leading-none tracking-tighter">
                  {averageRating}
                </span>
                <div className="space-y-2">
                  <div className="flex text-yellow-500">
                    <Star fill="currentColor" />
                    <Star fill="currentColor" />
                    <Star fill="currentColor" />
                    <Star fill="currentColor" />
                    <Star fill={Number(averageRating) >= 4.5 ? "currentColor" : "none"} />
                  </div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">
                    {feedbacks.length} Khách hàng
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = ratingCounts[s as keyof typeof ratingCounts];
                  const percentage = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                  return (
                    <div
                      key={s}
                      className="flex items-center gap-4 text-xs font-bold text-gray-400"
                    >
                      <span className="w-4">{s}★</span>
                      <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-tet-primary transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 space-y-12">
              <h3 className="text-3xl font-serif font-bold text-tet-primary">
                Bình luận từ người dùng
              </h3>
              <div className="grid gap-8">
                {feedbacks.length > 0 ? (
                  feedbacks.map((fb) => (
                    <motion.div
                      key={fb.feedbackId}
                      whileHover={{ x: 10 }}
                      className="flex gap-6 p-8 bg-[#FBF5E8]/50 rounded-[2.5rem] transition-all border border-transparent hover:border-tet-secondary"
                    >
                      <div className="w-16 h-16 rounded-full bg-white overflow-hidden shrink-0 shadow-lg border-2 border-white flex items-center justify-center bg-tet-primary text-white font-serif text-2xl">
                        {fb.customerName ? fb.customerName.charAt(0) : "K"}
                      </div>
                      <div className="space-y-3 w-full">
                        <div className="flex items-center justify-between">
                          <p className="font-black text-tet-primary uppercase text-xs tracking-widest">
                            {fb.customerName || "Khách hàng ẩn danh"}
                          </p>
                          <span className="text-[10px] text-gray-400 font-bold italic">
                            Đã mua tết {new Date().getFullYear()}
                          </span>
                        </div>
                        <p className="text-gray-600 italic text-sm leading-relaxed">
                          "{fb.comment || "Không có nhận xét nào"}"
                        </p>
                        <div className="flex text-yellow-500 scale-75 origin-left">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              size={14} 
                              fill={s <= fb.rating ? "currentColor" : "none"} 
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400 italic border border-dashed border-gray-200 rounded-2xl">
                    Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm!
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. SẢN PHẨM KHÁC */}
        <section className="space-y-12">
          <h3 className="text-4xl font-serif font-bold text-tet-primary text-center">
            Gợi ý khác cho bạn
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {recommended.map((prod) => (
              <ProductCard
                key={prod.productid}
                id={prod.productid}
                title={prod.productname || "Sản phẩm"}
                price={(prod.price ?? 0).toLocaleString("vi-VN") + "đ"}
                img={prod.imageUrl || "https://res.cloudinary.com/dratbz8bh/image/upload/v1769313271/1714504461883_xqmhva.png"}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
