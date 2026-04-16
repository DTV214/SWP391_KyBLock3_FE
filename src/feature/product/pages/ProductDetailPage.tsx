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
  Info,
  Layers,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { productService, type Product } from "@/api/productService";
import { useCart } from "@/feature/cart/context/CartContext";
import {
  feedbackService,
  type FeedbackResponse,
} from "@/feature/account/services/feedbackService";
import type { ProductDetailResponseDto } from "@/api/dtos/product.dto";

// Sử dụng Shadcn UI (Giả định bạn đã cài đặt các component này)
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// IMPORT COMPONENT CAROUSEL TỪ SHADCN UI
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart, isLoading: cartLoading } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, behavior: "smooth" });

    Promise.all([
      productService.getById(Number(id)),
      productService.getAll(), // Gợi ý
      feedbackService.getProductFeedbacks(Number(id)),
    ])
      .then(([res, recRes, fbRes]) => {
        setProduct(res.data);
        setRecommended(
          recRes.data.data.filter((p: Product) => p.productid !== Number(id)),
        );
        setFeedbacks(fbRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading detail:", err);
        setLoading(false);
      });
  }, [id]);

  // Tính toán rating trung bình
  const averageRating = feedbacks.length
    ? (
        feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      ).toFixed(1)
    : "5.0";

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF5E8]/30">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-tet-primary"></div>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 font-serif text-xl">
          Không tìm thấy sản phẩm này.
        </p>
        <Link
          to="/products"
          className="text-tet-primary font-bold hover:underline"
        >
          Quay lại cửa hàng
        </Link>
      </div>
    );

  return (
    <main className="bg-[#FBF5E8]/30 min-h-screen pb-20 pt-10">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* Breadcrumb & Nút quay lại */}
        <div className="mb-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-tet-primary transition-colors font-medium"
          >
            <ChevronLeft size={20} /> Quay lại danh sách sản phẩm
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* 1. HÌNH ẢNH (Bỏ hoàn toàn ảnh nhỏ bên dưới theo Jira) */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-square rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl bg-white group"
            >
              <img
                src={
                  product.imageUrl ||
                  "https://via.placeholder.com/800?text=Happybox+Tet+Gift"
                }
                alt={product.productname}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>

            {/* Badge Cam kết */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, text: "Chính hãng 100%" },
                { icon: Truck, text: "Giao hỏa tốc" },
                { icon: RefreshCcw, text: "Đổi trả 7 ngày" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-2xl border border-white"
                >
                  <item.icon size={20} className="text-tet-primary" />
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider text-center">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. THÔNG TIN SẢN PHẨM */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-tet-primary text-tet-primary bg-white px-3 py-1 uppercase tracking-widest text-[10px]"
                >
                  {product.sku || "HAPPYBOX-EXCLUSIVE"}
                </Badge>
                {product.isCustom && (
                  <Badge className="bg-amber-500 text-white border-none">
                    Tùy chỉnh
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-tet-primary leading-tight">
                {product.productname}
              </h1>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1 text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={
                        i < Math.round(Number(averageRating))
                          ? "currentColor"
                          : "none"
                      }
                    />
                  ))}
                  <span className="ml-2 text-gray-800 font-bold text-lg">
                    {averageRating}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <span className="text-gray-500 font-medium">
                  {feedbacks.length} Đánh giá
                </span>
              </div>
              <p className="text-4xl font-black text-tet-accent tracking-tight">
                {(product.price ?? 0).toLocaleString("vi-VN")}đ
              </p>
            </div>

            {/* PHẦN BỔ SUNG: THÀNH PHẦN GIỎ QUÀ (Hiển thị productDetails) */}
            {product.productDetails && product.productDetails.length > 0 && (
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-tet-primary">
                  <Layers size={20} /> Thành phần trong giỏ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
                  {product.productDetails.map(
                    (item: ProductDetailResponseDto) => (
                      <div
                        key={item.productdetailid}
                        className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm transition-hover hover:border-tet-primary/30"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-50">
                          <img
                            src={item.imageurl}
                            alt={item.productname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {item.productname}
                          </p>
                          <p className="text-[10px] text-gray-500 font-medium">
                            Số lượng: x{item.quantity}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Nút Hành động */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200/50">
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className="flex-1 bg-[#4a0d06] text-white py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:brightness-125 transition-all shadow-xl hover:shadow-tet-primary/20"
              >
                {cartLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <ShoppingCart size={24} />
                    {addSuccess ? "Đã thêm vào giỏ!" : "Thêm vào giỏ hàng"}
                  </>
                )}
              </button>
              <button className="p-5 border-2 border-gray-200 rounded-3xl text-gray-400 hover:text-rose-500 hover:border-rose-500 transition-all bg-white">
                <Heart size={24} />
              </button>
              <button className="p-5 border-2 border-gray-200 rounded-3xl text-gray-400 hover:text-tet-primary hover:border-tet-primary transition-all bg-white">
                <Share2 size={24} />
              </button>
            </div>

            {/* PHẦN BỔ SUNG: ACCORDION CHI TIẾT (Xử lý Description bị null) */}
            <Accordion
              type="single"
              collapsible
              className="w-full bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm"
            >
              <AccordionItem value="item-1" className="border-b-0 px-6">
                <AccordionTrigger className="hover:no-underline py-5 text-tet-primary font-bold">
                  Mô tả sản phẩm
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                  {product.description ||
                    "Hộp quà Tết Happybox mang đậm nét truyền thống với thiết kế sang trọng, hội tụ những tinh hoa ẩm thực chọn lọc. Đây là món quà thay lời chúc bình an và thịnh vượng gửi đến người thân, bạn bè và đối tác trong dịp xuân về."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-2"
                className="border-b-0 px-6 border-t border-gray-50"
              >
                <AccordionTrigger className="hover:no-underline py-5 text-tet-primary font-bold">
                  Thông tin khối lượng & Đóng gói
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-6">
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Khối lượng tịnh:</span>{" "}
                      <span className="font-bold">
                        {product.unit || "N/A"}g
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Kích thước (D x R x C):</span>{" "}
                      <span className="font-bold">
                        {product.length || 0}cm x {product.width || 0}cm x {product.height || 0}cm
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Hạn sử dụng:</span>{" "}
                      <span className="font-bold text-rose-600">
                        Ghi trên bao bì
                      </span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* 3. PHẦN RATING NÂNG CẤP */}
        <section className="mt-24 space-y-12">
          <div className="flex flex-col lg:flex-row gap-16 bg-white p-10 md:p-16 rounded-[4rem] border border-gray-100 shadow-sm">
            {/* Điểm số trung bình */}
            <div className="w-full lg:w-1/3 space-y-8">
              <h3 className="text-3xl font-serif font-bold text-tet-primary flex items-center gap-3">
                Đánh giá khách hàng
              </h3>
              <div className="bg-[#FBF5E8] p-10 rounded-[3rem] text-center space-y-4">
                <p className="text-7xl font-black text-tet-primary">
                  {averageRating}
                </p>
                <div className="flex justify-center gap-1 text-yellow-500">
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  Dựa trên {feedbacks.length} lượt mua thực tế
                </p>
              </div>

              {/* Progress Bar Ratings (Shadcn nâng cấp) */}
              <div className="space-y-4 px-4">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = feedbacks.filter(
                    (f) => f.rating === star,
                  ).length;
                  const percentage = feedbacks.length
                    ? (count / feedbacks.length) * 100
                    : 0;
                  return (
                    <div key={star} className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-600 w-4">
                        {star}
                      </span>
                      <Star
                        size={14}
                        className="text-yellow-500"
                        fill="currentColor"
                      />
                      <Progress
                        value={percentage}
                        className="h-2 flex-1 bg-gray-100"
                      />
                      <span className="text-xs font-bold text-gray-400 w-10 text-right">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danh sách bình luận */}
            <div className="flex-1 space-y-8 max-h-175 overflow-y-auto pr-4 custom-scrollbar">
              {feedbacks.length > 0 ? (
                feedbacks.map((fb, idx) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    key={idx}
                    className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-tet-primary font-bold text-xl border border-gray-100">
                          {fb.customerName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-tet-primary">
                            {fb.customerName || "Khách hàng ẩn danh"}
                          </p>
                          <div className="flex gap-0.5 text-yellow-500 mt-1">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star
                                key={s}
                                size={12}
                                fill={s < fb.rating ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed italic">
                      "{fb.comment}"
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-20 border-4 border-dashed border-gray-100 rounded-[3rem]">
                  <Info size={48} className="text-gray-200 mb-4" />
                  <p className="text-gray-400 font-serif text-lg italic">
                    Chưa có đánh giá nào cho sản phẩm này.
                    <br />
                    Hãy là người đầu tiên trải nghiệm!
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. SẢN PHẨM KHÁC (CẬP NHẬT CAROUSEL) */}
        <section className="mt-32 space-y-12">
          <h3 className="text-4xl font-serif font-bold text-tet-primary text-center">
            Có thể bạn sẽ thích
          </h3>

          <div className="relative px-4 md:px-12">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {recommended.map((prod) => (
                  <CarouselItem
                    key={prod.productid}
                    className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                  >
                    <ProductCard
                      id={prod.productid}
                      title={prod.productname || "Sản phẩm"}
                      price={(prod.price ?? 0).toLocaleString("vi-VN") + "đ"}
                      img={
                        prod.imageUrl ||
                        "https://via.placeholder.com/400?text=Happybox"
                      }
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* Nút Previous / Next của Carousel được style lại cho hợp với theme */}
              <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 h-12 w-12 bg-white text-tet-primary hover:bg-tet-primary hover:text-white border-gray-200 shadow-md transition-all" />
              <CarouselNext className="hidden md:flex -right-4 lg:-right-12 h-12 w-12 bg-white text-tet-primary hover:bg-tet-primary hover:text-white border-gray-200 shadow-md transition-all" />
            </Carousel>
          </div>
        </section>
      </div>
    </main>
  );
}
