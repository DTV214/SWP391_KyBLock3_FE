import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./layouts/components/Navbar";
import Footer from "./layouts/components/Footer";
import BackToTop from "./components/common/BackToTop";
import { KeyboardShortcutsHint } from "./lib/hooks/useKeyboardShortcuts";
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

// Product & Checkout Module
import ProductPage from "@/feature/product/pages/ProductPage";
import ProductDetailPage from "@/feature/product/pages/ProductDetailPage";
import CheckoutPage from "@/feature/checkout/pages/CheckoutPage";
import PaymentSuccess from "@/feature/checkout/pages/PaymentSuccess";
import PaymentFailure from "@/feature/checkout/pages/PaymentFailure";

// --- CÁC COMPONENT GÁC CỔNG (ROUTE GUARDS) ---

// 1. Chỉ dành cho người CHƯA đăng nhập (Ẩn Login/Register khi đã có Token)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/home" /> : children;
};

// 2. Chỉ dành cho người ĐÃ đăng nhập (Bảo vệ Account/Checkout)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

// 3. Chỉ dành cho Admin/Staff
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // Assuming role is stored
  return token && (role === "ADMIN" || role === "STAFF") ? (
    children
  ) : (
    <Navigate to="/home" />
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-tet-bg font-sans">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* TRANG CÔNG KHAI */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/introduce" element={<IntroducePage />} />
            <Route path="/blogs" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />

            {/* TRANG HẠN CHẾ (PUBLIC ONLY) */}
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

            {/* TRANG BẢO MẬT (PRIVATE ONLY) */}
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

            {/* ADMIN PANEL (ADMIN/STAFF ONLY) */}
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
            </Route>

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
          </Routes>
        </main>
        <Footer />
        <BackToTop />
        <KeyboardShortcutsHint />
      </div>
    </Router>
  );
}

export default App;
