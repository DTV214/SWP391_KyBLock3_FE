// src/features/blog/components/BlogGrid.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogDto } from "@/feature/blog/services/blogService";


interface BlogGridProps {
  blogs: BlogDto[];
}

export default function BlogGrid({ blogs }: BlogGridProps) {
  // Filter tĩnh (Chỉ để trang trí vì BE không có category)
  const categories = [
    "Tất cả",
    "Gift Guides",
    "Truyền thống",
    "Quà tặng doanh nghiệp",
    "Bao bì",
  ];

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const defaultImage =
    "https://res.cloudinary.com/dratbz8bh/image/upload/v1769521491/Gia-Dinh-Doan-Vien-T_v0n9to.png";

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Thanh lọc (Hiện tại click vào chưa có tác dụng) */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat, i) => (
            <button
              key={i}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                i === 0
                  ? "bg-tet-primary text-white shadow-lg"
                  : "bg-gray-100 text-gray-500 hover:bg-tet-secondary hover:text-tet-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lưới bài viết */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, index) => {
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
                className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col"
              >
                <div className="relative h-60 overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={defaultImage}
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

        {/* Pagination Tĩnh (BE chưa hỗ trợ) */}
        {blogs.length > 0 && (
          <div className="mt-16 flex justify-center items-center gap-2">
            <button className="p-2 rounded-full border border-gray-200 hover:bg-tet-secondary transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button className="w-10 h-10 rounded-full font-bold transition-all bg-tet-primary text-white shadow-lg">
              1
            </button>
            <button className="p-2 rounded-full border border-gray-200 hover:bg-tet-secondary transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
