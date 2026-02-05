# Admin Dashboard - TetGift

Admin Dashboard đầy đủ tính năng quản lý sản phẩm, danh mục, cấu hình giỏ quà và templates.

## 📁 Cấu trúc Files

```
src/feature/admin/
├── layouts/
│   └── AdminLayout.tsx         # Layout chính với sidebar
├── components/
│   └── AdminSidebar.tsx        # Menu điều hướng
└── pages/
    ├── AdminOverview.tsx       # Tổng quan & thống kê
    ├── AdminProducts.tsx       # Quản lý sản phẩm
    ├── AdminCategories.tsx     # Quản lý danh mục
    ├── AdminConfigs.tsx        # Quản lý cấu hình giỏ
    └── AdminTemplates.tsx      # Quản lý giỏ mẫu
```

## 🚀 Routes

| URL | Component | Mô tả |
|-----|-----------|-------|
| `/admin` | Redirect → `/admin/overview` | Auto redirect |
| `/admin/overview` | AdminOverview | Dashboard tổng quan |
| `/admin/products` | AdminProducts | Quản lý sản phẩm |
| `/admin/categories` | AdminCategories | Quản lý danh mục |
| `/admin/configs` | AdminConfigs | Quản lý cấu hình giỏ |
| `/admin/templates` | AdminTemplates | Quản lý giỏ mẫu |

## 🔒 Authentication

Admin routes được bảo vệ bởi `AdminRoute`:
- Yêu cầu: `token` và `role` === "ADMIN" hoặc "STAFF"
- Redirect về `/home` nếu không đủ quyền

```typescript
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  return token && (role === "ADMIN" || role === "STAFF") 
    ? children 
    : <Navigate to="/home" />;
};
```

## 🎨 Design Features

### Layout
- **Sidebar cố định** sticky với scroll smooth
- **Breadcrumb** tự động theo route
- **Responsive** từ mobile → desktop
- **Color scheme** Tết theme (đỏ vàng vàng)

### Components
- ✅ Stats Cards với gradient icons
- ✅ Data Tables responsive
- ✅ Modal forms
- ✅ Grid/Card layouts
- ✅ Status badges
- ✅ Action buttons (View/Edit/Delete)
- ✅ Search & Filters
- ✅ Pagination

### Pages

#### 1. AdminOverview
- **Stats cards**: Doanh thu, Đơn hàng, Sản phẩm, Khách hàng
- **Quick actions**: Thêm nhanh các entities
- **Recent orders**: Đơn hàng gần đây
- **Top products**: Sản phẩm bán chạy
- **System status**: Trạng thái hệ thống

#### 2. AdminProducts
- **Table view** danh sách sản phẩm
- **Filters**: Tìm kiếm, Status, Category
- **Status badges**: ACTIVE, INACTIVE, TEMPLATE, DRAFT
- **Actions**: View, Edit, Delete
- **Pagination** với số lượng

#### 3. AdminCategories
- **Grid layout** card-based
- **Quick edit/delete** inline
- **Modal form** thêm/sửa
- **Product count** per category

#### 4. AdminConfigs
- **List view** với details preview
- **Config rules** display
- **Metrics**: Tổng khối lượng, Số quy tắc, Số sản phẩm
- **Expandable** config details

#### 5. AdminTemplates
- **Grid layout** với images
- **Clone count** tracking
- **Items preview** trong giỏ
- **Quick actions**: View, Remove template

## 🔌 API Integration

Tất cả pages hiện dùng **mock data**. Để integrate API:

```typescript
// Example: AdminProducts.tsx
import { productService } from '@/api';

useEffect(() => {
  const fetchProducts = async () => {
    const data = await productService.getAll();
    setProducts(data);
  };
  fetchProducts();
}, []);
```

### API Services đã có sẵn:
- ✅ `productService` - [productService.ts](../../../api/productService.ts)
- ✅ `categoryService` - [categoryService.ts](../../../api/categoryService.ts)
- ✅ `configService` - [configService.ts](../../../api/configService.ts)
- ✅ `productDetailService` - [productDetailService.ts](../../../api/productDetailService.ts)

## 📱 Responsive Breakpoints

```css
Mobile:  < 768px   (1 column)
Tablet:  768-1024px (2 columns)
Desktop: > 1024px  (3-4 columns)
```

## 🎯 Next Steps

### To-do List:
- [ ] Connect real API calls
- [ ] Add loading states
- [ ] Add error handling & toast notifications
- [ ] Implement real CRUD operations
- [ ] Add confirmation dialogs for delete
- [ ] Add image upload for products/templates
- [ ] Add advanced filters & sorting
- [ ] Add export to Excel feature
- [ ] Add real-time updates (WebSocket)
- [ ] Add activity logs

### Future Enhancements:
- [ ] Analytics dashboard với charts
- [ ] Inventory management integration
- [ ] Order tracking system
- [ ] Customer management
- [ ] Marketing campaigns
- [ ] Report generation
- [ ] Multi-language support

## 🛠️ Development

### Run dev server:
```bash
npm run dev
```

### Access admin panel:
1. Login với ADMIN/STAFF account
2. Navigate to: `http://localhost:5173/admin`

### Test accounts:
```
Admin: admin@tetgift.com / admin123
Staff: staff@tetgift.com / staff123
```

## 📝 Notes

- Tất cả icons từ `lucide-react`
- Styling với Tailwind CSS + custom Tết theme
- Layout pattern theo AccountLayout hiện có
- Responsive & accessible
- Ready for production data

---

**Created**: February 3, 2026
**Version**: 1.0.0
**Author**: TetGift Dev Team
