import { AuthLayout } from "../components/AuthLayout";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Khôi Phục Mật Khẩu">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
