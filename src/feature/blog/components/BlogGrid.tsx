// src/features/blog/components/BlogGrid.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import type { BlogDto } from "@/feature/blog/services/blogService";

interface BlogGridProps {
  blogs: BlogDto[];
}

export default function BlogGrid({ blogs }: BlogGridProps) {
  // --- States ---
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Đặt hiển thị 6 bài trên 1 trang lưới

  const categories = [
    "Tất cả",
    "Gift Guides",
    "Truyền thống",
    "Quà tặng doanh nghiệp",
    "Bao bì",
  ];

  // --- Functions ---
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const defaultImage =
    "https://res.cloudinary.com/dratbz8bh/image/upload/v1769521491/Gia-Dinh-Doan-Vien-T_v0n9to.png";

  const getFullMediaUrl = (url: string | null) => {
    return url ? url : defaultImage;
  };

  // Logic Hướng 1: Lọc bài viết "động" dựa theo từ khóa danh mục
  const filteredBlogs = blogs.filter((blog) => {
    if (activeCategory === "Tất cả") return true;

    // Tìm xem từ khóa của Category có xuất hiện trong Title hoặc Content không
    const keyword = activeCategory.toLowerCase();
    const titleMatch = blog.title.toLowerCase().includes(keyword);
    const contentMatch = blog.content.toLowerCase().includes(keyword);

    return titleMatch || contentMatch;
  });

  // Reset về trang 1 mỗi khi click chọn lại danh mục
  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  // Tính toán dữ liệu phân trang
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Thanh lọc Category */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === cat
                ? "bg-tet-primary text-white shadow-lg"
                : "bg-gray-100 text-gray-500 hover:bg-tet-secondary hover:text-tet-primary"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lưới bài viết */}
        {paginatedBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedBlogs.map((blog, index) => {
              const snippet = stripHtml(blog.content).substring(0, 100) + "...";
              const formattedDate = new Date(
                blog.creationDate,
              ).toLocaleDateString("vi-VN");

              return (
                <motion.div
                  key={blog.blogId}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col relative"
                >
                  {/* Icon Video (nếu có) */}
                  {blog.videoUrl && (
                    <div
                      className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full shadow-md"
                      title="Có video"
                    >
                      <Video size={16} />
                    </div>
                  )}

                  <div className="relative h-60 overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={getFullMediaUrl(blog.imageUrl)}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-xl font-serif text-tet-primary font-bold mb-4 line-clamp-2 group-hover:text-tet-accent transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                      {snippet}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-tighter border-t border-gray-50 pt-4">
                      <span>{formattedDate}</span>
                      <span>{blog.authorName || "Ẩn danh"}</span>
                    </div>

                    <Link
                      to={`/blog/${blog.blogId}`}
                      className="block mt-6 text-center text-tet-primary font-bold border-2 border-tet-primary py-2 rounded-xl hover:bg-tet-primary hover:text-white transition-all"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-[2rem] text-gray-500 italic">
            Không tìm thấy bài viết nào chứa nội dung liên quan đến danh mục "
            {activeCategory}".
          </div>
        )}

        {/* Phân trang (Đã hoạt động) */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-full border border-gray-200 hover:bg-tet-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-full font-bold transition-all ${currentPage === i + 1
                  ? "bg-tet-primary text-white shadow-lg"
                  : "bg-gray-50 text-gray-600 hover:bg-tet-secondary"
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-full border border-gray-200 hover:bg-tet-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
