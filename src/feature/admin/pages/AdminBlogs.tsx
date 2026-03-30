import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  X,
  Save,
  User,
  Calendar,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import {
  blogAdminService,
  type BlogDto,
  type CreateBlogRequest,
  type UpdateBlogRequest,
} from "@/api/blogAdminService";
import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiConfig";
import AdminPagination from "../components/AdminPagination";
import BASE_URL from "@/api/apiConfig";

export default function AdminBlogs() {
  // --- States ---
  const [blogs, setBlogs] = useState<BlogDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  console.log("error state:", error);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"CREATE" | "EDIT" | "VIEW">(
    "VIEW",
  );
  const [selectedBlog, setSelectedBlog] = useState<BlogDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // --- FORM STATE MỚI ---
  // formData giờ CHỈ lưu các giá trị chuỗi (text/url) để gửi thành JSON
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    videoUrl: "",
  });

  // State riêng để lưu File nhị phân chuẩn bị upload
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  // --- Functions ---

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await blogAdminService.getAllBlogs();
      setBlogs(data);
    } catch (err: unknown) {
      console.error("Error fetching blogs:", err);
      setError("Không thể tải danh sách bài viết. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleOpenModal = (
    type: "CREATE" | "EDIT" | "VIEW",
    blog?: BlogDto,
  ) => {
    setModalType(type);
    // Reset file đang chọn mỗi khi mở modal
    setSelectedImageFile(null);
    setSelectedVideoFile(null);

    if (blog) {
      setSelectedBlog(blog);
      setFormData({
        title: blog.title,
        content: blog.content,
        imageUrl: blog.imageUrl || "",
        videoUrl: blog.videoUrl || "",
      });
    } else {
      setSelectedBlog(null);
      setFormData({ title: "", content: "", imageUrl: "", videoUrl: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBlog(null);
    setFormData({ title: "", content: "", imageUrl: "", videoUrl: "" });
    setSelectedImageFile(null);
    setSelectedVideoFile(null);
    setError(null);
  };

  // --- HÀM UPLOAD MEDIA ---
  const uploadMedia = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res: any = await axiosClient.post(API_ENDPOINTS.MEDIA.UPLOAD, formData);
    const url = res?.data?.url;
    if (!url) throw new Error("Upload ảnh thất bại: không nhận được URL từ server");
    return url;
  };

  // Xử lý Submit Form (Create hoặc Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Vui lòng điền đầy đủ tiêu đề và nội dung.");
      return;
    }

    try {
      setSubmitting(true);

      // Bước 1: Upload file nếu có chọn file mới
      let finalImageUrl = formData.imageUrl;
      let finalVideoUrl = formData.videoUrl;

      if (selectedImageFile) {
        finalImageUrl = await uploadMedia(selectedImageFile);
      }
      if (selectedVideoFile) {
        finalVideoUrl = await uploadMedia(selectedVideoFile);
      }

      // Bước 2: Chuẩn bị Payload JSON
      const payload = {
        title: formData.title,
        content: formData.content,
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
      };

      // Bước 3: Gửi API
      if (modalType === "CREATE") {
        await blogAdminService.createBlog(
          payload as unknown as CreateBlogRequest,
        );
      } else if (modalType === "EDIT" && selectedBlog) {
        await blogAdminService.updateBlog(
          selectedBlog.blogId,
          payload as unknown as UpdateBlogRequest,
        );
      }

      handleCloseModal();
      await fetchBlogs();
    } catch (err: unknown) {
      setError("Có lỗi xảy ra khi lưu bài viết.");
      console.error("Error submitting blog form:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await blogAdminService.deleteBlog(id);
      await fetchBlogs();
      if (paginatedBlogs.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err: unknown) {
      setError("Không thể xóa bài viết.");
      console.error("Error deleting blog:", err);
    }
  };

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.authorName &&
        b.authorName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Xử lý thông minh: Nhận diện link Cloudinary/http hoặc link local
  const getFullMediaUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url; // Trả thẳng nếu đã là link absolute
    }
    const serverUrl = BASE_URL.replace("/api", "");
    return `${serverUrl}${url}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Quản lý bài viết
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Viết câu chuyện Tết và chia sẻ mẹo hay Happybox
            </p>
          </div>
          <button
            onClick={() => handleOpenModal("CREATE")}
            className="flex items-center gap-2 bg-tet-primary text-white px-6 py-3 rounded-full font-bold hover:bg-tet-accent transition-all shadow-md"
          >
            <Plus size={20} /> Thêm bài viết
          </button>
        </div>

        <div className="mt-6 relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm tiêu đề bài viết hoặc tác giả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-tet-accent focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Blog List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 flex justify-center items-center border border-gray-100">
          <div className="w-10 h-10 border-4 border-tet-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-gray-100">
          <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500">Không tìm thấy bài viết nào.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {paginatedBlogs.map((blog) => (
              <div
                key={blog.blogId}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-4 group"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {blog.imageUrl ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                      <img
                        src={getFullMediaUrl(blog.imageUrl)}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#FBF5E8] flex items-center justify-center text-tet-primary shrink-0">
                      <BookOpen size={24} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-bold text-tet-primary truncate max-w-md md:max-w-xl">
                      {blog.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {blog.authorName || "Admin"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />{" "}
                        {new Date(blog.creationDate).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                      {blog.videoUrl && (
                        <span className="flex items-center gap-1 text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                          <Video size={10} /> Có Video
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleOpenModal("VIEW", blog)}
                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    title="Xem nhanh"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleOpenModal("EDIT", blog)}
                    className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(blog.blogId)}
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    title="Xóa bài viết"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* --- CRUD MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-xl font-serif font-bold text-tet-primary">
                {modalType === "CREATE"
                  ? "Tạo bài viết mới"
                  : modalType === "EDIT"
                    ? "Chỉnh sửa bài viết"
                    : "Chi tiết bài viết"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              {modalType === "VIEW" ? (
                <div className="space-y-6">
                  {selectedBlog?.imageUrl && (
                    <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                      <img
                        src={getFullMediaUrl(selectedBlog.imageUrl)}
                        alt={selectedBlog.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h1 className="text-3xl font-serif font-bold text-tet-primary leading-tight">
                    {selectedBlog?.title}
                  </h1>

                  <div className="flex gap-4 text-sm text-gray-400 pb-6 border-b border-gray-50">
                    <span className="font-bold text-tet-accent">
                      Tác giả: {selectedBlog?.authorName}
                    </span>
                    <span>
                      Ngày đăng:{" "}
                      {selectedBlog &&
                        new Date(selectedBlog.creationDate).toLocaleString(
                          "vi-VN",
                        )}
                    </span>
                  </div>

                  <div
                    className="prose prose-red max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: selectedBlog?.content || "",
                    }}
                  />

                  {selectedBlog?.videoUrl && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Video size={18} /> Video minh họa
                      </h4>
                      <video
                        controls
                        className="w-full rounded-2xl border border-gray-100 shadow-sm"
                        src={getFullMediaUrl(selectedBlog.videoUrl)}
                      >
                        Trình duyệt của bạn không hỗ trợ thẻ video.
                      </video>
                    </div>
                  )}
                </div>
              ) : (
                <form
                  id="blogForm"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tiêu đề bài viết
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none font-medium"
                      placeholder="Nhập tiêu đề hấp dẫn..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nội dung bài viết (Hỗ trợ HTML)
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-tet-accent outline-none min-h-[300px] font-sans"
                      placeholder="Nhập nội dung chi tiết bài viết ở đây..."
                      required
                    />
                    <p className="mt-2 text-xs text-gray-400 italic">
                      * Hiện tại hệ thống hỗ trợ nhập liệu trực tiếp HTML để
                      format bài viết.
                    </p>
                  </div>

                  {/* Vùng Upload Ảnh và Video */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <ImageIcon size={16} className="text-tet-accent" /> Ảnh
                        bìa bài viết
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0)
                            setSelectedImageFile(e.target.files[0]);
                        }}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 transition-colors"
                      />
                      {modalType === "EDIT" &&
                        formData.imageUrl &&
                        !selectedImageFile && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 italic bg-white p-2 rounded-lg border border-gray-200">
                              Đang sử dụng ảnh bìa hiện tại. Chọn file mới để
                              thay thế.
                            </p>
                            <img
                              src={getFullMediaUrl(formData.imageUrl)}
                              alt="Current cover"
                              className="mt-2 h-16 rounded-md object-cover border border-gray-200"
                            />
                          </div>
                        )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Video size={16} className="text-blue-500" /> Video minh
                        họa (Tùy chọn)
                      </label>
                      <input
                        type="file"
                        accept="video/mp4,video/x-m4v,video/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0)
                            setSelectedVideoFile(e.target.files[0]);
                        }}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                      />
                      {modalType === "EDIT" &&
                        formData.videoUrl &&
                        !selectedVideoFile && (
                          <p className="mt-3 text-xs text-gray-500 italic bg-white p-2 rounded-lg border border-gray-200">
                            Đang sử dụng video hiện tại. Chọn file mới để thay
                            thế.
                          </p>
                        )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            {(modalType === "CREATE" || modalType === "EDIT") && (
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full font-bold text-gray-500 hover:bg-gray-200 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  form="blogForm"
                  disabled={submitting}
                  className="px-8 py-2.5 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save size={18} />
                  )}
                  {modalType === "CREATE"
                    ? "Đăng bài viết"
                    : "Cập nhật thay đổi"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
