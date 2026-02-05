import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Gift, X, Eye, Copy, Save, Trash2, Package } from "lucide-react";
import ProductHero from "../components/ProductHero";
import ProductSidebar from "../components/ProductSidebar";
import ProductCard from "../components/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productService, type Product, type CloneBasketRequest, type ProductDetailRequest, type UpdateComboProductRequest } from "@/api/productService";
import { configService, type ProductConfig } from "@/api/configService";

interface ProductDetailWithChild extends ProductDetailRequest {
  childProduct?: Product;
}

export default function ProductPage() {
  const [templates, setTemplates] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Clone modal state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneProduct, setCloneProduct] = useState<Product | null>(null);
  const [clonedBasketId, setClonedBasketId] = useState<number | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<ProductConfig | null>(null);
  const [customName, setCustomName] = useState("");
  const [productDetails, setProductDetails] = useState<ProductDetailWithChild[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await productService.templates.getAll();
        setTemplates(response.data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleViewDetails = (template: Product) => {
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const handleOpenCloneModal = async (template: Product) => {
    console.log('=== OPEN CLONE MODAL ===');
    try {
      setShowCloneModal(true);
      setCloning(true);
      setCloneProduct(template);
      setClonedBasketId(null);
      
      // Set initial form data from template
      setCustomName(template.productname + ' (Bản sao)' || '');
      
      // Set product details from template
      const details: ProductDetailWithChild[] = (template.productDetails || []).map(pd => ({
        productid: pd.productid,
        quantity: pd.quantity,
        childProduct: pd.childProduct
      }));
      setProductDetails(details);
      
      // Load ProductConfig if available
      if (template.configid) {
        console.log('Loading config:', template.configid);
        const configs = await configService.getAllConfig();
        const config = configs.find(c => c.configid === template.configid);
        setSelectedConfig(config || null);
        console.log('Config loaded:', config);
      }
      
      // Fetch available products for adding more
      console.log('Fetching products...');
      const productsResponse = await productService.getAll();
      const products = productsResponse.data || [];
      const filtered = products.filter((p: Product) => 
        p.status === 'ACTIVE' && !p.configid
      );
      setAvailableProducts(filtered);
      console.log('Available products:', filtered.length);
      
      console.log('✅ Clone modal ready');
    } catch (error: any) {
      console.error('❌ Error loading clone modal data:', error);
      alert('Không thể tải dữ liệu. Vui lòng thử lại.');
      setShowCloneModal(false);
    } finally {
      setCloning(false);
      console.log('=== END OPEN CLONE MODAL ===');
    }
  };

  const handleCloseCloneModal = () => {
    setShowCloneModal(false);
    setCloneProduct(null);
    setClonedBasketId(null);
    setSelectedConfig(null);
    setCustomName('');
    setProductDetails([]);
    setAvailableProducts([]);
  };

  const handleAddProduct = (product: Product) => {
    if (productDetails.some(pd => pd.productid === product.productid)) {
      alert('Sản phẩm này đã có trong giỏ');
      return;
    }
    
    const newDetail: ProductDetailWithChild = {
      productid: product.productid,
      quantity: 1,
      childProduct: product
    };
    
    setProductDetails([...productDetails, newDetail]);
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updated = [...productDetails];
    updated[index].quantity = newQuantity;
    setProductDetails(updated);
  };

  const handleRemoveProductDetail = (index: number) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ?')) return;
    
    const updated = productDetails.filter((_, i) => i !== index);
    setProductDetails(updated);
  };

  // Validate productDetails against selectedConfig
  const validateProductConfig = (): { valid: boolean; message: string } => {
    if (!selectedConfig || !selectedConfig.configDetails || selectedConfig.configDetails.length === 0) {
      return { valid: true, message: '' };
    }

    // Group products by category
    const categoryCount: Record<number, number> = {};
    productDetails.forEach(pd => {
      const categoryId = pd.childProduct?.categoryid;
      if (categoryId) {
        categoryCount[categoryId] = (categoryCount[categoryId] || 0) + (pd.quantity || 0);
      }
    });

    // Check each config detail requirement
    const errors: string[] = [];
    selectedConfig.configDetails.forEach(detail => {
      const required = detail.quantity;
      const actual = categoryCount[detail.categoryid] || 0;
      
      if (actual < required) {
        errors.push(`${detail.categoryName}: Cần ${required} món, hiện tại ${actual} món`);
      } else if (actual > required) {
        errors.push(`${detail.categoryName}: Vượt quá ${required} món, hiện tại ${actual} món`);
      }
    });

    if (errors.length > 0) {
      return {
        valid: false,
        message: '❌ Giỏ quà không đúng cấu hình:\n' + errors.join('\n')
      };
    }

    return { valid: true, message: '✅ Giỏ quà đã đúng cấu hình' };
  };

  const handleCloneTemplate = async () => {
    console.log('=== CLONE TEMPLATE ===');
    console.log('Template ID:', cloneProduct?.productid);
    console.log('Custom Name:', customName);
    
    if (!customName.trim()) {
      console.warn('Validation failed: Custom name is empty');
      alert('Vui lòng nhập tên giỏ quà');
      return;
    }

    try {
      setCloning(true);
      const token = localStorage.getItem('token') || '';
      
      if (!token) {
        alert('Vui lòng đăng nhập để clone giỏ quà');
        return;
      }

      const cloneRequest: CloneBasketRequest = {
        customName: customName
      };

      console.log('Clone payload:', JSON.stringify(cloneRequest, null, 2));
      console.log('Calling API: POST /products/templates/' + cloneProduct!.productid + '/clone');
      
      const response = await productService.templates.clone(
        cloneProduct!.productid!,
        cloneRequest,
        token
      );
      
      console.log('Clone response:', response);
      console.log('✅ Clone successful');
      
      // Store cloned basket ID and product details for editing
      const clonedBasket = response.data;
      setClonedBasketId(clonedBasket.productid);
      
      // Load product details from cloned basket
      if (clonedBasket.productDetails) {
        const details: ProductDetailWithChild[] = clonedBasket.productDetails.map((pd: any) => ({
          productid: pd.productid,
          quantity: pd.quantity,
          childProduct: pd.childProduct
        }));
        setProductDetails(details);
      }
      
      alert('✅ Clone thành công! Bạn có thể tùy chỉnh sản phẩm trong giỏ.');
      // Keep modal open for editing
    } catch (error: any) {
      console.error('❌ Error cloning template:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.response?.data?.message || error.message);
      
      alert(error.response?.data?.message || error.message || 'Không thể clone giỏ quà');
    } finally {
      setCloning(false);
      console.log('=== END CLONE TEMPLATE ===');
    }
  };

  const handleSaveCustomBasket = async () => {
    console.log('=== SAVE CUSTOM BASKET ===');
    console.log('Basket ID:', clonedBasketId);
    console.log('Custom Name:', customName);
    console.log('Product Details:', productDetails);
    
    if (!clonedBasketId) {
      alert('Vui lòng clone template trước khi lưu');
      return;
    }

    if (!customName.trim()) {
      alert('Vui lòng nhập tên giỏ quà');
      return;
    }

    if (productDetails.length === 0) {
      alert('Giỏ quà phải có ít nhất 1 sản phẩm');
      return;
    }

    // Validate product config
    const validation = validateProductConfig();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';
      
      const updateData: UpdateComboProductRequest = {
        productname: customName,
        status: 'ACTIVE',
        productDetails: productDetails.map(pd => ({
          productid: pd.productid,
          quantity: pd.quantity
        }))
      };

      console.log('Update payload:', JSON.stringify(updateData, null, 2));
      console.log('Calling API: PUT /products/' + clonedBasketId + '/custom');
      
      await productService.updateCustom(clonedBasketId, updateData, token);
      
      console.log('✅ Update successful');
      
      alert('Lưu giỏ quà thành công!');
      handleCloseCloneModal();
      setShowDetailsModal(false);
    } catch (error: any) {
      console.error('❌ Error updating basket:', error);
      alert(error.response?.data?.message || error.message || 'Không thể cập nhật giỏ quà');
    } finally {
      setSaving(false);
      console.log('=== END SAVE CUSTOM BASKET ===');
    }
  };
  return (
    <div className="min-h-screen bg-white">
      <ProductHero />
      <div className="container mx-auto px-6 py-12 flex flex-col lg:flex-row gap-10">
        {/* Sidebar: Ẩn trên mobile, hiện trên desktop */}
        <div className="hidden lg:block w-72 shrink-0">
          <ProductSidebar />
        </div>

        {/* Nội dung chính */}
        <div className="flex-1 space-y-8">
          <div className="flex justify-between items-center border-b pb-6">
            <p className="text-sm font-bold text-gray-500 italic">
              Hiển thị {templates.length} sản phẩm
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-tet-primary hidden sm:block">
                Sắp xếp:
              </span>

              <Select defaultValue="popular">
                <SelectTrigger className="w-[180px] rounded-xl border-gray-200 focus:ring-tet-secondary bg-white shadow-sm">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="popular">Phổ biến nhất</SelectItem>
                  <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                  <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-tet-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải sản phẩm...</p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-20">
              <Gift size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Chưa có sản phẩm nào</p>
            </div>
          ) : (
            /* Grid sản phẩm */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map((template) => (
                <div key={template.productid} className="group">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-tet-secondary to-tet-primary/10">
                      {template.imageUrl ? (
                        <img
                          src={template.imageUrl}
                          alt={template.productname}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift size={64} className="text-tet-primary/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-tet-primary mb-2 line-clamp-2 min-h-[3.5rem]">
                        {template.productname}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        {template.description || 'Giỏ quà Tết cao cấp'}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-2xl font-bold text-tet-accent">
                            {(template.price || 0).toLocaleString()}đ
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Số món:</p>
                          <p className="text-lg font-bold text-tet-primary">
                            {template.productDetails?.length || 0}
                          </p>
                        </div>
                      </div>

                      {/* Button xem chi tiết */}
                      <button
                        onClick={() => handleViewDetails(template)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-tet-primary to-tet-accent text-white rounded-lg font-bold hover:shadow-lg transition-all"
                      >
                        <Eye size={16} />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedTemplate && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-tet-primary to-tet-accent p-6 text-white rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedTemplate.productname}</h3>
                  <p className="text-sm opacity-90">{selectedTemplate.description || 'Chưa có mô tả'}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
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
                  <p className="text-xs text-gray-600 mb-1">Giá tiền</p>
                  <p className="text-lg font-bold text-blue-600">{(selectedTemplate.price || 0).toLocaleString()}đ</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">Trọng lượng</p>
                  <p className="text-lg font-bold text-green-600">{selectedTemplate.unit || 0}g</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">Số món</p>
                  <p className="text-lg font-bold text-purple-600">{selectedTemplate.productDetails?.length || 0}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">Tồn kho</p>
                  <p className="text-lg font-bold text-amber-600">{selectedTemplate.totalQuantity || 0}</p>
                </div>
              </div>

              {/* Product Details */}
              <div>
                <h4 className="text-lg font-bold text-tet-primary mb-4">Sản phẩm trong giỏ</h4>
                {selectedTemplate.productDetails && selectedTemplate.productDetails.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTemplate.productDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-all"
                      >
                        {detail.childProduct?.imageUrl ? (
                          <img
                            src={detail.childProduct.imageUrl}
                            alt={detail.childProduct.productname}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Gift size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-bold text-tet-primary">
                            {detail.childProduct?.productname || 'Unknown'}
                          </h5>
                          <p className="text-xs text-gray-500">
                            SKU: {detail.childProduct?.sku || 'N/A'}
                          </p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-600">
                              Giá: <span className="font-bold text-tet-accent">{(detail.childProduct?.price || 0).toLocaleString()}đ</span>
                            </span>
                            <span className="text-xs text-gray-600">
                              Stock: <span className="font-bold">{detail.childProduct?.totalQuantity || 0}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Số lượng</p>
                          <p className="text-2xl font-bold text-tet-primary">x{detail.quantity || 1}</p>
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
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 rounded-full font-bold hover:bg-gray-50 transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleOpenCloneModal(selectedTemplate);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                Clone & Tùy chỉnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      {showCloneModal && cloneProduct && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={handleCloseCloneModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-3xl">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Copy size={20} />
                Clone & Tùy chỉnh giỏ quà
              </h2>
              <button
                onClick={handleCloseCloneModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={cloning}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Info */}
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">
                      📋 Giỏ quà gốc
                    </h4>
                    <p className="text-sm text-blue-800">{cloneProduct.productname}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Giá: {(cloneProduct.price || 0).toLocaleString()}đ • {cloneProduct.productDetails?.length || 0} món
                    </p>
                  </div>

                  {/* ProductConfig validation display */}
                  {selectedConfig && selectedConfig.configDetails && selectedConfig.configDetails.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                        <Package size={16} />
                        Quy tắc chọn sản phẩm theo cấu hình:
                      </h4>
                      <div className="space-y-1.5">
                        {selectedConfig.configDetails.map((detail, idx) => {
                          // Count current products in this category
                          const currentCount = productDetails
                            .filter(pd => pd.childProduct?.categoryid === detail.categoryid)
                            .reduce((sum, pd) => sum + (pd.quantity || 0), 0);
                          const required = detail.quantity;
                          const isCorrect = currentCount === required;
                          const isOver = currentCount > required;
                          const isUnder = currentCount < required;

                          return (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-purple-800 font-medium">{detail.categoryName}</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  isCorrect ? 'bg-green-500 text-white' : 
                                  isOver ? 'bg-red-500 text-white' : 
                                  'bg-gray-300 text-gray-700'
                                }`}>
                                  {currentCount}/{required}
                                </span>
                                {isCorrect && <span className="text-green-600">✓</span>}
                                {isOver && <span className="text-red-600">⚠</span>}
                                {isUnder && <span className="text-gray-400">○</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-purple-700 mt-2 italic">
                        💡 Chọn sản phẩm theo đúng số lượng mỗi danh mục
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên giỏ quà tùy chỉnh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nhập tên giỏ quà của bạn"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tổng sản phẩm:</span>
                      <span className="font-medium">{productDetails.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tổng số lượng:</span>
                      <span className="font-medium">
                        {productDetails.reduce((sum, pd) => sum + (pd.quantity || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tổng giá trị:</span>
                      <span className="font-medium text-purple-600">
                        {productDetails.reduce((sum, pd) => 
                          sum + ((pd.quantity || 0) * (pd.childProduct?.price || 0)), 0
                        ).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Thêm sản phẩm khác</h4>
                    <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2 space-y-2">
                      {availableProducts.length === 0 ? (
                        <p className="text-center text-gray-500 py-4 text-sm">Không có sản phẩm khả dụng</p>
                      ) : (
                        availableProducts.slice(0, 10).map(product => (
                          <div 
                            key={product.productid}
                            onClick={() => handleAddProduct(product)}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer rounded border border-transparent hover:border-purple-300 transition-all"
                          >
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.productname}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <Gift size={16} className="text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.productname}</p>
                              <p className="text-xs text-gray-500">
                                {product.price?.toLocaleString('vi-VN')}đ
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Product List */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Sản phẩm trong giỏ ({productDetails.length})
                  </h3>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {productDetails.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Chưa có sản phẩm nào</p>
                      </div>
                    ) : (
                      productDetails.map((detail, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                          <div className="flex gap-4">
                            {detail.childProduct?.imageUrl && (
                              <img 
                                src={detail.childProduct.imageUrl} 
                                alt={detail.childProduct.productname}
                                className="w-20 h-20 object-cover rounded"
                              />
                            )}
                            
                            <div className="flex-1">
                              <p className="font-medium mb-1">{detail.childProduct?.productname}</p>
                              <p className="text-sm text-gray-600 mb-2">
                                Đơn giá: {detail.childProduct?.price?.toLocaleString('vi-VN')}đ
                              </p>
                              
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Số lượng:</label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleQuantityChange(index, (detail.quantity || 1) - 1)}
                                    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                                    disabled={(detail.quantity || 1) <= 1}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={detail.quantity || 1}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      handleQuantityChange(index, val);
                                    }}
                                    className="w-16 px-2 py-1 border rounded text-center"
                                    min="1"
                                  />
                                  <button
                                    onClick={() => handleQuantityChange(index, (detail.quantity || 1) + 1)}
                                    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              
                              <p className="text-sm font-medium text-purple-600 mt-2">
                                Thành tiền: {((detail.quantity || 0) * (detail.childProduct?.price || 0)).toLocaleString('vi-VN')}đ
                              </p>
                            </div>

                            <button
                              onClick={() => handleRemoveProductDetail(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex justify-end gap-3 pt-6 border-t mt-6">
                <button
                  onClick={handleCloseCloneModal}
                  disabled={cloning || saving}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                {!clonedBasketId ? (
                  <button
                    onClick={handleCloneTemplate}
                    disabled={cloning}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {cloning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang clone...
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Clone giỏ quà
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSaveCustomBasket}
                    disabled={saving || productDetails.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu giỏ quà
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
