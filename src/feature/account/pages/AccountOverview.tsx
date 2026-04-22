// src/feature/account/pages/AccountOverview.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ClipboardList,
  ShieldCheck,
  MapPin,
  Gift,
  Loader2,
  X,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import type { ProfileData } from "../services/accountService";
import accountService from "../services/accountService";
import { productService, type CustomerBasketDto } from "@/api/productService";

export default function AccountOverview() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [customBaskets, setCustomBaskets] = useState<CustomerBasketDto[]>([]);
  const [loadingBaskets, setLoadingBaskets] = useState(false);
  const [showBasketsModal, setShowBasketsModal] = useState(false);
  const [selectedBasket, setSelectedBasket] =
    useState<CustomerBasketDto | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await accountService.getProfile();
        if (response.status === 200) {
          setProfile(response.data);
        }
      } catch (error: unknown) {
        console.error("Lỗi khi lấy thông tin hồ sơ:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  const fetchCustomBaskets = async () => {
    try {
      setLoadingBaskets(true);
      const token = localStorage.getItem("token") || "";
      const response = await productService.getMyBaskets(token);
      console.log("My baskets response:", response);
      setCustomBaskets(response.data || []);
    } catch (error) {
      console.error("Error fetching custom baskets:", error);
    } finally {
      setLoadingBaskets(false);
    }
  };

  const handleCloseBasketsModal = () => {
    setShowBasketsModal(false);
    setCustomBaskets([]);
  };

  const handleViewBasketDetails = (basket: CustomerBasketDto) => {
    setSelectedBasket(basket);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBasket(null);
  };

  const handleDeleteBasket = async (productId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giỏ quà này không?")) return;

    console.log("=== DELETE CUSTOM BASKET ===");
    console.log("Product ID:", productId);

    try {
      const token = localStorage.getItem("token") || "";
      console.log("Calling API: DELETE /products/" + productId);

      await productService.delete(productId, token);

      console.log("Basket deleted successfully");
      alert("Đã xóa giỏ quà thành công");

      await fetchCustomBaskets();
    } catch (error: unknown) {
      console.error("Error deleting basket:", error);
      let errorMessage = "Không thể xóa giỏ quà";

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error message:", errorMessage);
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const apiError = error as {
          response?: { data?: { message?: string } };
        };
        errorMessage = apiError.response?.data?.message || errorMessage;
        console.error("Error response:", apiError.response);
      }

      alert(errorMessage);
    } finally {
      console.log("=== END DELETE BASKET ===");
    }
  };

  const handleEditBasket = (basket: CustomerBasketDto) => {
    console.log("=== NAVIGATE TO EDIT BASKET ===");
    console.log("Basket:", basket);

    navigate(`/account/baskets/${basket.productid}/edit`, {
      state: { basket },
    });
  };

  if (loading) {
    return (
      <div className="min-h-100 flex flex-col items-center justify-center text-tet-primary">
        <Loader2 className="mb-4 animate-spin" size={40} />
        <p className="font-serif text-sm italic">
          Đang lấy thông tin quà Tết của bạn...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center text-red-500">
        Không thể tải thông tin tài khoản. Vui lòng thử lại sau.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-tet-secondary bg-gray-50 shadow-lg">
            <img
              src={`https://ui-avatars.com/api/?name=${profile.fullName || profile.username}&background=random&size=150`}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              {profile.fullName || "Chưa cập nhật tên"}
            </h2>
            <p className="text-sm italic text-gray-500">{profile.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
              <span className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-[10px] font-bold text-green-600">
                <ShieldCheck size={12} /> Email đã xác thực
              </span>
              {profile.status === "ACTIVE" && (
                <span className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-[10px] font-bold text-green-600">
                  <ShieldCheck size={12} /> Tài khoản hoạt động
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/account/profile")}
          className="rounded-full bg-tet-primary px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-tet-accent active:scale-95"
        >
          Chỉnh sửa hồ sơ
        </button>
      </section>

      <section className="group flex items-center gap-6 rounded-[2.5rem] border border-tet-secondary/30 bg-linear-to-r from-[#FBF5E8] to-white p-8 transition-all hover:shadow-md">
        <div className="rounded-2xl bg-tet-primary/10 p-4 text-tet-primary shadow-inner">
          <ShieldCheck size={32} />
        </div>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-tet-primary/60">
            Hạng thành viên
          </p>
          <h3 className="text-3xl font-serif font-black uppercase tracking-wide text-tet-primary">
            {profile.role === "CUSTOMER" ? "THÀNH VIÊN BẠC" : profile.role}
          </h3>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Thông tin cá nhân",
            icon: <User size={24} />,
            onClick: () => navigate("/account/profile"),
          },
          {
            label: "Lịch sử đơn hàng",
            icon: <ClipboardList size={24} />,
            onClick: () => navigate("/account/orders"),
          },
          {
            label: "Quản lý địa chỉ",
            icon: <MapPin size={24} />,
            onClick: () => navigate("/account/addresses"),
          },
          {
            label: "Giỏ quà của tôi",
            icon: <Gift size={24} />,
            onClick: () => navigate("/account/baskets"),
          },
        ].map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-center transition-all hover:border-tet-secondary hover:shadow-lg"
          >
            <div className="text-tet-accent">{item.icon}</div>
            <p className="text-xs font-bold text-tet-primary">{item.label}</p>
          </div>
        ))}
      </div>

      {showBasketsModal && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={handleCloseBasketsModal}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 rounded-t-3xl bg-linear-to-r from-tet-primary to-tet-accent p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-2xl font-bold">
                    Giỏ quà tùy chỉnh của bạn
                  </h3>
                  <p className="text-sm opacity-90">Quản lý các giỏ quà đã tạo</p>
                </div>
                <button
                  onClick={handleCloseBasketsModal}
                  className="rounded-full p-2 transition-all hover:bg-white/20"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loadingBaskets ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-tet-accent" />
                    <p className="text-gray-500">Đang tải giỏ quà...</p>
                  </div>
                </div>
              ) : customBaskets.length === 0 ? (
                <div className="py-20 text-center">
                  <Gift size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="mb-2 text-lg text-gray-500">
                    Chưa có giỏ quà tùy chỉnh nào
                  </p>
                  <p className="text-sm text-gray-400">
                    Hãy tạo giỏ quà từ template để bắt đầu!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {customBaskets.map((basket) => (
                    <div
                      key={basket.productid}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
                    >
                      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-tet-secondary to-tet-primary/10">
                        {basket.imageUrl ? (
                          <img
                            src={basket.imageUrl}
                            alt={basket.productname}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Gift size={48} className="text-tet-primary/30" />
                          </div>
                        )}
                        <div className="absolute right-3 top-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg ${
                              basket.status === "DRAFT"
                                ? "bg-yellow-500"
                                : basket.status === "ACTIVE"
                                  ? "bg-green-500"
                                  : "bg-gray-500"
                            }`}
                          >
                            {basket.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h4 className="mb-2 min-h-14 line-clamp-2 text-lg font-bold text-tet-primary">
                          {basket.productname}
                        </h4>
                        <p className="mb-3 line-clamp-2 text-xs text-gray-500">
                          {basket.description || "Giỏ quà tùy chỉnh"}
                        </p>

                        <div className="mb-4 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-blue-50 p-2">
                            <p className="text-xs text-gray-600">Tổng giá</p>
                            <p className="text-sm font-bold text-blue-600">
                              {basket.totalPrice.toLocaleString()}đ
                            </p>
                          </div>
                          <div className="rounded-lg bg-purple-50 p-2">
                            <p className="text-xs text-gray-600">Số món</p>
                            <p className="text-sm font-bold text-purple-600">
                              {basket.productDetails?.length || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewBasketDetails(basket)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-100"
                          >
                            <Eye size={14} />
                            Xem
                          </button>
                          <button
                            onClick={() => handleEditBasket(basket)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-600 transition-all hover:bg-green-100"
                          >
                            <Edit size={14} />
                            Sửa
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteBasket(basket.productid!)
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 font-bold text-red-600 transition-all hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            alert("Chức năng thanh toán đang được phát triển");
                          }}
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-green-500 to-emerald-600 px-3 py-2 text-sm font-bold text-white transition-all hover:shadow-lg"
                        >
                          <ShoppingCart size={14} />
                          Thanh toán
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex shrink-0 gap-3 border-t border-gray-100 p-6">
              <button
                onClick={handleCloseBasketsModal}
                className="flex-1 rounded-full border border-gray-300 px-6 py-3 font-bold text-gray-600 transition-all hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={() => navigate("/custom-basket")}
                className="flex-1 rounded-full bg-linear-to-r from-tet-primary to-tet-accent px-6 py-3 font-bold text-white transition-all hover:shadow-lg"
              >
                Tạo giỏ quà mới
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedBasket && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={handleCloseDetailsModal}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 rounded-t-3xl bg-linear-to-r from-tet-primary to-tet-accent p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-2xl font-bold">
                    {selectedBasket.productname}
                  </h3>
                  <p className="text-sm opacity-90">
                    {selectedBasket.description || "Giỏ quà tùy chỉnh"}
                  </p>
                </div>
                <button
                  onClick={handleCloseDetailsModal}
                  className="rounded-full p-2 transition-all hover:bg-white/20"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="mb-1 text-xs text-gray-600">Tổng giá</p>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedBasket.totalPrice.toLocaleString()}đ
                  </p>
                </div>
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="mb-1 text-xs text-gray-600">Trọng lượng</p>
                  <p className="text-lg font-bold text-green-600">
                    {selectedBasket.totalWeight}g
                  </p>
                </div>
                <div className="rounded-xl bg-purple-50 p-4">
                  <p className="mb-1 text-xs text-gray-600">Số món</p>
                  <p className="text-lg font-bold text-purple-600">
                    {selectedBasket.productDetails?.length || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="mb-1 text-xs text-gray-600">Trạng thái</p>
                  <p
                    className={`text-lg font-bold ${
                      selectedBasket.status === "DRAFT"
                        ? "text-yellow-600"
                        : selectedBasket.status === "ACTIVE"
                          ? "text-green-600"
                          : "text-gray-600"
                    }`}
                  >
                    {selectedBasket.status}
                  </p>
                </div>
              </div>

              {selectedBasket.configName && (
                <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <p className="text-sm font-bold text-purple-900">
                    Cấu hình: {selectedBasket.configName}
                  </p>
                </div>
              )}

              <div>
                <h4 className="mb-4 text-lg font-bold text-tet-primary">
                  Sản phẩm trong giỏ
                </h4>
                {selectedBasket.productDetails &&
                selectedBasket.productDetails.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBasket.productDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-all hover:shadow-md"
                      >
                        {detail.imageUrl ? (
                          <img
                            src={detail.imageUrl}
                            alt={detail.productname}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
                            <Gift size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-bold text-tet-primary">
                            {detail.productname}
                          </h5>
                          <p className="text-xs text-gray-500">
                            SKU: {detail.sku || "N/A"}
                          </p>
                          <div className="mt-1 flex gap-4">
                            <span className="text-xs text-gray-600">
                              Giá:{" "}
                              <span className="font-bold text-tet-accent">
                                {detail.price.toLocaleString()}đ
                              </span>
                            </span>
                            <span className="text-xs text-gray-600">
                              Trọng lượng:{" "}
                              <span className="font-bold">{detail.unit}g</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="mb-1 text-xs text-gray-500">
                            Số lượng
                          </p>
                          <p className="text-2xl font-bold text-tet-primary">
                            x{detail.quantity}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">
                            ={" "}
                            <span className="font-bold text-blue-600">
                              {detail.subtotal.toLocaleString()}đ
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <Gift size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Chưa có sản phẩm trong giỏ</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 gap-3 border-t border-gray-100 p-6">
              <button
                onClick={handleCloseDetailsModal}
                className="flex-1 rounded-full border border-gray-300 px-6 py-3 font-bold text-gray-600 transition-all hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleCloseDetailsModal();
                  handleEditBasket(selectedBasket);
                }}
                className="flex-1 rounded-full bg-linear-to-r from-tet-primary to-tet-accent px-6 py-3 font-bold text-white transition-all hover:shadow-lg"
              >
                Chỉnh sửa giỏ quà
              </button>
              <button
                onClick={() => {
                  alert("Chức năng thanh toán đang được phát triển");
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-linear-to-r from-green-500 to-emerald-600 px-6 py-3 font-bold text-white transition-all hover:shadow-lg"
              >
                <ShoppingCart size={16} />
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
