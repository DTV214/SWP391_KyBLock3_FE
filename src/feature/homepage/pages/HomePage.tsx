// src/feature/homepage/pages/HomePage.tsx
import HeroCarousel from "../components/HeroCarousel";
import TetStorySection from "../components/TetStorySection";
import CategoryGrid from "../components/CategoryGrid";
import FlashSellCarousel from "../components/FlashSellCarousel";
import ProductGridHome from "../components/ProductGridHome";
import CustomGiftBanner from "../components/CustomGiftBanner";


export default function HomePage() {
  return (
    <div className="w-full flex flex-col overflow-x-hidden">
      {/* Banner 1: Hero Carousel */}
      <HeroCarousel />

      {/* Banner 2: Lời chúc & Giới thiệu */}
      <TetStorySection />

      {/* Banner 3: Danh mục Collection */}
      <CategoryGrid />

      {/* Banner 4: Flash Sell */}
      <FlashSellCarousel />

      {/* Banner 5: Lưới sản phẩm 3x3 */}
      <ProductGridHome />

      {/* Banner 6: Giải pháp quà tặng doanh nghiệp & Quy trình */}
      <CustomGiftBanner />
      
    </div>
  );
}
