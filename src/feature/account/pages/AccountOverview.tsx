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
  // 1. Khởi tạo State để quản lý dữ liệu người dùng
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State cho custom baskets
  const [customBaskets, setCustomBaskets] = useState<CustomerBasketDto[]>([]);
  const [loadingBaskets, setLoadingBaskets] = useState(false);
  const [showBasketsModal, setShowBasketsModal] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState<CustomerBasketDto | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 2. Fetch dữ liệu từ API khi component được mount
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

    fetchProfile();
  }, []);

  // Fetch custom baskets
  const fetchCustomBaskets = async () => {
    try {
      setLoadingBaskets(true);
      const token = localStorage.getItem('token') || '';
      const response = await productService.getMyBaskets(token);
      console.log('My baskets response:', response);
      setCustomBaskets(response.data || []);
    } catch (error) {
      console.error('Error fetching custom baskets:', error);
    } finally {
      setLoadingBaskets(false);
    }
  };

  const handleOpenBasketsModal = async () => {
    setShowBasketsModal(true);
    await fetchCustomBaskets();
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

  // Xóa giỏ quà
  const handleDeleteBasket = async (productId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giỏ quà này không?')) return;
    
    console.log('=== DELETE CUSTOM BASKET ===');
    console.log('Product ID:', productId);
    
    try {
      const token = localStorage.getItem('token') || '';
      console.log('Calling API: DELETE /products/' + productId);
      
      await productService.delete(productId, token);
      
      console.log('✅ Basket deleted successfully');
      alert('Đã xóa giỏ quà thành công');
      
      // Refresh danh sách giỏ quà
      await fetchCustomBaskets();
    } catch (error: any) {
      console.error('❌ Error deleting basket:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.response?.data?.message || error.message);
      
      alert(error.response?.data?.message || error.message || 'Không thể xóa giỏ quà');
    } finally {
      console.log('=== END DELETE BASKET ===');
    }
  };

  // Chỉnh sửa giỏ quà - navigate đến trang edit
  const handleEditBasket = (basket: CustomerBasketDto) => {
    console.log('=== NAVIGATE TO EDIT BASKET ===');
    console.log('Basket:', basket);
    
    // Navigate đến trang chỉnh sửa với productId
    // Bạn có thể tạo route /account/baskets/:id/edit
    // Hoặc navigate đến /products với state để mở modal edit
    navigate(`/account/baskets/${basket.productid}/edit`, { 
      state: { basket } 
    });
  };

  // 3. Hiển thị trạng thái loading trong khi chờ API
  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-tet-primary">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-serif italic text-sm">
          Đang lấy thông tin quà Tết của bạn...
        </p>
      </div>
    );
  }

  // 4. Nếu không có profile (lỗi hệ thống)
  if (!profile) {
    return (
      <div className="text-center py-20 text-red-500">
        Không thể tải thông tin tài khoản. Vui lòng thử lại sau.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Thông tin người dùng (REAL DATA) */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-tet-secondary overflow-hidden shadow-lg bg-gray-50">
            <img
              src={`https://ui-avatars.com/api/?name=${profile.fullName || profile.username}&background=random&size=150`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              {profile.fullName || "Chưa cập nhật tên"}
            </h2>
            <p className="text-sm text-gray-500 italic">{profile.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
              <span className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold border border-green-100">
                <ShieldCheck size={12} /> Email đã xác thực
              </span>
              {profile.status === "ACTIVE" && (
                <span className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold border border-green-100">
                  <ShieldCheck size={12} /> Tài khoản hoạt động
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/account/profile")}
          className="bg-tet-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-tet-accent transition-all shadow-md active:scale-95"
        >
          Chỉnh sửa hồ sơ
        </button>
      </section>

      {/* 2. Hạng thành viên & Số dư ví (REAL DATA) */}
      <section className="bg-[#FBF5E8] p-6 rounded-3xl border border-tet-secondary/30 flex justify-between items-center group cursor-pointer hover:shadow-md transition-all">
        <div>
          <p className="text-xs text-tet-primary/60 font-bold uppercase tracking-widest mb-1">
            Hạng thành viên
          </p>
          <h3 className="text-3xl font-serif font-black text-tet-primary uppercase">
            {profile.role === "CUSTOMER" ? "Bạc" : profile.role}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-tet-primary/60 font-bold uppercase tracking-widest mb-1">
            Số dư ví Happybox
          </p>
          <p className="text-3xl font-bold text-tet-accent">
            {profile.walletBalance.toLocaleString()}{" "}
            <span className="text-sm font-medium">VNĐ</span>
          </p>
        </div>
      </section>

      {/* 3. Truy cập nhanh (Giữ nguyên giao diện của bạn) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Thông tin cá nhân", icon: <User size={24} />, onClick: () => navigate('/account/profile') },
          { label: "Lịch sử đơn hàng", icon: <ClipboardList size={24} />, onClick: () => navigate('/account/orders') },
          { label: "Quản lý địa chỉ", icon: <MapPin size={24} />, onClick: () => navigate('/account/addresses') },
          { label: "Tạo hộp quà Tết", icon: <Gift size={24} />, onClick: handleOpenBasketsModal },
        ].map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col items-center gap-3 hover:border-tet-secondary hover:shadow-lg transition-all cursor-pointer text-center"
          >
            <div className="text-tet-accent">{item.icon}</div>
            <p className="text-xs font-bold text-tet-primary">{item.label}</p>
          </div>
        ))}
      </div>

      {/* 4. Đơn hàng gần đây (Mock Data tạm thời - Chờ API Order) */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-serif font-bold text-tet-primary">
            Đơn hàng gần đây
          </h3>
          <button className="text-tet-accent text-sm font-bold hover:underline">
            Xem tất cả
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-400 text-center py-4 italic">
            Chức năng xem đơn hàng đang được cập nhật...
          </p>
        </div>
      </section>

      {/* Modal: Danh sách giỏ quà tùy chỉnh */}
      {showBasketsModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={handleCloseBasketsModal}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-tet-primary to-tet-accent p-6 text-white rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Giỏ quà tùy chỉnh của bạn</h3>
                  <p className="text-sm opacity-90">Quản lý các giỏ quà đã tạo</p>
                </div>
                <button
                  onClick={handleCloseBasketsModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loadingBaskets ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-tet-accent" />
                    <p className="text-gray-500">Đang tải giỏ quà...</p>
                  </div>
                </div>
              ) : customBaskets.length === 0 ? (
                <div className="text-center py-20">
                  <Gift size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Chưa có giỏ quà tùy chỉnh nào</p>
                  <p className="text-gray-400 text-sm">Hãy tạo giỏ quà từ template để bắt đầu!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customBaskets.map((basket) => (
                    <div
                      key={basket.productid}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                    >
                      {/* Image */}
                      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-tet-secondary to-tet-primary/10">
                        {basket.imageUrl ? (
                          <img
                            src={basket.imageUrl}
                            alt={basket.productname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gift size={48} className="text-tet-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                            basket.status === 'DRAFT' ? 'bg-yellow-500 text-white' :
                            basket.status === 'ACTIVE' ? 'bg-green-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {basket.status}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h4 className="text-lg font-bold text-tet-primary mb-2 line-clamp-2 min-h-[3.5rem]">
                          {basket.productname}
                        </h4>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                          {basket.description || 'Giỏ quà tùy chỉnh'}
                        </p>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-600">Tổng giá</p>
                            <p className="text-sm font-bold text-blue-600">{basket.totalPrice.toLocaleString()}đ</p>
                          </div>
                          <div className="bg-purple-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-600">Số món</p>
                            <p className="text-sm font-bold text-purple-600">{basket.productDetails?.length || 0}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewBasketDetails(basket)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-all text-sm"
                          >
                            <Eye size={14} />
                            Xem
                          </button>
                          <button
                            onClick={() => handleEditBasket(basket)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg font-bold hover:bg-green-100 transition-all text-sm"
                          >
                            <Edit size={14} />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteBasket(basket.productid!)}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            // TODO: implement payment logic
                            alert('Chức năng thanh toán đang được phát triển');
                          }}
                          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:shadow-lg transition-all text-sm"
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

            {/* Modal Footer */}
            <div className="flex-shrink-0 border-t border-gray-100 p-6 flex gap-3">
              <button
                onClick={handleCloseBasketsModal}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 rounded-full font-bold hover:bg-gray-50 transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => navigate('/products')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-tet-primary to-tet-accent text-white rounded-full font-bold hover:shadow-lg transition-all"
              >
                Tạo giỏ quà mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Chi tiết giỏ quà */}
      {showDetailsModal && selectedBasket && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={handleCloseDetailsModal}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-tet-primary to-tet-accent p-6 text-white rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedBasket.productname}</h3>
                  <p className="text-sm opacity-90">{selectedBasket.description || 'Giỏ quà tùy chỉnh'}</p>
                </div>
                <button
                  onClick={handleCloseDetailsModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body - Ẩn scrollbar */}
            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">Tổng giá</p>
                  <p className="text-lg font-bold text-blue-600">{selectedBasket.totalPrice.toLocaleString()}đ</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">Trọng lượng</p>
                  <p className="text-lg font-bold text-green-600">{selectedBasket.totalWeight}g</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">Số món</p>
                  <p className="text-lg font-bold text-purple-600">{selectedBasket.productDetails?.length || 0}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">Trạng thái</p>
                  <p className={`text-lg font-bold ${
                    selectedBasket.status === 'DRAFT' ? 'text-yellow-600' :
                    selectedBasket.status === 'ACTIVE' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {selectedBasket.status}
                  </p>
                </div>
              </div>

              {/* Config Info */}
              {selectedBasket.configName && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-bold text-purple-900">
                    📦 Cấu hình: {selectedBasket.configName}
                  </p>
                </div>
              )}

              {/* Product Details */}
              <div>
                <h4 className="text-lg font-bold text-tet-primary mb-4">Sản phẩm trong giỏ</h4>
                {selectedBasket.productDetails && selectedBasket.productDetails.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBasket.productDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-all"
                      >
                        {detail.imageUrl ? (
                          <img
                            src={detail.imageUrl}
                            alt={detail.productname}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Gift size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-bold text-tet-primary">
                            {detail.productname}
                          </h5>
                          <p className="text-xs text-gray-500">
                            SKU: {detail.sku || 'N/A'}
                          </p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-600">
                              Giá: <span className="font-bold text-tet-accent">{detail.price.toLocaleString()}đ</span>
                            </span>
                            <span className="text-xs text-gray-600">
                              Trọng lượng: <span className="font-bold">{detail.unit}g</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Số lượng</p>
                          <p className="text-2xl font-bold text-tet-primary">x{detail.quantity}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            = <span className="font-bold text-blue-600">{detail.subtotal.toLocaleString()}đ</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Gift size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Chưa có sản phẩm trong giỏ</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 border-t border-gray-100 p-6 flex gap-3">
              <button
                onClick={handleCloseDetailsModal}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 rounded-full font-bold hover:bg-gray-50 transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleCloseDetailsModal();
                  handleEditBasket(selectedBasket);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-tet-primary to-tet-accent text-white rounded-full font-bold hover:shadow-lg transition-all"
              >
                Chỉnh sửa giỏ quà
              </button>
              <button
                onClick={() => {
                  // TODO: implement payment logic
                  alert('Chức năng thanh toán đang được phát triển');
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
