import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Gift, Save, X, Trash2, Plus, Package } from "lucide-react";
import { productService, type Product, type UpdateComboProductRequest, type ProductDetailRequest } from "@/api/productService";
import { categoryService, type Category } from "@/api/categoryService";
import { configService, type ProductConfig } from "@/api/configService";

interface ProductDetailWithChild extends ProductDetailRequest {
  childProduct?: Product;
}

export default function EditBasket() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [productname, setProductname] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [productDetails, setProductDetails] = useState<ProductDetailWithChild[]>([]);
  const [productConfig, setProductConfig] = useState<ProductConfig | null>(null);

  // Available products for adding
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  useEffect(() => {
    fetchBasketData();
  }, [id]);

  const fetchBasketData = async () => {
    console.log('=== FETCH BASKET FOR EDIT ===');
    console.log('Basket ID:', id);

    try {
      setLoading(true);

      // Fetch basket data
      console.log('Calling API: GET /products/custom/' + id);
      const response = await productService.getCustomProductById(parseInt(id!));
      const data = response.data as Product;

      console.log('Fetched basket data:', data);
      setProductname(data.productname || "");
      setDescription(data.description || "");
      setImageUrl(data.imageUrl || "");
      setStatus(data.status || "DRAFT");

      const details: ProductDetailWithChild[] = (data.productDetails || []).map(pd => ({
        productid: pd.productid,
        quantity: pd.quantity,
        childProduct: pd.childProduct
      }));
      setProductDetails(details);

      // Fetch config if exists
      if (data.configid) {
        console.log('Fetching config ID:', data.configid);
        try {
          const configData = await configService.getById(data.configid);
          setProductConfig(configData);
          console.log('Config loaded:', configData?.configname);
        } catch (configError: any) {
          console.warn('⚠️ Could not load config:', configError.response?.status, configError.message);
          console.warn('Continuing without config validation...');
          // Don't block the basket load if config fails
        }
      }

      // Fetch categories
      console.log('Fetching categories...');
      const categoriesResponse = await categoryService.getAll();
      const cats = categoriesResponse.data || [];
      setCategories(cats);
      console.log('Categories loaded:', cats.length);

      // Fetch available products
      console.log('Fetching products...');
      const productsResponse = await productService.getAll();
      const products = productsResponse.data || [];
      const filtered = products.filter((p: Product) =>
        p.status === 'ACTIVE' && !p.configid
      );
      setAvailableProducts(filtered);
      console.log('Available products:', filtered.length);

      console.log('✅ Basket loaded successfully');
    } catch (error: any) {
      console.error('❌ Error fetching basket:', error);
      console.error('Error response:', error.response);
      alert('Không thể tải thông tin giỏ quà');
      navigate('/account/overview');
    } finally {
      setLoading(false);
    }
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

  const validateProductConfig = (): { valid: boolean; message: string } => {
    if (!productConfig || !productConfig.configDetails || productConfig.configDetails.length === 0) {
      return { valid: true, message: '' };
    }

    const categoryCount: Record<number, number> = {};
    productDetails.forEach(pd => {
      const categoryId = pd.childProduct?.categoryid;
      if (categoryId) {
        categoryCount[categoryId] = (categoryCount[categoryId] || 0) + (pd.quantity || 0);
      }
    });

    const errors: string[] = [];
    productConfig.configDetails.forEach(detail => {
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

  const handleSave = async () => {
    console.log('=== START UPDATE BASKET ===');
    console.log('Basket ID:', id);
    console.log('Product Name:', productname);
    console.log('Description:', description);
    console.log('Image URL:', imageUrl);
    console.log('Status:', status);
    console.log('Product Details Count:', productDetails.length);

    if (!productname.trim()) {
      alert('Vui lòng nhập tên giỏ quà');
      return;
    }

    if (productDetails.length === 0) {
      alert('Giỏ quà phải có ít nhất 1 sản phẩm');
      return;
    }

    if (productConfig) {
      const validation = validateProductConfig();
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';

      const updateData: UpdateComboProductRequest = {
        productname,
        category: "",  // Empty for baskets
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        status,
        productDetails: productDetails.map(pd => ({
          productid: pd.productid,
          quantity: pd.quantity
        }))
      };

      console.log('=== REQUEST DETAILS ===');
      console.log('Method: PUT');
      console.log('Endpoint: /products/' + id + '/custom');
      console.log('Update payload:', JSON.stringify(updateData, null, 2));

      const response = await productService.updateCustom(parseInt(id!), updateData, token);

      console.log('=== RESPONSE DETAILS ===');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('✅ Update successful');

      alert('Cập nhật giỏ quà thành công');
      navigate('/account/overview');
    } catch (error: any) {
      console.error('=== UPDATE ERROR DETAILS ===');
      console.error('❌ Error updating basket');
      console.error('Error response:', error.response);
      console.error('Error message:', error.response?.data?.message || error.message);
      console.error('Full error object:', JSON.stringify(error.response?.data, null, 2));

      alert(error.response?.data?.message || error.message || 'Không thể cập nhật giỏ quà');
    } finally {
      setSaving(false);
      console.log('=== END UPDATE BASKET ===');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tet-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải giỏ quà...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Chỉnh sửa giỏ quà
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tùy chỉnh giỏ quà của bạn
            </p>
          </div>
          <button
            onClick={() => navigate('/account/overview')}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-600 rounded-full font-bold hover:bg-gray-50 transition-all"
          >
            <X size={20} />
            Hủy
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên giỏ quà <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productname}
                onChange={(e) => setProductname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên giỏ quà"
              />
            </div>

            {imageUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Hình ảnh giỏ quà</p>
                <img
                  src={imageUrl}
                  alt="Basket preview"
                  className="w-full h-48 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image';
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
              </select>
            </div>

            {/* Product Config Info */}
            {productConfig && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Package size={16} />
                  Cấu hình giỏ quà: {productConfig.configname}
                </h4>
                {productConfig.suitablesuggestion && (
                  <p className="text-xs text-blue-800 mb-2">{productConfig.suitablesuggestion}</p>
                )}
                {productConfig.totalunit && (
                  <p className="text-xs text-blue-700 mb-2">
                    Trọng lượng tối đa: <span className="font-bold">{productConfig.totalunit}g</span>
                  </p>
                )}
                {productConfig.configDetails && productConfig.configDetails.length > 0 && (
                  <>
                    <div className="border-t border-blue-200 my-2 pt-2">
                      <p className="text-xs font-semibold text-blue-900 mb-1.5">Yêu cầu theo danh mục:</p>
                      <div className="space-y-1.5">
                        {productConfig.configDetails.map((detail, idx) => {
                          const currentCount = productDetails
                            .filter(pd => pd.childProduct?.categoryid === detail.categoryid)
                            .reduce((sum, pd) => sum + (pd.quantity || 0), 0);
                          const required = detail.quantity;
                          const isCorrect = currentCount === required;
                          const isOver = currentCount > required;
                          const isUnder = currentCount < required;

                          return (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-blue-800 font-medium">{detail.categoryName}:</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${
                                  isCorrect ? 'text-green-600' :
                                  isOver ? 'text-red-600' :
                                  'text-orange-600'
                                }`}>
                                  {currentCount}/{required}
                                </span>
                                {isCorrect && <span className="text-green-600">✓</span>}
                                {isOver && <span className="text-red-600">↑</span>}
                                {isUnder && <span className="text-orange-600">↓</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-blue-700 mt-2 italic">
                        💡 {validateProductConfig().valid ? '✅ Giỏ quà đã đúng cấu hình' : '⚠️ Cần điều chỉnh số lượng'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

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
                <span className="font-medium text-blue-600">
                  {productDetails.reduce((sum, pd) =>
                    sum + ((pd.quantity || 0) * (pd.childProduct?.price || 0)), 0
                  ).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Product Selection & List */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">
                Chọn sản phẩm thêm vào giỏ
              </h3>

              {/* Search and Category Filter */}
              <div className="space-y-2 mb-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value={0}>Tất cả danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.categoryid} value={cat.categoryid}>
                      {cat.categoryname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-h-[150px] overflow-y-auto border rounded-lg p-2 space-y-2">
                {availableProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Không có sản phẩm khả dụng</p>
                ) : (
                  <>
                    {availableProducts
                      .filter(product => {
                        if (productSearch) {
                          const searchLower = productSearch.toLowerCase();
                          if (!product.productname?.toLowerCase().includes(searchLower)) {
                            return false;
                          }
                        }
                        if (selectedCategory && selectedCategory !== 0) {
                          if (product.categoryid !== selectedCategory) {
                            return false;
                          }
                        }
                        return true;
                      })
                      .map(product => (
                        <div
                          key={product.productid}
                          onClick={() => handleAddProduct(product)}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer rounded border border-transparent hover:border-blue-300 transition-all"
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.productname}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <Gift size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.productname}</p>
                            <p className="text-xs text-gray-500">
                              {product.price?.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                          <Plus size={16} className="text-blue-600" />
                        </div>
                      ))}
                    {availableProducts.filter(product => {
                      if (productSearch) {
                        const searchLower = productSearch.toLowerCase();
                        if (!product.productname?.toLowerCase().includes(searchLower)) return false;
                      }
                      if (selectedCategory && selectedCategory !== 0) {
                        if (product.categoryid !== selectedCategory) return false;
                      }
                      return true;
                    }).length === 0 && (
                      <p className="text-center text-gray-500 py-4 text-sm">
                        Không tìm thấy sản phẩm phù hợp
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Sản phẩm trong giỏ ({productDetails.length})
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {productDetails.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có sản phẩm nào</p>
                    <p className="text-xs mt-1">Nhấp vào sản phẩm bên trên để thêm</p>
                  </div>
                ) : (
                  productDetails.map((detail, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
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

                          <p className="text-sm font-medium text-blue-600 mt-2">
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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <button
            onClick={() => navigate('/account/overview')}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 text-gray-600 rounded-full font-bold hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving || productDetails.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-tet-primary to-tet-accent text-white rounded-full font-bold hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
