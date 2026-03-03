// src/features/blog/pages/BlogPage.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BlogHero from "../components/BlogHero";
import BlogGrid from "../components/BlogGrid";
import Newsletter from "../components/Newsletter";
import { blogService, type BlogDto} from "../services/blogService";

export default function BlogPage() {
  const [blogs, setBlogs] = useState<BlogDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        const data = await blogService.getAllBlogs();
        setBlogs(data);
      } catch {
        setError("Không thể tải danh sách bài viết lúc này.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Xử lý UI cho các trạng thái
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#FBF5E8]/30">
        <div className="w-10 h-10 border-4 border-tet-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center text-red-500 bg-[#FBF5E8]/30 font-bold">
        {error}
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center text-tet-primary italic bg-[#FBF5E8]/30">
        Chưa có bài viết nào được đăng.
      </div>
    );
  }

  // Tách bài mới nhất (đầu tiên) cho Hero, các bài còn lại cho Grid
  const featuredBlog = blogs[0];
  const gridBlogs = blogs.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white min-h-screen"
    >
      <BlogHero blog={featuredBlog} />
      <BlogGrid blogs={gridBlogs} />
      <Newsletter />
    </motion.div>
  );
}
