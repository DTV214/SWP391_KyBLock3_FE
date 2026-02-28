// src/features/blog/components/BlogContent.tsx

import type { BlogDto } from "@/feature/blog/services/blogService";
import { Calendar, Share2 } from "lucide-react";

interface BlogContentProps {
  blog: BlogDto;
}

export default function BlogContent({ blog }: BlogContentProps) {
  if (!blog) return null;

  // Xử lý dữ liệu fallback (Mặc định)
  const defaultImage =
    "https://res.cloudinary.com/dratbz8bh/image/upload/v1769521491/Gia-Dinh-Doan-Vien-T_v0n9to.png";

  const formattedDate = new Date(blog.creationDate).toLocaleDateString(
    "vi-VN",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <article className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
      {/* 1. Ảnh bìa bài viết (Hero Image) - Fix cứng do BE không có */}
      <div className="w-full h-[300px] md:h-[450px] overflow-hidden relative bg-gray-100">
        <img
          src={defaultImage}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          alt={blog.title}
        />
        <div className="absolute top-6 left-6 bg-tet-primary text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
          Tin tức Tết
        </div>
      </div>

      <div className="p-8 md:p-14">
        {/* 2. Header bài viết */}
        <header className="space-y-6 mb-12 border-b border-gray-50 pb-10">
          <h1 className="text-3xl md:text-5xl font-serif text-tet-primary font-bold leading-[1.2]">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Calendar size={18} className="text-tet-accent" />{" "}
                {formattedDate}
              </span>
              <span className="flex items-center gap-2 text-tet-primary">
                Tác giả: {blog.authorName || "Ẩn danh"}
              </span>
            </div>

            <button className="flex items-center gap-2 text-tet-primary hover:text-tet-accent transition-colors text-sm font-bold">
              <Share2 size={18} /> Chia sẻ
            </button>
          </div>
        </header>

        {/* 3. Nội dung chính */}
        {/* Dùng dangerouslySetInnerHTML để render chuỗi HTML từ BE */}
        {/* Class 'prose max-w-none' của Tailwind Typography sẽ giúp style các thẻ HTML (h1, h2, p, ul, li...) bên trong tự động đẹp */}
        <div
          className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* 4. CTA Bottom (Giữ lại làm Banner cố định dưới mỗi bài) */}
        <div className="mt-20 bg-tet-primary p-12 rounded-[3rem] text-center text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-cloud-pattern opacity-10 group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="relative z-10 space-y-8">
            <h3 className="text-3xl md:text-4xl font-serif font-bold leading-tight max-w-2xl mx-auto">
              Tìm món quà Tết hoàn hảo cho gia đình bạn
            </h3>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button className="bg-white text-tet-primary px-10 py-4 rounded-full font-black text-sm hover:bg-tet-secondary transition-all shadow-xl hover:-translate-y-1 active:translate-y-0">
                Khám Phá Quà Tết
              </button>
              <button className="border-2 border-white/50 backdrop-blur-sm px-10 py-4 rounded-full font-black text-sm hover:bg-white/10 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest">
                Tạo Hộp Quà
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
