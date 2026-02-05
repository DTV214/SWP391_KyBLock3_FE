import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Settings, Eye, Save } from "lucide-react";
import { 
  configService,
  categoryService,
  configDetailServiceAPI,
  type ProductConfig,
  type Product,
  type Category
} from "../../../api";
import type { 
  ConfigDetailDto, 
  CreateConfigDetailRequest, 
  UpdateConfigDetailRequest 
} from "../../../api/dtos/productConfig.dto";

export default function AdminConfigs() {
  const [configs, setConfigs] = useState<ProductConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ProductConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingConfig, setViewingConfig] = useState<ProductConfig | null>(null);
  const [formData, setFormData] = useState({
    configname: "",
    description: "",
    totalunit: 0,
  });
  const [categoryQuantities, setCategoryQuantities] = useState<{ [categoryId: number]: number }>({});
  
  // ConfigDetail Management States
  const [showConfigDetailSection, setShowConfigDetailSection] = useState(false);
  const [showConfigDetailModal, setShowConfigDetailModal] = useState(false);
  const [managingConfigId, setManagingConfigId] = useState<number | null>(null);
  const [managingConfigName, setManagingConfigName] = useState<string>("");
  const [configDetails, setConfigDetails] = useState<ConfigDetailDto[]>([]);
  const [editingDetail, setEditingDetail] = useState<ConfigDetailDto | null>(null);
  const [detailForm, setDetailForm] = useState({
    categoryid: 0,
    quantity: 0,
  });
  const [categorySearch, setCategorySearch] = useState("");
  const [pendingConfigDetails, setPendingConfigDetails] = useState<Array<{ categoryid: number; quantity: number }>>([]);

  const getToken = () => localStorage.getItem("token") || "";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [configsRes, categoriesRes] = await Promise.all([
        configService.getAllConfig(),
        categoryService.getAll(),
      ]);

      const configsData = Array.isArray(configsRes) ? configsRes : [];
      const categoriesData = Array.isArray(categoriesRes as any)
        ? (categoriesRes as any)
        : Array.isArray((categoriesRes as any)?.data)
          ? (categoriesRes as any).data
          : [];
      
      console.log('[getAllConfig] mapped configs:', configsData);
      
      setConfigs(configsData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (config?: ProductConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        configname: config.configname || "",
        description: config.suitablesuggestion || "",
        totalunit: config.totalunit || 0,
      });
      
      // Load category quantities from configDetails
      if (config.configDetails && config.configDetails.length > 0) {
        const quantities: { [categoryId: number]: number } = {};
        config.configDetails.forEach(detail => {
          quantities[detail.categoryid] = detail.quantity;
        });
        setCategoryQuantities(quantities);
      } else {
        setCategoryQuantities({});
      }
    } else {
      setEditingConfig(null);
      setFormData({
        configname: "",
        description: "",
        totalunit: 0,
      });
      setCategoryQuantities({});
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConfig(null);
    setCategoryQuantities({});
    setCategorySearch("");
    setError(null);
    setShowConfigDetailSection(false);
    setConfigDetails([]);
    setEditingDetail(null);
    setDetailForm({ categoryid: 0, quantity: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.configname?.trim()) {
      setError("Vui lòng nhập tên cấu hình");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        Configname: formData.configname,
        Description: formData.description,
        Totalunit: formData.totalunit,
        CategoryQuantities: categoryQuantities,
      };

      console.log('[handleSubmit] Payload before submit:', payload);
      console.log('[handleSubmit] Edit mode:', !!editingConfig?.configid);

      let createdConfigId: number | undefined;

      if (editingConfig?.configid) {
        // UPDATE MODE
        console.log('[handleSubmit] Updating config:', editingConfig.configid);
        const updateResult = await configService.update(editingConfig.configid, payload, getToken());
        console.log('[handleSubmit] Update result:', updateResult);
        createdConfigId = editingConfig.configid;
      } else {
        // CREATE MODE
        console.log('[handleSubmit] Creating new config');
        const result = await configService.create(payload, getToken());
        console.log('[handleSubmit] Create result:', result);
        createdConfigId = result?.configid;
      }

      console.log('[handleSubmit] CreatedConfigId:', createdConfigId);

      // Check if this is an update or create operation
      if (editingConfig?.configid) {
        // UPDATE MODE - Just close and refresh
        console.log('[handleSubmit] Update completed, closing and refreshing');
        handleCloseModal();
        await fetchData();
        window.location.reload();
      } else if (createdConfigId) {
        // CREATE MODE - Show ConfigDetail management section
        console.log('[handleSubmit] Create completed, moving to ConfigDetail management section');
        setEditingConfig({ 
          ...(editingConfig || {}), 
          configid: createdConfigId,
          configname: formData.configname,
          suitablesuggestion: formData.description,
          totalunit: formData.totalunit
        } as ProductConfig);
        await loadConfigDetails(createdConfigId);
        setShowConfigDetailSection(true);
        setError(null);
        // Don't close modal, let user manage ConfigDetails
      } else {
        // If no ID returned, just close and refresh
        console.log('[handleSubmit] No config ID returned, closing and refreshing');
        handleCloseModal();
        await fetchData();
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Error saving config:", err);
      
      let errorMessage = "Không thể lưu cấu hình";
      if (err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat();
        errorMessage = errors.join(", ");
      } else if (err.response?.data?.message || err.response?.data?.msg) {
        errorMessage = err.response.data.message || err.response.data.msg;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình này?")) {
      return;
    }

    try {
      setError(null);
      await configService.delete(id, getToken());
      await fetchData();
      window.location.reload();
    } catch (err: any) {
      console.error("Error deleting config:", err);
      setError(err.response?.data?.message || err.response?.data?.msg || "Không thể xóa cấu hình");
    }
  };

  const handleUpdateCategoryQuantity = (categoryId: number, quantity: number) => {
    setCategoryQuantities(prev => ({
      ...prev,
      [categoryId]: quantity
    }));
  };

  const handleFinishConfigDetailManagement = async () => {
    console.log('[handleFinishConfigDetailManagement] Closing modal and refreshing data');
    handleCloseModal();
    await fetchData();
    window.location.reload();
  };

  // Standalone ConfigDetail modal functions
  const handleOpenConfigDetailModal = async (config: ProductConfig) => {
    console.log('[handleOpenConfigDetailModal] Opening modal for config:', config);
    setManagingConfigId(config.configid!);
    setManagingConfigName(config.configname || "");
    await loadConfigDetails(config.configid!);
    setShowConfigDetailModal(true);
  };

  const handleCloseConfigDetailModal = async () => {
    console.log('[handleCloseConfigDetailModal] Closing modal');
    setShowConfigDetailModal(false);
    setManagingConfigId(null);
    setManagingConfigName("");
    setConfigDetails([]);
    setEditingDetail(null);
    setDetailForm({ categoryid: 0, quantity: 0 });
    setPendingConfigDetails([]);
    setError(null);
    await fetchData();
  };

  const handleAddPendingConfigDetail = () => {
    console.log('[handleAddPendingConfigDetail] Adding to pending list:', detailForm);
    
    if (!detailForm.categoryid || detailForm.quantity <= 0) {
      setError("Vui lòng chọn danh mục và nhập số lượng hợp lệ");
      console.log('[handleAddPendingConfigDetail] Validation failed:', { categoryid: detailForm.categoryid, quantity: detailForm.quantity });
      return;
    }

    // Check if category already exists in pending list
    if (pendingConfigDetails.find(d => d.categoryid === detailForm.categoryid)) {
      setError("Danh mục này đã được thêm vào danh sách chờ");
      console.log('[handleAddPendingConfigDetail] Category already in pending list');
      return;
    }

    // Check if category already exists in saved ConfigDetails
    if (configDetails.find(d => d.categoryid === detailForm.categoryid)) {
      setError("Danh mục này đã tồn tại trong cấu hình");
      console.log('[handleAddPendingConfigDetail] Category already exists in saved ConfigDetails');
      return;
    }

    const newPending = {
      categoryid: detailForm.categoryid,
      quantity: detailForm.quantity
    };
    console.log('[handleAddPendingConfigDetail] Adding new pending detail:', newPending);
    setPendingConfigDetails([...pendingConfigDetails, newPending]);
    setDetailForm({ categoryid: 0, quantity: 0 });
    setError(null);
  };

  const handleRemovePendingConfigDetail = (categoryid: number) => {
    console.log('[handleRemovePendingConfigDetail] Removing categoryid:', categoryid);
    setPendingConfigDetails(pendingConfigDetails.filter(d => d.categoryid !== categoryid));
  };

  const handleSaveAllPendingConfigDetails = async () => {
    console.log('[handleSaveAllPendingConfigDetails] Starting save process');
    console.log('[handleSaveAllPendingConfigDetails] managingConfigId:', managingConfigId);
    console.log('[handleSaveAllPendingConfigDetails] pendingConfigDetails:', pendingConfigDetails);
    
    if (!managingConfigId) {
      setError("Không tìm thấy ID cấu hình");
      console.error('[handleSaveAllPendingConfigDetails] No managingConfigId');
      return;
    }

    if (pendingConfigDetails.length === 0) {
      setError("Chưa có chi tiết cấu hình nào để lưu");
      console.warn('[handleSaveAllPendingConfigDetails] No pending details to save');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      console.log('[handleSaveAllPendingConfigDetails] Creating ConfigDetails...');
      // Create all pending ConfigDetails
      for (const detail of pendingConfigDetails) {
        const category = categories.find(c => c.categoryid === detail.categoryid);
        const payload: CreateConfigDetailRequest = {
          Configid: managingConfigId,
          Categoryid: detail.categoryid,
          Quantity: detail.quantity,
          CategoryName: category?.categoryname || ""
        };
        console.log('[handleSaveAllPendingConfigDetails] Creating ConfigDetail with payload:', payload);
        
        await configDetailServiceAPI.create(payload, getToken());
        console.log('[handleSaveAllPendingConfigDetails] Successfully created ConfigDetail for category:', detail.categoryid);
      }

      console.log('[handleSaveAllPendingConfigDetails] All ConfigDetails created successfully');
      // Reload ConfigDetails from server
      await loadConfigDetails(managingConfigId);
      setPendingConfigDetails([]);
      setDetailForm({ categoryid: 0, quantity: 0 });
      console.log('[handleSaveAllPendingConfigDetails] Save process completed');
    } catch (err: any) {
      console.error('[handleSaveAllPendingConfigDetails] Error:', err);
      console.error('[handleSaveAllPendingConfigDetails] Error response:', err.response);
      console.error('[handleSaveAllPendingConfigDetails] Error data:', err.response?.data);
      console.error('[handleSaveAllPendingConfigDetails] Validation errors:', err.response?.data?.errors);
      
      // Format validation errors for display
      let errorMessage = "Không thể lưu chi tiết cấu hình";
      if (err.response?.data?.errors) {
        const validationErrors = Object.entries(err.response.data.errors)
          .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join(' | ');
        errorMessage = `Lỗi validation: ${validationErrors}`;
      } else if (err.response?.data?.message || err.response?.data?.title) {
        errorMessage = err.response.data.message || err.response.data.title;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getConfigProducts = (config: ProductConfig) => {
    // Get template product from config
    const templateProduct = config.products?.find((p: Product) => p.status === "TEMPLATE");
    return templateProduct || null;
  };

  // ConfigDetail CRUD Functions
  const loadConfigDetails = async (configId: number) => {
    console.log('[loadConfigDetails] Loading for configId:', configId);
    try {
      const details = await configDetailServiceAPI.getByConfig(configId);
      console.log('[loadConfigDetails] Loaded details:', details);
      setConfigDetails(details || []);
    } catch (err: any) {
      console.error('[loadConfigDetails] Error:', err);
      setError("Không thể tải danh sách ConfigDetail");
    }
  };

  const handleCreateConfigDetail = async () => {
    console.log('[handleCreateConfigDetail] Creating with form:', detailForm);
    if (!managingConfigId) {
      setError("Không tìm thấy Config ID");
      return;
    }
    
    if (!detailForm.categoryid) {
      setError("Vui lòng chọn danh mục");
      return;
    }

    if (detailForm.quantity <= 0) {
      setError("Số lượng phải lớn hơn 0");
      return;
    }

    if (configDetails.some(d => d.categoryid === detailForm.categoryid)) {
      setError("Danh mục này đã được thêm");
      return;
    }

    try {
      setError(null);
      const category = categories.find(c => c.categoryid === detailForm.categoryid);
      const payload: CreateConfigDetailRequest = {
        Configid: managingConfigId,
        Categoryid: detailForm.categoryid,
        Quantity: detailForm.quantity,
        CategoryName: category?.categoryname || ""
      };
      console.log('[handleCreateConfigDetail] API payload:', payload);
      
      await configDetailServiceAPI.create(payload, getToken());
      console.log('[handleCreateConfigDetail] Successfully created');
      
      setDetailForm({ categoryid: 0, quantity: 1 });
      await loadConfigDetails(managingConfigId);
    } catch (err: any) {
      console.error('[handleCreateConfigDetail] Error:', err);
      console.error('[handleCreateConfigDetail] Error response:', err.response);
      console.error('[handleCreateConfigDetail] Error data:', err.response?.data);
      setError(err.response?.data?.message || "Không thể tạo ConfigDetail");
    }
  };

  const handleUpdateConfigDetail = async () => {
    console.log('[handleUpdateConfigDetail] Updating:', editingDetail);
    if (!editingDetail?.configdetailid || !managingConfigId) return;

    if (!detailForm.categoryid) {
      setError("Vui lòng chọn danh mục");
      return;
    }

    if (detailForm.quantity <= 0) {
      setError("Số lượng phải lớn hơn 0");
      return;
    }

    if (configDetails.some(d => 
      d.categoryid === detailForm.categoryid && 
      d.configdetailid !== editingDetail.configdetailid
    )) {
      setError("Danh mục này đã được thêm");
      return;
    }

    try {
      setError(null);
      const category = categories.find(c => c.categoryid === detailForm.categoryid);
      const payload: UpdateConfigDetailRequest = {
        Configdetailid: editingDetail.configdetailid,
        Configid: managingConfigId,
        Categoryid: detailForm.categoryid,
        Quantity: detailForm.quantity,
        CategoryName: category?.categoryname || ""
      };
      console.log('[handleUpdateConfigDetail] API payload:', payload);
      
      await configDetailServiceAPI.update(payload, getToken());
      console.log('[handleUpdateConfigDetail] Successfully updated');
      
      setEditingDetail(null);
      setDetailForm({ categoryid: 0, quantity: 1 });
      await loadConfigDetails(managingConfigId);
    } catch (err: any) {
      console.error('[handleUpdateConfigDetail] Error:', err);
      console.error('[handleUpdateConfigDetail] Error response:', err.response);
      console.error('[handleUpdateConfigDetail] Error data:', err.response?.data);
      setError(err.response?.data?.message || "Không thể cập nhật ConfigDetail");
    }
  };

  const handleDeleteConfigDetail = async (id: number) => {
    console.log('[handleDeleteConfigDetail] Deleting id:', id);
    if (!window.confirm("Bạn có chắc chắn muốn xóa quy tắc này?")) return;

    try {
      setError(null);
      await configDetailServiceAPI.delete(id, getToken());
      console.log('[handleDeleteConfigDetail] Successfully deleted');
      
      if (managingConfigId) {
        await loadConfigDetails(managingConfigId);
      }
    } catch (err: any) {
      console.error('[handleDeleteConfigDetail] Error:', err);
      console.error('[handleDeleteConfigDetail] Error response:', err.response);
      console.error('[handleDeleteConfigDetail] Error data:', err.response?.data);
      setError(err.response?.data?.message || "Không thể xóa ConfigDetail");
    }
  };

  const handleEditConfigDetail = (detail: ConfigDetailDto) => {
    console.log('[handleEditConfigDetail] Editing:', detail);
    setEditingDetail(detail);
    setDetailForm({
      categoryid: detail.categoryid,
      quantity: detail.quantity
    });
  };

  const handleCancelEdit = () => {
    console.log('[handleCancelEdit] Cancelling edit');
    setEditingDetail(null);
    setDetailForm({ categoryid: 0, quantity: 1 });
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Quản lý cấu hình giỏ quà
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Template và sản phẩm cho giỏ quà
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-tet-primary text-white px-6 py-3 rounded-full font-bold hover:bg-tet-accent transition-all shadow-md"
            disabled={loading}
          >
            <Plus size={20} />
            Tạo cấu hình
          </button>
        </div>
      </div>

      {/* Global Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="flex-1 text-red-700 text-sm">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Configs List */}
      {loading ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tet-primary"></div>
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <Settings size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-4">Chưa có cấu hình nào</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-tet-primary text-white px-6 py-3 rounded-full font-bold hover:bg-tet-accent transition-all shadow-md"
          >
            <Plus size={20} />
            Tạo cấu hình đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => {
            const templateProduct = getConfigProducts(config);
            return (
              <div
                key={config.configid}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                      <Settings size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-tet-primary mb-1">
                        {config.configname}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {config.suitablesuggestion || "Không có gợi ý"}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Tối đa: {config.totalunit || 0}g
                        </span>
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {templateProduct ? `Giá: ${templateProduct.price?.toLocaleString()}đ` : "Chưa có template"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenConfigDetailModal(config)}
                      className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors"
                      title="Quản lý chi tiết cấu hình"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={() => setViewingConfig(config)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(config)}
                      className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(config.configid!)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      disabled={loading}
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Config Details Preview - Show Products only (no nested details) */}
                {config.products && config.products.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-600 mb-2 uppercase">
                      Sản phẩm trong cấu hình ({config.products.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {config.products.map((product: Product, prodIdx: number) => (
                        <div key={prodIdx} className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:shadow-sm transition-all">
                          {product.imageUrl && (
                            <img 
                              src={product.imageUrl} 
                              alt={product.productname}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="text-xs font-medium text-gray-800">{product.productname}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                product.status === 'TEMPLATE' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : product.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : product.status === 'DELETED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {product.status}
                              </span>
                              {product.productDetails && product.productDetails.length > 0 && (
                                <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                                  {product.productDetails.length} món
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Config Details - Category Quantities */}
                {config.configDetails && config.configDetails.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-600 mb-2 uppercase">
                      Quy tắc cấu hình theo danh mục:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {config.configDetails.map((detail, detailIdx) => (
                        <div key={detailIdx} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-blue-900">{detail.categoryName}</span>
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                              {detail.quantity} món
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-serif font-bold text-tet-primary mb-6 flex-shrink-0">
              {editingConfig ? "Chỉnh sửa cấu hình" : "Tạo cấu hình mới"}
            </h3>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              {!showConfigDetailSection ? (
                // Step 1: Create/Edit Config Form
                <>
                  <div className="overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <div className="space-y-4">
                  {/* Basic Config Info */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tên cấu hình <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên cấu hình..."
                      value={formData.configname}
                      onChange={(e) => setFormData({ ...formData, configname: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      placeholder="Mô tả về cấu hình này..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                      disabled={submitting}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tổng khối lượng tối đa (gram) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Nhập tổng khối lượng..."
                      value={formData.totalunit || ""}
                      onChange={(e) => setFormData({ ...formData, totalunit: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                      disabled={submitting}
                    />
                  </div>

                  {/* Category Quantities */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Số lượng sản phẩm theo danh mục
                    </label>
                    
                    {/* Search Box */}
                    {categories.length > 5 && (
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Tìm kiếm danh mục..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tet-accent focus:border-transparent text-sm"
                          disabled={submitting}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {categories
                        .filter((category: Category) => 
                          !categorySearch || 
                          category.categoryname?.toLowerCase().includes(categorySearch.toLowerCase())
                        )
                        .map((category: Category) => (
                        <div key={category.categoryid} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{category.categoryname}</p>
                          </div>
                          <div className="w-24">
                            <input
                              type="number"
                              min="0"
                              value={categoryQuantities[category.categoryid!] || 0}
                              onChange={(e) => handleUpdateCategoryQuantity(category.categoryid!, parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                              disabled={submitting}
                            />
                          </div>
                        </div>
                      ))}
                      {categories.filter((category: Category) => 
                        !categorySearch || 
                        category.categoryname?.toLowerCase().includes(categorySearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-center text-gray-500 py-4 text-sm">
                          Không tìm thấy danh mục nào
                        </p>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý..." : editingConfig ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </>
              ) : (
                // Step 2: Manage ConfigDetails
                <>
                  <div className="overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-green-800 font-bold text-sm">
                          ✓ Cấu hình đã được {editingConfig?.configid ? 'lưu' : 'tạo'} thành công!
                        </p>
                        <p className="text-green-700 text-xs mt-1">
                          Bây giờ bạn có thể quản lý chi tiết cấu hình (ConfigDetail) theo danh mục
                        </p>
                      </div>

                      {/* Current ConfigDetails List */}
                      <div>
                        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <Settings size={18} />
                          Danh sách chi tiết cấu hình hiện tại ({configDetails.length})
                        </h4>
                        {configDetails.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-6 bg-gray-50 rounded-lg">
                            Chưa có chi tiết cấu hình nào
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {configDetails.map((detail) => {
                              const category = categories.find(c => c.categoryid === detail.categoryid);
                              return (
                                <div key={detail.configdetailid} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium text-blue-900">{category?.categoryname || `Category #${detail.categoryid}`}</p>
                                    <p className="text-xs text-blue-700">Số lượng: <span className="font-bold">{detail.quantity} món</span></p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditConfigDetail(detail)}
                                      className="p-2 hover:bg-yellow-100 rounded-lg text-yellow-600 transition-colors"
                                      disabled={submitting}
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteConfigDetail(detail.configdetailid!)}
                                      className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                      disabled={submitting}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Add/Edit ConfigDetail Form */}
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-3">
                          {editingDetail ? "Chỉnh sửa chi tiết cấu hình" : "Thêm chi tiết cấu hình mới"}
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Danh mục <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={detailForm.categoryid}
                              onChange={(e) => setDetailForm({ ...detailForm, categoryid: parseInt(e.target.value) })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                              disabled={submitting}
                            >
                              <option value={0}>-- Chọn danh mục --</option>
                              {categories.map((cat) => (
                                <option key={cat.categoryid} value={cat.categoryid}>
                                  {cat.categoryname}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Số lượng sản phẩm <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={detailForm.quantity || ""}
                              onChange={(e) => setDetailForm({ ...detailForm, quantity: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                              disabled={submitting}
                              placeholder="Nhập số lượng..."
                            />
                          </div>

                          <div className="flex gap-2">
                            {editingDetail && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDetail(null);
                                  setDetailForm({ categoryid: 0, quantity: 0 });
                                }}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-100 transition-all text-sm"
                                disabled={submitting}
                              >
                                Hủy chỉnh sửa
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={editingDetail ? handleUpdateConfigDetail : handleCreateConfigDetail}
                              className="flex-1 px-4 py-2 bg-tet-primary text-white rounded-lg font-bold hover:bg-tet-accent transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                              disabled={submitting || !detailForm.categoryid || detailForm.quantity <= 0}
                            >
                              {editingDetail ? (
                                <>
                                  <Save size={16} />
                                  Cập nhật
                                </>
                              ) : (
                                <>
                                  <Plus size={16} />
                                  Thêm mới
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
                    <button
                      type="button"
                      onClick={handleFinishConfigDetailManagement}
                      className="flex-1 px-6 py-3 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-md"
                      disabled={submitting}
                    >
                      Hoàn thành
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* View Config Modal */}
      {viewingConfig && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setViewingConfig(null)}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-serif font-bold text-tet-primary">
                Chi tiết cấu hình
              </h3>
              <button
                onClick={() => setViewingConfig(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {viewingConfig.imageurl && (
                <div className="flex justify-center">
                  <img
                    src={viewingConfig.imageurl}
                    alt={viewingConfig.configname}
                    className="max-w-full h-64 object-contain rounded-xl border border-gray-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Tên cấu hình</p>
                  <p className="font-bold">{viewingConfig.configname || "-"}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Tổng khối lượng tối đa</p>
                  <p className="font-bold text-tet-accent text-lg">
                    {viewingConfig.totalunit || 0}g
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Gợi ý phù hợp</p>
                  <p className="font-bold">{viewingConfig.suitablesuggestion || "-"}</p>
                </div>
              </div>

              {/* Config Details - Category Rules */}
              {viewingConfig.configDetails && viewingConfig.configDetails.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Quy tắc cấu hình theo danh mục
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {viewingConfig.configDetails.map((detail, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Danh mục</p>
                        <p className="font-bold text-blue-900 text-sm mb-2">{detail.categoryName}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">Số lượng:</span>
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {detail.quantity} món
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Config Template Product */}
              {viewingConfig.products && viewingConfig.products.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 font-bold">
                    Tất cả sản phẩm trong cấu hình
                  </p>
                  {viewingConfig.products.map((product: Product, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl">
                      {/* Template Product Info */}
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-all mb-3">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.productname}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{product.productname}</p>
                          <p className="text-sm text-gray-500">{product.description || "Không có mô tả"}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">
                              {product.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-tet-primary font-bold block">{product.price?.toLocaleString()}đ</span>
                        </div>
                      </div>

                      {/* Product Details (Child Products) */}
                      {product.productDetails && product.productDetails.length > 0 && (
                        <div className="ml-4 space-y-2">
                          <p className="text-xs font-bold text-gray-600 uppercase">
                            Sản phẩm bên trong ({product.productDetails.length} món):
                          </p>
                          {product.productDetails.map((detail, detailIndex) => (
                            <div key={detailIndex} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-100">
                              {detail.childProduct?.imageUrl && (
                                <img 
                                  src={detail.childProduct.imageUrl} 
                                  alt={detail.childProduct.productname}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{detail.childProduct?.productname || `Product #${detail.productid}`}</p>
                                <p className="text-xs text-gray-500">
                                  Số lượng: <span className="font-bold text-tet-accent">{detail.quantity}</span>
                                </p>
                              </div>
                              <div className="text-right text-xs">
                                <div className="text-gray-600">{detail.childProduct?.price?.toLocaleString()}đ</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewingConfig(null)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setViewingConfig(null);
                    handleOpenModal(viewingConfig);
                  }}
                  className="flex-1 px-6 py-3 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone ConfigDetail Management Modal */}
      {showConfigDetailModal && managingConfigId && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={handleCloseConfigDetailModal}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-serif font-bold text-tet-primary mb-6 flex-shrink-0">
              Quản lý chi tiết cấu hình: {managingConfigName}
            </h3>
            
            <div className="overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="space-y-4">
                {/* Current Saved ConfigDetails List */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Settings size={18} />
                    Chi tiết đã lưu ({configDetails.length})
                  </h4>
                  {configDetails.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6 bg-gray-50 rounded-lg">
                      Chưa có chi tiết cấu hình nào đã lưu
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {configDetails.map((detail) => {
                        const category = categories.find(c => c.categoryid === detail.categoryid);
                        return (
                          <div key={detail.configdetailid} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-green-900">{category?.categoryname || `Category #${detail.categoryid}`}</p>
                              <p className="text-xs text-green-700">Số lượng: <span className="font-bold">{detail.quantity} món</span></p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditConfigDetail(detail)}
                                className="p-2 hover:bg-yellow-100 rounded-lg text-yellow-600 transition-colors"
                                disabled={submitting}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteConfigDetail(detail.configdetailid!)}
                                className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                disabled={submitting}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pending ConfigDetails List */}
                {pendingConfigDetails.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Plus size={18} />
                      Danh sách chờ lưu ({pendingConfigDetails.length})
                    </h4>
                    <div className="space-y-2">
                      {pendingConfigDetails.map((detail, index) => {
                        const category = categories.find(c => c.categoryid === detail.categoryid);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-amber-900">{category?.categoryname || `Category #${detail.categoryid}`}</p>
                              <p className="text-xs text-amber-700">Số lượng: <span className="font-bold">{detail.quantity} món</span></p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePendingConfigDetail(detail.categoryid)}
                              className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                              disabled={submitting}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add ConfigDetail Form */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-3">
                    {editingDetail ? "Chỉnh sửa chi tiết cấu hình" : "Thêm chi tiết cấu hình"}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={detailForm.categoryid}
                        onChange={(e) => setDetailForm({ ...detailForm, categoryid: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                        disabled={submitting || !!editingDetail}
                      >
                        <option value={0}>-- Chọn danh mục --</option>
                        {categories.map((cat) => (
                          <option key={cat.categoryid} value={cat.categoryid}>
                            {cat.categoryname}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Số lượng sản phẩm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={detailForm.quantity || ""}
                        onChange={(e) => setDetailForm({ ...detailForm, quantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent focus:border-transparent"
                        disabled={submitting}
                        placeholder="Nhập số lượng..."
                      />
                    </div>

                    <div className="flex gap-2">
                      {editingDetail ? (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-100 transition-all text-sm"
                            disabled={submitting}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdateConfigDetail}
                            className="flex-1 px-4 py-2 bg-tet-primary text-white rounded-lg font-bold hover:bg-tet-accent transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                            disabled={submitting || !detailForm.categoryid || detailForm.quantity <= 0}
                          >
                            <Save size={16} />
                            Cập nhật
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAddPendingConfigDetail}
                          className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                          disabled={submitting || !detailForm.categoryid || detailForm.quantity <= 0}
                        >
                          <Plus size={16} />
                          Thêm vào danh sách
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
              {pendingConfigDetails.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAllPendingConfigDetails}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  <Save size={20} />
                  Lưu tất cả ({pendingConfigDetails.length})
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseConfigDetailModal}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all"
                disabled={submitting}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
