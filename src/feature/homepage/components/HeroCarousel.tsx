// src/feature/homepage/components/HeroCarousel.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"; // Đảm bảo đường dẫn này đúng với project của bạn

const banners = [
  {
    url: "https://res.cloudinary.com/dratbz8bh/image/upload/v1769521637/IN-VO-HOP-QUA-TET_z1cmai.jpg",
    title: "Tinh Hoa Quà Tết 2026",
    desc: "Gửi trọn chân tình trong từng hộp quà, mang tết ấm áp đến mọi nhà.",
  },
  {
    url: "https://res.cloudinary.com/dratbz8bh/image/upload/v1769521638/in-vo-hop-qua-tet-1_hrmnlv.jpg",
    title: "Vạn Sự Như Ý",
    desc: "Bộ sưu tập quà tặng sang trọng, đẳng cấp dành cho doanh nghiệp.",
  },
  {
    url: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2000",
    title: "Gắn Kết Tình Thân",
    desc: "Món quà ý nghĩa thay lời tri ân gửi đến người thân và bạn bè.",
  },
];

export default function HeroCarousel() {
  return (
    <section className="relative w-full overflow-hidden">
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={index}>
              <div className="relative h-[450px] md:h-[650px] w-full">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] hover:scale-105"
                  style={{ backgroundImage: `url(${banner.url})` }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Content */}
                <div className="relative h-full container mx-auto flex flex-col items-center justify-center text-center text-white px-4">
                  <motion.h1
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    className="text-4xl md:text-7xl font-serif font-bold mb-4 drop-shadow-2xl"
                  >
                    {banner.title}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-2xl max-w-2xl font-light italic opacity-90 drop-shadow-lg"
                  >
                    {banner.desc}
                  </motion.p>
                  <Link to="/products">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-8 bg-tet-secondary text-tet-primary px-10 py-4 rounded-full font-bold text-lg hover:bg-white transition-all shadow-xl"
                    >
                      Khám Phá Ngay
                    </motion.button>
                  </Link>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Chỉ hiện nút điều hướng trên máy tính */}
        <div className="hidden md:block">
          <CarouselPrevious className="left-8 bg-white/20 text-white border-none hover:bg-tet-primary" />
          <CarouselNext className="right-8 bg-white/20 text-white border-none hover:bg-tet-primary" />
        </div>
      </Carousel>
    </section>
  );
}
