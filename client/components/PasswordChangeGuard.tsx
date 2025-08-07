import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

interface PasswordChangeGuardProps {
  children: React.ReactNode;
}

export function PasswordChangeGuard({ children }: PasswordChangeGuardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.mustChangePassword) {
      navigate("/force-password-change");
    }
  }, [user, navigate]);

  // Don't render children if user needs to change password
  if (user?.mustChangePassword) {
    return null;
  }

  return <>{children}</>;
}
