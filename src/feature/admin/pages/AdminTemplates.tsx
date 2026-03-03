
import { Gift, Eye, Trash2, Star, X, Edit, Save, Package, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { productService, type Product, type UpdateComboProductRequest, type ProductDetailRequest, type CreateComboProductRequest } from "@/api/productService";
import { configService, type ProductConfig } from "@/api/configService";
import { categoryService, type Category } from "@/api/categoryService";

interface ProductDetailWithChild extends ProductDetailRequest {
  childProduct?: Product;
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editProductConfig, setEditProductConfig] = useState<ProductConfig | null>(null);
  const [availableProductsForEdit, setAvailableProductsForEdit] = useState<Product[]>([]);
  const [categoriesForEdit, setCategoriesForEdit] = useState<Category[]>([]);
  const [productSearchForEdit, setProductSearchForEdit] = useState("");
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<number>(0);
  
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [configs, setConfigs] = useState<ProductConfig[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number>(0);
  const [selectedConfig, setSelectedConfig] = useState<ProductConfig | null>(null);
  const [productSearch, setProductSearch] = useState("");
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  
  // Edit form state
  const [productname, setProductname] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [productDetails, setProductDetails] = useState<ProductDetailWithChild[]>([]);

  const fetchTemplates = async () => {
    console.log('=== FETCH TEMPLATES ===');
    
    try {
      setLoading(true);
      console.log('Calling API: GET /products/templates');
      
      const response = await productService.templates.getAll();
      
      console.log('Templates response:', response);
      console.log('Templates count:', response.data?.length || 0);
      
      setTemplates(response.data || []);
      console.log('✅ Templates loaded successfully');
    } catch (error: any) {
      console.error('❌ Error fetching templates:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.response?.data?.message || error.message);
      
      alert('Không thể tải danh sách giỏ mẫu');
    } finally {
      setLoading(false);
      console.log('=== END FETCH TEMPLATES ===');
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreateModal = async () => {
    console.log('=== OPEN CREATE MODAL ===');
    try {
      setShowCreateModal(true);
      setCreating(true);
      
      // Fetch configs
      console.log('Fetching configs...');
      const configsData = await configService.getAllConfig();
      setConfigs(configsData);
      console.log('Configs loaded:', configsData.length);
      
      // Fetch available products
      console.log('Fetching products...');
      const productsResponse = await productService.getAll();
      const products: Product[] = (productsResponse as any)?.data?.data ?? (productsResponse as any)?.data ?? [];
      // Filter only ACTIVE single products (not baskets)
      const filtered = products.filter((p: Product) => 
        p.status === 'ACTIVE' && !p.configid
      );
      setAvailableProducts(filtered);
      console.log('Available products:', filtered.length);
      
      // Reset form
      setProductname('');
      setDescription('');
      setImageUrl('');
      setStatus('TEMPLATE');
      setSelectedConfigId(configsData[0]?.configid || 0);
      setSelectedConfig(configsData[0] || null);
      setProductDetails([]);
      setProductSearch('');
      
      console.log('✅ Create modal ready');
    } catch (error: any) {
      console.error('❌ Error loading create modal data:', error);
      alert('Không thể tải dữ liệu. Vui lòng thử lại.');
      setShowCreateModal(false);
    } finally {
      setCreating(false);
      console.log('=== END OPEN CREATE MODAL ===');
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setProductname('');
    setDescription('');
    setImageUrl('');
    setStatus('TEMPLATE');
    setSelectedConfigId(0);
    setSelectedConfig(null);
    setProductDetails([]);
    setProductSearch('');
  };

  const handleConfigChange = (configId: number) => {
    setSelectedConfigId(configId);
    const config = configs.find(c => c.configid === configId);
    setSelectedConfig(config || null);
  };

  const handleAddProduct = (product: Product) => {
    // Check if already added
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

  const handleCreateTemplate = async () => {
    console.log('=== CREATE TEMPLATE ===');
    console.log('Config ID:', selectedConfigId);
    console.log('Product Name:', productname);
    console.log('Description:', description);
    console.log('Image URL:', imageUrl);
    console.log('Status:', status);
    console.log('Product Details:', productDetails);
    
    if (!selectedConfigId || selectedConfigId === 0) {
      console.warn('Validation failed: No config selected');
      alert('Vui lòng chọn cấu hình giỏ quà');
      return;
    }
    
    if (!productname.trim()) {
      console.warn('Validation failed: Product name is empty');
      alert('Vui lòng nhập tên giỏ quà');
      return;
    }

    if (productDetails.length === 0) {
      console.warn('Validation failed: No products in basket');
      alert('Giỏ quà phải có ít nhất 1 sản phẩm');
      return;
    }

    // Validate product config
    const validation = validateProductConfig();
    if (!validation.valid) {
      console.warn('Validation failed: Product config mismatch');
      alert(validation.message);
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token') || '';
      
      const createData: CreateComboProductRequest = {
        configid: selectedConfigId,
        productname,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        status: status || 'TEMPLATE',
        productDetails: productDetails.map(pd => ({
          productid: pd.productid,
          quantity: pd.quantity || 1
        }))
      };

      console.log('Create payload:', JSON.stringify(createData, null, 2));
      console.log('Calling API: POST /products/templates');
      
      const response = await productService.templates.create(createData, token);
      
      console.log('Create response:', response);
      console.log('✅ Create successful');
      
      alert('Tạo template thành công');
      handleCloseCreateModal();
      fetchTemplates();
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Error creating template:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.response?.data?.message || error.message);
      console.error('Error status:', error.response?.status);
      console.log('=== END CREATE TEMPLATE (FAILED) ===');
      
      alert(error.response?.data?.message || error.message || 'Không thể tạo template');
    } finally {
      setCreating(false);
      console.log('=== END CREATE TEMPLATE ===');
    }
  };

  const handleViewDetails = (template: Product) => {
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const handleRemoveTemplate = async (productId: number) => {
    if (!confirm('Bạn có chắc muốn gỡ giỏ mẫu này?')) return;
    
    console.log('=== REMOVE TEMPLATE ===');
    console.log('Product ID:', productId);
    
    try {
      const token = localStorage.getItem('token') || '';
      console.log('Calling API: PUT /products/' + productId + '/remove-template');
      
      await productService.templates.removeTemplate(productId, token);
      
      console.log('✅ Template removed successfully');
      alert('Đã gỡ giỏ mẫu thành công');
      fetchTemplates();
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Error removing template:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.response?.data?.message || error.message);
      
      alert(error.response?.data?.message || error.message || 'Không thể gỡ giỏ mẫu');
    } finally {
      console.log('=== END REMOVE TEMPLATE ===');
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    console.log('=== DELETE PRODUCT ===');
    console.log('Product ID:', productId);
    
    try {
      const token = localStorage.getItem('token') || '';
      console.log('Calling API: DELETE /products/' + productId);
      
      await productService.delete(productId, token);
      
      console.log('✅ Product deleted successfully');
      alert('Đã xóa sản phẩm thành công');
      fetchTemplates();
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Error deleting product:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.response?.data?.message || error.message);
      
      alert(error.response?.data?.message || error.message || 'Không thể xóa sản phẩm');
    } finally {
      console.log('=== END DELETE PRODUCT ===');
    }
  };

  const handleUpdate = async (productId: number) => {
    console.log('=== FETCH PRODUCT FOR EDIT ===');
    console.log('Product ID:', productId);
    
    try {
      setEditLoading(true);
      setShowEditModal(true);
      
      console.log('Calling API: GET /products/' + productId);
      const response = await productService.getById(productId);
      const data = response.data as Product;
      
      console.log('Fetched product data:', data);
      console.log('Product name:', data.productname);
      console.log('Config ID:', data.configid);
      console.log('Product details count:', data.productDetails?.length || 0);
      console.log('Product details raw:', data.productDetails);
      
      setEditProduct(data);
      setProductname(data.productname || "");
      setDescription(data.description || "");
      setImageUrl(data.imageUrl || "");
      setStatus(data.status || "DRAFT");
      
      // Build child products from embedded fields in ProductDetailResponse
      const details: ProductDetailWithChild[] = [];
      for (const pd of data.productDetails || []) {
        let childProduct: Product | undefined = pd.childProduct ?? undefined;

        if (!childProduct && pd.productid) {
          if (pd.productname) {
            // Use embedded fields (categoryid, productname, price, unit, imageurl are now included)
            childProduct = {
              productid: pd.productid,
              categoryid: pd.categoryid,
              productname: pd.productname,
              price: pd.price,
              unit: pd.unit,
              imageUrl: pd.imageurl,
            } as Product;
            console.log('Child product built from embedded fields:', childProduct.productname, '(categoryid:', childProduct.categoryid + ')');
          } else {
            // Fallback: fetch if no embedded data available
            try {
              console.log('Fetching child product ID:', pd.productid);
              const childResponse = await productService.getById(pd.productid);
              childProduct = (childResponse as any)?.data as Product;
              console.log('Child product fetched:', childProduct?.productname);
            } catch (childError) {
              console.warn('⚠️ Could not load child product:', pd.productid);
            }
          }
        }

        details.push({
          productid: pd.productid,
          quantity: pd.quantity,
          childProduct: childProduct
        });
      }
      
      setProductDetails(details);
      console.log('Product details set:', details.length, 'items');
      console.log('Product details with children:', details.map(d => ({
        productid: d.productid,
        quantity: d.quantity,
        childName: d.childProduct?.productname,
        categoryid: d.childProduct?.categoryid
      })));
      
      // Fetch config if exists
      if (data.configid) {
        console.log('Fetching config ID:', data.configid);
        try {
          const configData = await configService.getById(data.configid);
          setEditProductConfig(configData);
          console.log('Config loaded:', configData?.configname);
        } catch (configError: any) {
          console.warn('⚠️ Could not load config:', configError.response?.status, configError.message);
          setEditProductConfig(null);
        }
      } else {
        console.log('No configid found, resetting editProductConfig');
        setEditProductConfig(null);
      }
      
      // Fetch categories for filtering
      console.log('Fetching categories...');
      const categoriesResponse = await categoryService.getAll();
      const categories: Category[] = (categoriesResponse as any)?.data ?? [];
      setCategoriesForEdit(categories);
      console.log('Categories loaded:', categories.length);
      
      // Fetch available products
      console.log('Fetching products...');
      const productsResponse = await productService.getAll();
      const products: Product[] = (productsResponse as any)?.data?.data ?? (productsResponse as any)?.data ?? [];
      // Filter only ACTIVE single products (not baskets)
      const filtered = products.filter((p: Product) => 
        p.status === 'ACTIVE' && !p.configid
      );
      setAvailableProductsForEdit(filtered);
      console.log('Available products:', filtered.length);
      
      // Reset search and filter
      setProductSearchForEdit('');
      setSelectedCategoryForEdit(0);
      
      console.log('✅ Product loaded successfully');
      console.log('Form initialized with:', { 
        productname: data.productname, 
        status: data.status, 
        detailsCount: details.length,
        categoriesCount: categories.length,
        availableProductsCount: filtered.length
      });
    } catch (error: any) {
      console.error('❌ Error fetching product:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.response?.data?.message || error.message);
      console.error('Error stack:', error.stack);
      
      alert('Không thể tải thông tin sản phẩm');
      setShowEditModal(false);
    } finally {
      setEditLoading(false);
      console.log('=== END FETCH PRODUCT ===');
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditProduct(null);
    setEditProductConfig(null);
    setProductname("");
    setDescription("");
    setImageUrl("");
    setStatus("DRAFT");
    setProductDetails([]);
    setAvailableProductsForEdit([]);
    setCategoriesForEdit([]);
    setProductSearchForEdit("");
    setSelectedCategoryForEdit(0);
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

  const handleSaveEdit = async () => {
    console.log('=== START UPDATE PRODUCT ===');
    console.log('Product ID:', editProduct?.productid);
    console.log('Product Name:', productname);
    console.log('Description:', description);
    console.log('Image URL:', imageUrl);
    console.log('Status:', status);
    console.log('Product Details Count:', productDetails.length);
    console.log('Product Details:', productDetails.map(pd => ({
      productid: pd.productid,
      productname: pd.childProduct?.productname,
      quantity: pd.quantity,
      price: pd.childProduct?.price,
      categoryid: pd.childProduct?.categoryid
    })));
    
    if (!productname.trim()) {
      console.warn('Validation failed: Product name is empty');
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (productDetails.length === 0) {
      console.warn('Validation failed: No products in basket');
      alert('Giỏ quà phải có ít nhất 1 sản phẩm');
      return;
    }

    // Validate product config for edit
    if (editProductConfig && editProductConfig.configDetails && editProductConfig.configDetails.length > 0) {
      const categoryCount: Record<number, number> = {};
      productDetails.forEach(pd => {
        const categoryId = pd.childProduct?.categoryid;
        if (categoryId) {
          categoryCount[categoryId] = (categoryCount[categoryId] || 0) + (pd.quantity || 0);
        }
      });

      const errors: string[] = [];
      editProductConfig.configDetails.forEach(detail => {
        const required = detail.quantity;
        const actual = categoryCount[detail.categoryid] || 0;
        
        if (actual < required) {
          errors.push(`${detail.categoryName}: Cần ${required} món, hiện tại ${actual} món`);
        } else if (actual > required) {
          errors.push(`${detail.categoryName}: Vượt quá ${required} món, hiện tại ${actual} món`);
        }
      });

      if (errors.length > 0) {
        console.warn('Validation failed: Product config mismatch');
        alert('❌ Giỏ quà không đúng cấu hình:\n' + errors.join('\n'));
        return;
      }
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';
      
      const updateData: UpdateComboProductRequest = {
        productname,
        category: "",  // Empty for baskets/combos (no category needed)
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
      console.log('Endpoint: /products/' + editProduct!.productid + '/custom');
      console.log('Token present:', !!token);
      console.log('Update payload:', JSON.stringify(updateData, null, 2));
      console.log('Update payload details:');
      console.log('  - productname:', updateData.productname);
      console.log('  - description:', updateData.description);
      console.log('  - imageUrl:', updateData.imageUrl);
      console.log('  - status:', updateData.status);
      console.log('  - productDetails:', updateData.productDetails);
      console.log('=========================');
      
      const response = await productService.updateCustom(editProduct!.productid!, updateData, token);
      
      console.log('=== RESPONSE DETAILS ===');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('✅ Update successful');
      console.log('========================');
      
      alert('Cập nhật giỏ quà thành công');
      handleCloseEditModal();
      fetchTemplates();
      window.location.reload();
    } catch (error: any) {
      console.error('=== UPDATE ERROR DETAILS ===');
      console.error('❌ Error updating product');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error response message:', error.response?.data?.message);
      console.error('Error response errors:', error.response?.data?.errors);
      console.error('Full error object:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error stack:', error.stack);
      console.error('===========================');
      
      alert(error.response?.data?.message || error.message || 'Không thể cập nhật sản phẩm');
    } finally {
      setSaving(false);
      console.log('=== END UPDATE PRODUCT ===');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tet-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải giỏ mẫu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Quản lý giỏ mẫu
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Giỏ quà mẫu cho khách hàng clone • {templates.filter(t => statusFilter === 'ALL' || t.status === statusFilter).length} mẫu
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Tạo template mới
          </button>
        </div>
        
        {/* Filter by Status */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="ALL">Tất cả ({templates.length})</option>
            <option value="TEMPLATE">TEMPLATE ({templates.filter(t => t.status === 'TEMPLATE').length})</option>
            <option value="DRAFT">DRAFT ({templates.filter(t => t.status === 'DRAFT').length})</option>
            <option value="ACTIVE">ACTIVE ({templates.filter(t => t.status === 'ACTIVE').length})</option>
            <option value="INACTIVE">INACTIVE ({templates.filter(t => t.status === 'INACTIVE').length})</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Chưa có giỏ mẫu nào</p>
          <p className="text-gray-400 text-sm mt-2">Đặt sản phẩm làm template để hiển thị ở đây</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates
            .filter(template => statusFilter === 'ALL' || template.status === statusFilter)
            .map((template) => (
            <div
              key={template.productid}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
            >
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
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                    template.status === 'TEMPLATE' ? 'bg-purple-500 text-white' :
                    template.status === 'ACTIVE' ? 'bg-green-500 text-white' :
                    template.status === 'DRAFT' ? 'bg-yellow-500 text-white' :
                    template.status === 'INACTIVE' ? 'bg-gray-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {template.status}
                  </span>
                  {template.totalQuantity !== undefined && (
                    <span className="bg-white/90 backdrop-blur-sm text-tet-accent px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      Stock: {template.totalQuantity}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-tet-primary mb-1 line-clamp-2">
                  {template.productname}
                </h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {template.description || 'Chưa có mô tả'}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-tet-accent">
                      {(template.price || 0).toLocaleString()}đ
                    </p>
                    <p className="text-xs text-gray-500">{template.unit || 0}g</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Sản phẩm trong giỏ:</p>
                    <p className="text-lg font-bold text-tet-primary">
                      {template.productDetails?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(template)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-all"
                  >
                    <Eye size={16} />
                    Xem
                  </button>
                  <button
                    onClick={() => handleUpdate(template.productid!)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg font-bold hover:bg-green-100 transition-all"
                  >
                    <Edit size={16} />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleRemoveTemplate(template.productid!)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg font-bold hover:bg-amber-100 transition-all"
                  >
                    <Star size={16} />
                    Gỡ
                  </button>
                  <button
                    onClick={() => handleDelete(template.productid!)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-3xl border border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-tet-primary mb-2">
              Thống kê template {statusFilter !== 'ALL' && `(${statusFilter})`}
            </h3>
            <p className="text-sm text-gray-600">
              Tổng số giỏ mẫu: <span className="font-bold">{templates.filter(t => statusFilter === 'ALL' || t.status === statusFilter).length} mẫu</span>
            </p>
            <p className="text-sm text-gray-600">
              Tổng số sản phẩm: <span className="font-bold">{templates.filter(t => statusFilter === 'ALL' || t.status === statusFilter).reduce((sum, t) => sum + (t.productDetails?.length || 0), 0)} món</span>
            </p>
            <div className="flex gap-4 mt-3 flex-wrap">
              <span className="text-xs text-gray-600">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
                TEMPLATE: <span className="font-bold">{templates.filter(t => t.status === 'TEMPLATE').length}</span>
              </span>
              <span className="text-xs text-gray-600">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                ACTIVE: <span className="font-bold">{templates.filter(t => t.status === 'ACTIVE').length}</span>
              </span>
              <span className="text-xs text-gray-600">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                DRAFT: <span className="font-bold">{templates.filter(t => t.status === 'DRAFT').length}</span>
              </span>
              <span className="text-xs text-gray-600">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-1"></span>
                INACTIVE: <span className="font-bold">{templates.filter(t => t.status === 'INACTIVE').length}</span>
              </span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
            <Gift size={28} />
          </div>
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

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                    {selectedTemplate.productDetails.map((detail, index) => {
                      // Use childProduct fields if available, otherwise fall back to embedded fields
                      const displayName = detail.childProduct?.productname ?? detail.productname;
                      const displayPrice = detail.childProduct?.price ?? detail.price;
                      const displayImage = detail.childProduct?.imageUrl ?? (detail as any).imageurl;
                      const displaySku = detail.childProduct?.sku;
                      const displayStock = detail.childProduct?.totalQuantity;
                      return (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-all"
                      >
                        {displayImage ? (
                          <img
                            src={displayImage}
                            alt={displayName}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Gift size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-bold text-tet-primary">
                            {displayName || 'Unknown'}
                          </h5>
                          <p className="text-xs text-gray-500">
                            SKU: {displaySku || 'N/A'}
                          </p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-600">
                              Giá: <span className="font-bold text-tet-accent">{(displayPrice || 0).toLocaleString()}đ</span>
                            </span>
                            {displayStock !== undefined && (
                              <span className="text-xs text-gray-600">
                                Stock: <span className="font-bold">{displayStock}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Số lượng</p>
                          <p className="text-2xl font-bold text-tet-primary">x{detail.quantity || 1}</p>
                        </div>
                      </div>
                      );
                    })}
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
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={handleCloseEditModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-3xl">
              <h2 className="text-xl font-semibold">
                {editLoading ? 'Đang tải...' : `Chỉnh sửa giỏ quà: ${editProduct?.productname || ''}`}
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={saving}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {editLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="grid grid-cols-2 gap-6">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Nhập mô tả giỏ quà"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL Hình ảnh
                      </label>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {imageUrl && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Xem trước hình ảnh</p>
                        <img 
                          src={imageUrl} 
                          alt="Preview"
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
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="UNAVAILABLE">UNAVAILABLE</option>
                      </select>
                    </div>

                    {/* Product Config Info */}
                    {editProduct?.configid && !editProductConfig && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                          <Package size={16} />
                          ⚠️ Không tìm thấy cấu hình giỏ quà
                        </h4>
                        <p className="text-xs text-red-800 mb-3">
                          Config ID: <span className="font-bold">{editProduct.configid}</span> không tồn tại trong hệ thống.
                          Có thể config đã bị xóa hoặc dữ liệu không đồng bộ.
                        </p>
                        <p className="text-xs text-red-700 italic">
                          💡 <strong>Giải pháp:</strong> Bạn có thể lưu sản phẩm này để tiếp tục chỉnh sửa. 
                          Tuy nhiên, không thể validate theo cấu hình vì config không còn tồn tại.
                        </p>
                      </div>
                    )}
                    
                    {editProductConfig && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <Package size={16} />
                          Cấu hình giỏ quà: {editProductConfig.configname}
                        </h4>
                        {editProductConfig.suitablesuggestion && (
                          <p className="text-xs text-blue-800 mb-2">{editProductConfig.suitablesuggestion}</p>
                        )}
                        {editProductConfig.totalunit && (
                          <p className="text-xs text-blue-700 mb-2">
                            Trọng lượng tối đa: <span className="font-bold">{editProductConfig.totalunit}g</span>
                          </p>
                        )}
                        {editProductConfig.configDetails && editProductConfig.configDetails.length > 0 && (
                          <>
                            <div className="border-t border-blue-200 my-2 pt-2">
                              <p className="text-xs font-semibold text-blue-900 mb-1.5">Yêu cầu theo danh mục:</p>
                              <div className="space-y-1.5">
                                {editProductConfig.configDetails.map((detail, idx) => {
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
                                💡 {(() => {
                                  if (!editProductConfig.configDetails || editProductConfig.configDetails.length === 0) return '';
                                  const categoryCount: Record<number, number> = {};
                                  productDetails.forEach(pd => {
                                    const categoryId = pd.childProduct?.categoryid;
                                    if (categoryId) {
                                      categoryCount[categoryId] = (categoryCount[categoryId] || 0) + (pd.quantity || 0);
                                    }
                                  });
                                  const isValid = editProductConfig.configDetails.every(detail => {
                                    const actual = categoryCount[detail.categoryid] || 0;
                                    return actual === detail.quantity;
                                  });
                                  return isValid ? '✅ Giỏ quà đã đúng cấu hình' : '⚠️ Cần điều chỉnh số lượng';
                                })()}
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
                          value={productSearchForEdit}
                          onChange={(e) => setProductSearchForEdit(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <select
                          value={selectedCategoryForEdit}
                          onChange={(e) => setSelectedCategoryForEdit(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value={0}>Tất cả danh mục</option>
                          {categoriesForEdit.map(cat => (
                            <option key={cat.categoryid} value={cat.categoryid}>
                              {cat.categoryname}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="max-h-[150px] overflow-y-auto border rounded-lg p-2 space-y-2">
                        {availableProductsForEdit.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">Không có sản phẩm khả dụng</p>
                        ) : (
                          <>
                            {availableProductsForEdit
                              .filter(product => {
                                // Filter by search
                                if (productSearchForEdit) {
                                  const searchLower = productSearchForEdit.toLowerCase();
                                  if (!product.productname?.toLowerCase().includes(searchLower)) {
                                    return false;
                                  }
                                }
                                // Filter by category
                                if (selectedCategoryForEdit && selectedCategoryForEdit !== 0) {
                                  if (product.categoryid !== selectedCategoryForEdit) {
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
                            {availableProductsForEdit.filter(product => {
                              if (productSearchForEdit) {
                                const searchLower = productSearchForEdit.toLowerCase();
                                if (!product.productname?.toLowerCase().includes(searchLower)) {
                                  return false;
                                }
                              }
                              if (selectedCategoryForEdit && selectedCategoryForEdit !== 0) {
                                if (product.categoryid !== selectedCategoryForEdit) {
                                  return false;
                                }
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
                <div className="flex-shrink-0 flex justify-end gap-3 pt-6 border-t mt-6">
                  <button
                    onClick={handleCloseEditModal}
                    disabled={saving}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || productDetails.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={handleCloseCreateModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-3xl">
              <h2 className="text-xl font-semibold">
                Tạo template giỏ quà mới
              </h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={creating}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cấu hình giỏ quà <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedConfigId}
                      onChange={(e) => handleConfigChange(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>Chọn cấu hình...</option>
                      {configs.map(config => (
                        <option key={config.configid} value={config.configid}>
                          {config.configname} {config.totalunit ? `(${config.totalunit}g max)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hiển thị ConfigDetails */}
                  {selectedConfig && selectedConfig.configDetails && selectedConfig.configDetails.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
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
                              <span className="text-blue-800 font-medium">{detail.categoryName}</span>
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
                      <p className="text-xs text-blue-700 mt-2 italic">
                        💡 Chọn sản phẩm theo đúng số lượng mỗi danh mục
                      </p>
                    </div>
                  )}

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Nhập mô tả giỏ quà"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Hình ảnh
                    </label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {imageUrl && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Xem trước hình ảnh</p>
                      <img 
                        src={imageUrl} 
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image';
                        }}
                      />
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
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tổng trọng lượng:</span>
                      <span className="font-medium text-green-600">
                        {productDetails.reduce((sum, pd) => 
                          sum + ((pd.quantity || 0) * (pd.childProduct?.unit || 0)), 0
                        ).toLocaleString('vi-VN')}g
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
                    
                    {/* Search box */}
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    
                    <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2 space-y-2">
                      {availableProducts.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Không có sản phẩm khả dụng</p>
                      ) : (
                        <>
                          {availableProducts
                            .filter(product => {
                              if (!productSearch) return true;
                              const searchLower = productSearch.toLowerCase();
                              return product.productname?.toLowerCase().includes(searchLower);
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
                            if (!productSearch) return true;
                            const searchLower = productSearch.toLowerCase();
                            return product.productname?.toLowerCase().includes(searchLower);
                          }).length === 0 && productSearch && (
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

                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
                                  Đơn giá: {detail.childProduct?.price?.toLocaleString('vi-VN')}đ • 
                                  {detail.childProduct?.unit}g
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
              <div className="flex-shrink-0 flex justify-end gap-3 pt-6 border-t mt-6">
                <button
                  onClick={handleCloseCreateModal}
                  disabled={creating}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={creating || productDetails.length === 0 || !selectedConfigId}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Tạo template
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
