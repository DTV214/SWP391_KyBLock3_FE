// src/features/blog/pages/BlogDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { blogService, type BlogDto } from "../services/blogService";

import BlogSidebar from "../components/BlogSidebar";
import BlogContent from "../components/BlogContent"; // Sửa lại đường dẫn import cho đồng nhất

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogDto | null>(null);
  const [recentBlogs, setRecentBlogs] = useState<BlogDto[]>([]); // Thêm state để chứa bài viết liên quan
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);

        // Gọi song song 2 API: 1 lấy chi tiết, 1 lấy danh sách toàn bộ bài viết
        const [detailData, allBlogsData] = await Promise.all([
          blogService.getBlogById(id),
          blogService.getAllBlogs(),
        ]);

        // Cập nhật state bài viết chi tiết
        if (detailData) {
          setBlog(detailData);
        } else {
          setError("Không tìm thấy bài viết.");
        }

        // Cập nhật state bài viết liên quan (lọc bỏ bài viết hiện tại đang xem)
        if (allBlogsData && allBlogsData.length > 0) {
          const related = allBlogsData.filter(
            (b) => b.blogId.toString() !== id,
          );
          setRecentBlogs(related);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu bài viết", err);
        setError("Đã xảy ra lỗi khi tải bài viết.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#FBF5E8]/30 py-20">
        <div className="w-10 h-10 border-4 border-tet-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FBF5E8]/30 py-20 space-y-4">
        <p className="text-red-500 font-bold">
          {error || "Bài viết không tồn tại."}
        </p>
        <Link
          to="/blogs"
          className="text-tet-primary underline hover:text-tet-accent"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FBF5E8]/30 min-h-screen py-10">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Nút Back phía trên */}
        <Link
          to="/blogs"
          className="inline-flex items-center gap-2 text-tet-primary font-bold hover:text-tet-accent transition-colors mb-8 group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
            <ChevronLeft size={20} />
          </div>
          <span>Quay lại danh sách tin tức</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* PHẦN 1: NỘI DUNG CHI TIẾT (70%) */}
          <main className="w-full lg:w-2/3">
            <BlogContent blog={blog} />
          </main>

          {/* PHẦN 2: SIDEBAR (30%) */}
          <aside className="w-full lg:w-1/3 space-y-8">
            {/* Truyền dữ liệu recentBlogs vào Sidebar */}
            <BlogSidebar recentBlogs={recentBlogs} />
          </aside>
        </div>
      </div>
    </div>
  );
}
