// src/features/blog/components/BlogHero.tsx
import type { BlogDto } from "@/feature/blog/services/blogService";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";


interface BlogHeroProps {
  blog: BlogDto;
}

export default function BlogHero({ blog }: BlogHeroProps) {
  // Hàm loại bỏ thẻ HTML để làm đoạn trích dẫn ngắn (description)
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const snippet = stripHtml(blog.content).substring(0, 150) + "...";

  // Format ngày tháng
  const formattedDate = new Date(blog.creationDate).toLocaleDateString(
    "vi-VN",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  // Ảnh mặc định vì BE không cung cấp
  const defaultImage =
    "https://res.cloudinary.com/dratbz8bh/image/upload/v1769521491/Gia-Dinh-Doan-Vien-T_v0n9to.png";

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-serif text-tet-primary font-bold mb-4">
            Tin tức & Câu chuyện ngày Tết
          </h1>
          <p className="text-gray-500 italic text-lg">
            Gìn giữ truyền thống, lan tỏa yêu thương
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative flex flex-col md:flex-row border-2 border-tet-secondary/30 rounded-[2.5rem] overflow-hidden bg-[#FBF5E8]/20 shadow-xl"
        >
          {/* Bên trái: Hình ảnh (Dùng ảnh mặc định) */}
          <div className="w-full md:w-1/2 overflow-hidden bg-gray-100">
            <img
              src={defaultImage}
              alt={blog.title}
              className="w-full h-[350px] md:h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          {/* Bên phải: Thông tin */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            {/* Ẩn tag category đi vì BE không có, hoặc có thể fix cứng là "Bài viết mới" */}
            <span className="bg-tet-primary text-white px-4 py-1 rounded-full text-xs font-bold w-fit mb-6">
              Bài viết nổi bật
            </span>

            <h2 className="text-3xl md:text-4xl font-serif text-tet-primary font-bold mb-6 leading-tight">
              {blog.title}
            </h2>

            <p className="text-gray-600 mb-8 line-clamp-3 italic">{snippet}</p>

            <div className="flex items-center justify-between mt-auto border-t border-tet-secondary/20 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tet-secondary flex items-center justify-center font-bold text-tet-primary uppercase">
                  {blog.authorName ? blog.authorName.charAt(0) : "A"}
                </div>
                <div>
                  <p className="text-sm font-bold text-tet-primary">
                    {blog.authorName || "Ẩn danh"}
                  </p>
                  <p className="text-xs text-gray-400">{formattedDate}</p>
                </div>
              </div>
              <Link
                to={`/blog/${blog.blogId}`}
                className="bg-tet-primary text-white px-6 py-2.5 rounded-full font-bold hover:bg-tet-accent transition-all shadow-md"
              >
                Đọc thêm
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
