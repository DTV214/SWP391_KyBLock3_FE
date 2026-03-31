import { useState, useEffect, useCallback } from "react";
import {
  Search,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  Save,
  User,
  Inbox,
} from "lucide-react";
import {
  contactService,
  type ContactDto,
  type UpdateContactRequest,
} from "@/api/contactService";
import AdminPagination from "../components/AdminPagination";

export default function AdminContactManagement() {
  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<ContactDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<UpdateContactRequest>({
    customerName: "",
    phone: "",
    email: "",
    note: "",
    isContacted: false,
  });

  // --- Fetch Data ---
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactService.getAllContacts();
      // Sắp xếp mới nhất lên đầu
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setContacts(sortedData);
    } catch (err) {
      console.log("Không thể tải danh sách liên hệ.", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // --- Modal Handlers ---
  const handleOpenModal = (contact: ContactDto) => {
    setEditingContact(contact);
    setFormData({
      customerName: contact.customerName,
      phone: contact.phone,
      email: contact.email,
      note: contact.note || "",
      isContacted: contact.isContacted,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      setSubmitting(true);
      await contactService.updateContact(editingContact.id, formData);
      handleCloseModal();
      await fetchContacts();
    } catch (err) {
      console.log("Lỗi khi cập nhật yêu cầu liên hệ.", err);
      setError("Lỗi khi cập nhật yêu cầu liên hệ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa yêu cầu liên hệ này?"))
      return;
    try {
      setLoading(true);
      await contactService.deleteContact(id);
      await fetchContacts();

      if (paginatedContacts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.log("Lỗi khi xóa yêu cầu.", err);
      alert("Lỗi khi xóa yêu cầu.");
      setLoading(false);
    }
  };

  // --- Derived Data & Logic ---
  const filteredContacts = contacts.filter((c) => {
    const matchSearch =
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    const matchStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "CONTACTED"
          ? c.isContacted === true
          : c.isContacted === false;

    return matchSearch && matchStatus;
  });

  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Yêu cầu Liên hệ
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý và phản hồi các yêu cầu từ khách hàng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm Tên, Email, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none text-sm bg-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="CONTACTED">Đã phản hồi</option>
          </select>
        </div>
      </div>

      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden pb-6">
        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-tet-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-16 text-center">
            <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">
              Chưa có yêu cầu liên hệ nào.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Khách hàng</th>
                    <th className="px-6 py-4 font-bold">Liên hệ</th>
                    <th className="px-6 py-4 font-bold">Lời nhắn</th>
                    <th className="px-6 py-4 font-bold text-center">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-tet-primary flex items-center gap-1">
                          <User size={14} /> {contact.customerName}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(contact.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <p className="text-gray-700 flex items-center gap-2">
                          <Phone size={12} /> {contact.phone}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Mail size={12} /> {contact.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[200px] md:max-w-[300px]">
                          <p
                            className="text-gray-600 truncate"
                            title={contact.note || ""}
                          >
                            {contact.note || (
                              <span className="italic text-gray-400">
                                Không có lời nhắn
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            contact.isContacted
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {contact.isContacted ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                          {contact.isContacted ? "Đã phản hồi" : "Chờ xử lý"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(contact)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Xử lý yêu cầu"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Xóa yêu cầu"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* --- MODAL --- */}
      {showModal && editingContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-serif font-bold text-tet-primary flex items-center gap-2">
                <MessageSquare size={20} /> Xử lý Yêu cầu Liên hệ
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              id="contactForm"
              onSubmit={handleSubmit}
              className="p-8 space-y-5"
            >
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Lời nhắn từ khách hàng
                  </label>
                  <textarea
                    value={formData.note || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none bg-gray-50"
                  />
                </div>

                <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-xl mt-2">
                  <label className="block text-sm font-bold text-blue-900 mb-2">
                    Trạng thái xử lý
                  </label>
                  <select
                    value={formData.isContacted ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isContacted: e.target.value === "true",
                      })
                    }
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none font-bold text-blue-800"
                  >
                    <option value="false">⏳ Chờ xử lý (Pending)</option>
                    <option value="true">
                      ✅ Đã ghi nhận / Đã phản hồi (Contacted)
                    </option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-full font-bold text-gray-500 hover:bg-gray-200 transition-all"
                disabled={submitting}
              >
                Đóng
              </button>
              <button
                type="submit"
                form="contactForm"
                className="px-8 py-2.5 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save size={18} />
                )}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
