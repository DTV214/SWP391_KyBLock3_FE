import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./layouts/components/Navbar";
import Footer from "./layouts/components/Footer";
import BackToTop from "./components/common/BackToTop";
import ChatBot from "./components/common/ChatBot";
import { CartProvider } from "./feature/cart/context/CartContext";
import CartSidebar from "./feature/cart/components/CartSidebar";
import "./App.css";

// Auth & Home
import LoginPage from "./feature/auth/pages/LoginPage";
import RegisterPage from "./feature/auth/pages/RegisterPage";
import HomePage from "./feature/homepage/pages/HomePage";

// News & Intro
import IntroducePage from "@/feature/introduce/pages/IntroducePage";
import BlogPage from "@/feature/blog/pages/BlogPage";
import BlogDetailPage from "@/feature/blog/pages/BlogDetailPage";
import ContactPage from "@/feature/contact/pages/ContactPage";
import QuotationIntroPage from "@/feature/quotation/pages/QuotationIntroPage";
import QuotationCreatePage from "@/feature/quotation/pages/QuotationCreatePage";
import QuotationStatusPage from "@/feature/quotation/pages/QuotationStatusPage";
import QuotationHistoryPage from "@/feature/quotation/pages/QuotationHistoryPage";

// Account Module
import AccountLayout from "@/feature/account/layouts/AccountLayout";
import AccountOverview from "@/feature/account/pages/AccountOverview";
import EditBasket from "@/feature/account/pages/EditBasket";
import AccountProfile from "@/feature/account/pages/AccountProfile";
import OrderHistory from "@/feature/account/pages/OrderHistory";
import AccountAddresses from "@/feature/account/pages/AccountAddresses";
import AccountVouchers from "@/feature/account/pages/AccountVouchers";

// Admin Module
import AdminLayout from "@/feature/admin/layouts/AdminLayout";
import AdminOverview from "@/feature/admin/pages/AdminOverview";
import AdminProducts from "@/feature/admin/pages/AdminProducts";
import AdminCategories from "@/feature/admin/pages/AdminCategories";
import AdminConfigs from "@/feature/admin/pages/AdminConfigs";
import AdminTemplates from "@/feature/admin/pages/AdminTemplates";
import AdminQuotationsPage from "@/feature/admin/pages/AdminQuotationsPage"; // Admin duyệt list
import AdminQuotationDetailPage from "@/feature/admin/pages/AdminQuotationDetailPage"; // Admin duyệt chi tiết
import AdminApprovalQuotationsPage from "@/feature/admin/pages/AdminApprovalQuotationsPage";
import AdminApprovalQuotationDetailPage from "@/feature/admin/pages/AdminApprovalQuotationDetailPage";
import AdminOrderHistory from "@/feature/admin/pages/AdminOrderHistory";
import AdminChatPage from "@/feature/chat/pages/AdminChatPage";

// Staff Module
import StaffLayout from "@/feature/staff/layout/StaffLayout";
import StaffQuotationsPage from "@/feature/staff/page/StaffQuotationsPage";
import StaffDashboardPage from "@/feature/staff/page/StaffDashboardPage";
import StaffQuotationDetailPage from "@/feature/staff/page/StaffQuotationDetailPage";
import StaffOrdersPage from "@/feature/staff/page/StaffOrdersPage";

// Product & Checkout Module
import ProductPage from "@/feature/product/pages/ProductPage";
import AllProductsPage from "@/feature/product/pages/AllProductsPage";
import ProductDetailPage from "@/feature/product/pages/ProductDetailPage";
import CheckoutPage from "@/feature/checkout/pages/CheckoutPage";
import PaymentSuccess from "@/feature/checkout/pages/PaymentSuccess";
import PaymentFailure from "@/feature/checkout/pages/PaymentFailure";
import VNPayReturn from "@/feature/checkout/pages/VNPayReturn";
import CustomerChatWidget from "@/feature/chat/components/CustomerChatWidget";
import AdminBlogs from "@/feature/admin/pages/AdminBlogs";
import AdminInventory from "@/feature/admin/pages/AdminInventory";
import AdminAccounts from "@/feature/admin/pages/AdminAccounts";

// --- MIDDLEWARES ---
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token) {
    if (role === "ADMIN") return <Navigate to="/admin" replace />;
    if (role === "STAFF") return <Navigate to="/staff" replace />;
    return <Navigate to="/home" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  return token && role === "ADMIN" ? children : <Navigate to="/home" />;
};

const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  // Cho phép ADMIN truy cập cả trang STAFF nếu cần thiết, hoặc có thể chỉ giới hạn "STAFF"
  return token && (role === "STAFF" || role === "ADMIN") ? (
    children
  ) : (
    <Navigate to="/home" />
  );
};

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-tet-bg font-sans">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* --- PUBLIC ROUTES --- */}
              <Route path="/home" element={<HomePage />} />
              <Route path="/introduce" element={<IntroducePage />} />
              <Route path="/blogs" element={<BlogPage />} />
              <Route path="/blog/:id" element={<BlogDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/quotation" element={<QuotationIntroPage />} />
              <Route
                path="/quotation/create"
                element={<QuotationCreatePage />}
              />
              <Route
                path="/quotation/history"
                element={<QuotationHistoryPage />}
              />
              <Route
                path="/quotation/status/:id"
                element={<QuotationStatusPage />}
              />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/all-products" element={<AllProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />

              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route path="/" element={<Navigate to="/home" />} />

              {/* --- CUSTOMER ACCOUNT ROUTES --- */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="overview" />} />
                <Route path="overview" element={<AccountOverview />} />
                <Route path="baskets/:id/edit" element={<EditBasket />} />
                <Route path="profile" element={<AccountProfile />} />
                <Route path="orders" element={<OrderHistory />} />
                <Route path="addresses" element={<AccountAddresses />} />
                <Route path="vouchers" element={<AccountVouchers />} />
              </Route>

              {/* --- STAFF ROUTES --- */}
              <Route
                path="/staff"
                element={
                  <StaffRoute>
                    <StaffLayout />
                  </StaffRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="dashboard" element={<StaffDashboardPage />} />
                <Route path="quotations" element={<StaffQuotationsPage />} />
                <Route
                  path="quotations/:id"
                  element={<StaffQuotationDetailPage />}
                />
                <Route path="orders" element={<StaffOrdersPage />} />
              </Route>

              {/* --- ADMIN ROUTES --- */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="overview" />} />
                <Route path="overview" element={<AdminOverview />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="configs" element={<AdminConfigs />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="orders" element={<AdminOrderHistory />} />
                <Route path="chats" element={<AdminChatPage />} />
                <Route path="blogs" element={<AdminBlogs />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="accounts" element={<AdminAccounts />} />
                <Route
                  path="quotations"
                  element={<AdminApprovalQuotationsPage />}
                />
                <Route
                  path="quotations/:id"
                  element={<AdminApprovalQuotationDetailPage />}
                />
                <Route
                  path="reviewing-quotations"
                  element={<AdminQuotationsPage />}
                />
                <Route
                  path="reviewing-quotations/:id"
                  element={<AdminQuotationDetailPage />}
                />
              </Route>

              {/* --- CHECKOUT ROUTES --- */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failure" element={<PaymentFailure />} />
              <Route path="/payments/vnpay-return" element={<VNPayReturn />} />
            </Routes>
          </main>
          <Footer />
          <BackToTop />
          <ChatBot />
          <CartSidebar />
          <CustomerChatWidget />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
