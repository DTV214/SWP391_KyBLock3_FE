import { Navigate, Outlet, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Nếu chưa có token, chuyển về trang login và lưu lại đường dẫn cũ
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập nhưng không có quyền (ví dụ Customer cố vào trang Staff)
  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />; // Hoặc chuyển về /home tùy dự án của bạn
  }

  // Hợp lệ thì render component con
  return <Outlet />;
}
