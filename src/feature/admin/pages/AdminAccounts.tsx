import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Trash2,
  X,
  Save,
  Users,
  Edit,
  Mail,
  Phone,
  User,
} from "lucide-react";
import {
  accountAdminService,
  type AccountDto,
} from "@/api/accountAdminService";
import AdminPagination from "../components/AdminPagination";

export default function AdminAccounts() {
  // --- States ---
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountDto | null>(
    null,
  );
  const [newStatus, setNewStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // --- Fetching Logic ---
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountAdminService.getAllAccounts();
      setAccounts(data);
    } catch (err: unknown) {
      setError("Không thể tải danh sách tài khoản.");
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // --- Handlers ---
  const handleOpenModal = (account: AccountDto) => {
    setSelectedAccount(account);
    setNewStatus(account.status);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAccount(null);
    setNewStatus("");
    setError(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      setSubmitting(true);
      setError(null);
      await accountAdminService.updateAccountStatus(
        selectedAccount.accountId,
        newStatus,
      );
      handleCloseModal();
      await fetchAccounts();
    } catch (err: unknown) {
      setError("Có lỗi xảy ra khi cập nhật trạng thái.");
      console.log("Error updating account status:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Cảnh báo: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này?",
      )
    )
      return;
    try {
      setLoading(true);
      await accountAdminService.deleteAccount(id);
      await fetchAccounts();
    } catch (err: unknown) {
      alert("Không thể xóa tài khoản này.");
      console.error("Error deleting account:", err);
      setLoading(false);
    }
  };

  // --- Derived Data ---
  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch =
      acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.fullname &&
        acc.fullname.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRole = roleFilter ? acc.role === roleFilter : true;
    const matchStatus = statusFilter ? acc.status === statusFilter : true;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // --- Helpers UI ---
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-violet-100 text-violet-800 border-violet-200";
      case "STAFF":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "CUSTOMER":
        return "bg-sky-100 text-sky-800 border-sky-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          bg: "bg-green-100 text-green-700",
          icon: <UserCheck size={14} />,
        };
      case "PENDING":
        return { bg: "bg-amber-100 text-amber-700", icon: <Clock size={14} /> };
      case "INACTIVE":
        return { bg: "bg-gray-200 text-gray-700", icon: <UserX size={14} /> };
      case "DELETED":
        return { bg: "bg-red-100 text-red-700", icon: <Trash2 size={14} /> };
      default:
        return { bg: "bg-slate-100 text-slate-700", icon: <User size={14} /> };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Quản lý Tài khoản
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Phân quyền và quản lý trạng thái truy cập của người dùng
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm theo Username, Email, Tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none text-sm bg-white"
          >
            <option value="">Tất cả Vai trò (Roles)</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
            <option value="STAFF">Nhân viên (Staff)</option>
            <option value="CUSTOMER">Khách hàng (Customer)</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none text-sm bg-white"
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="PENDING">Chờ duyệt (Pending)</option>
            <option value="INACTIVE">Vô hiệu hóa (Inactive)</option>
            <option value="DELETED">Đã xóa (Deleted)</option>
          </select>
        </div>
      </div>

      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden pb-6">
        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-tet-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">
              Không tìm thấy tài khoản nào khớp với bộ lọc.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Tài khoản</th>
                    <th className="px-6 py-4 font-bold">Liên hệ</th>
                    <th className="px-6 py-4 font-bold">Vai trò (Role)</th>
                    <th className="px-6 py-4 font-bold">Trạng thái</th>
                    <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedAccounts.map((acc) => {
                    const statusUI = getStatusBadge(acc.status);
                    return (
                      <tr
                        key={acc.accountId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-tet-primary">
                            {acc.fullname || acc.username}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            @{acc.username}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700 flex items-center gap-1">
                            <Mail size={12} /> {acc.email}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone size={12} /> {acc.phone || "Chưa cập nhật"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(acc.role)}`}
                          >
                            {acc.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusUI.bg}`}
                          >
                            {statusUI.icon}
                            {acc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(acc)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Cập nhật trạng thái"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(acc.accountId)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* --- MODAL CHỈNH SỬA TRẠNG THÁI --- */}
      {showModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-serif font-bold text-tet-primary flex items-center gap-2">
                <Shield size={20} /> Cập nhật Trạng thái
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              id="statusForm"
              onSubmit={handleUpdateStatus}
              className="p-8 space-y-6"
            >
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Read-only Info */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ID / Username:</span>
                  <span className="font-bold text-gray-800">
                    #{selectedAccount.accountId} - @{selectedAccount.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Họ và tên:</span>
                  <span className="font-medium text-gray-800">
                    {selectedAccount.fullname || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="font-medium text-gray-800">
                    {selectedAccount.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Vai trò:</span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getRoleBadge(selectedAccount.role)}`}
                  >
                    {selectedAccount.role}
                  </span>
                </div>
              </div>

              {/* Editable Status */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Trạng thái tài khoản <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none bg-white font-medium"
                  required
                >
                  <option value="PENDING">PENDING - Chờ duyệt</option>
                  <option value="ACTIVE">ACTIVE - Hoạt động bình thường</option>
                  <option value="INACTIVE">
                    INACTIVE - Vô hiệu hóa/Khóa tạm thời
                  </option>
                  <option value="DELETED">
                    DELETED - Đã xóa (Soft Delete)
                  </option>
                </select>
                <p className="text-xs text-amber-600 mt-2 italic flex items-center gap-1">
                  * Chú ý: Việc khóa tài khoản (INACTIVE/DELETED) sẽ khiến người
                  dùng bị văng khỏi hệ thống lập tức.
                </p>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-full font-bold text-gray-500 hover:bg-gray-200 transition-all"
                disabled={submitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="statusForm"
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
