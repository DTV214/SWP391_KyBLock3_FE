import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./layouts/components/Navbar";
import Footer from "./layouts/components/Footer";
import BackToTop from "./components/common/BackToTop";
import { CartProvider } from "./feature/cart/context/CartContext";
import CartSidebar from "./feature/cart/components/CartSidebar";
import "./App.css";

// Auth & Home
import LoginPage from "./feature/auth/pages/LoginPage";
import RegisterPage from "./feature/auth/pages/RegisterPage";
import HomePage from "./feature/homepage/pages/HomePage";
import ForgotPasswordPage from "./feature/auth/pages/ForgotPasswordPage";

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
import MyBasketsPage from "@/feature/account/pages/MyBasketsPage";
import AccountProfile from "@/feature/account/pages/AccountProfile";
import OrderHistory from "@/feature/account/pages/OrderHistory";
import AccountAddresses from "@/feature/account/pages/AccountAddresses";
import AccountVouchers from "@/feature/account/pages/AccountVouchers";

// Admin Module
import AdminLayout from "@/feature/admin/layouts/AdminLayout";
import AdminOverview from "@/feature/admin/pages/AdminOverview";
import AdminReports from "@/feature/admin/pages/AdminReports";
import AdminProducts from "@/feature/admin/pages/AdminProducts";
import AdminCategories from "@/feature/admin/pages/AdminCategories";
import AdminConfigs from "@/feature/admin/pages/AdminConfigs";
import AdminTemplates from "@/feature/admin/pages/AdminTemplates";
import AdminPromotions from "@/feature/admin/pages/AdminPromotions";
import AdminApprovalQuotationsPage from "@/feature/admin/pages/AdminApprovalQuotationsPage";
import AdminApprovalQuotationDetailPage from "@/feature/admin/pages/AdminApprovalQuotationDetailPage";
import AdminOrderHistory from "@/feature/admin/pages/AdminOrderHistory";
import AdminChatPage from "@/feature/chat/pages/AdminChatPage";
import AdminBlogs from "@/feature/admin/pages/AdminBlogs";
import AdminInventory from "@/feature/admin/pages/AdminInventory";
import AdminAccounts from "@/feature/admin/pages/AdminAccounts";
import AdminStoreLocations from "@/feature/admin/pages/AdminStoreLocations";
import AdminContactManagement from "@/feature/admin/pages/AdminContactManagement";

// Staff Module
import StaffLayout from "@/feature/staff/layout/StaffLayout";
import StaffQuotationsPage from "@/feature/staff/page/StaffQuotationsPage";
import StaffDashboardPage from "@/feature/staff/page/StaffDashboardPage";
import StaffQuotationDetailPage from "@/feature/staff/page/StaffQuotationDetailPage";
import StaffOrdersPage from "@/feature/staff/page/StaffOrdersPage";

// Product & Checkout Module
import ProductPage from "@/feature/product/pages/ProductPage";
import CustomBasketPage from "@/feature/product/pages/CustomBasketPage";
import ProductDetailPage from "@/feature/product/pages/ProductDetailPage";
import CheckoutPage from "@/feature/checkout/pages/CheckoutPage";
import PaymentSuccess from "@/feature/checkout/pages/PaymentSuccess";
import PaymentFailure from "@/feature/checkout/pages/PaymentFailure";
import VNPayReturn from "@/feature/checkout/pages/VNPayReturn";
import CustomerChatWidget from "@/feature/chat/components/CustomerChatWidget";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token) {
    if (role === "ADMIN") return <Navigate to="/admin" replace />;
    if (role === "STAFF") return <Navigate to="/staff" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  return token && role === "ADMIN" ? children : <Navigate to="/" replace />;
};

const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return token && (role === "STAFF" || role === "ADMIN") ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
};

function App() {
  const AppContent = () => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith("/admin");

    return (
      <div className="min-h-screen flex flex-col bg-tet-bg font-sans">
        {!isAdminRoute && <Navbar />}
        <main className="flex-grow">
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

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
            <Route path="/custom-basket" element={<CustomBasketPage />} />
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
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />

            {/* --- CUSTOMER ACCOUNT ROUTES --- */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<AccountOverview />} />
              <Route path="baskets" element={<MyBasketsPage />} />
              <Route path="baskets/:id/edit" element={<EditBasket />} />
              <Route path="profile" element={<AccountProfile />} />
              <Route path="orders" element={<OrderHistory />} />
              <Route path="orders/:orderId" element={<OrderHistory />} />
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
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboardPage />} />
              <Route path="quotations" element={<StaffQuotationsPage />} />
              <Route
                path="quotations/:id"
                element={<StaffQuotationDetailPage />}
              />
              <Route path="chats" element={<AdminChatPage />} />
              <Route path="orders" element={<StaffOrdersPage />} />
              <Route path="orders/:orderId" element={<StaffOrdersPage />} />
              <Route path="contacts" element={<AdminContactManagement />} />
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
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="configs" element={<AdminConfigs />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="promotions" element={<AdminPromotions />} />
              <Route path="orders" element={<AdminOrderHistory />} />
              <Route path="orders/:orderId" element={<AdminOrderHistory />} />
              <Route path="chats" element={<AdminChatPage />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="accounts" element={<AdminAccounts />} />
              <Route
                path="store-locations"
                element={<AdminStoreLocations />}
              />
              <Route path="contacts" element={<AdminContactManagement />} />
              <Route
                path="quotations"
                element={<AdminApprovalQuotationsPage />}
              />
              <Route
                path="quotations/:id"
                element={<AdminApprovalQuotationDetailPage />}
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
            <Route
              path="/checkout/success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
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
        <CartSidebar />
        <CustomerChatWidget />
      </div>
    );
  };

  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;
