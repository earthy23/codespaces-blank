import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MinecraftBackground } from "@/components/ui/minecraft-background";
import { UECLogo } from "@/components/ui/uec-logo";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";

export default function ForcePasswordChange() {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if user doesn't need to change password
  if (!user?.mustChangePassword) {
    navigate("/dashboard");
    return null;
  }

  const validateForm = () => {
    const newErrors: string[] = [];

    if (formData.newPassword.length < 6) {
      newErrors.push("Password must be at least 6 characters long");
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.push("Passwords do not match");
    }

    if (
      formData.newPassword.toLowerCase().includes(user.username.toLowerCase())
    ) {
      newErrors.push("Password cannot contain your username");
    }

    if (
      formData.newPassword === "admin123" ||
      formData.newPassword === "password"
    ) {
      newErrors.push("Please choose a more secure password");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      await authApi.forcePasswordChange(
        formData.newPassword,
        formData.confirmPassword,
      );

      toast({
        title: "Password Changed Successfully",
        description:
          "Your password has been updated. You can now access all features.",
      });

      // Refresh user data to update mustChangePassword flag
      await refreshUser();

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description:
          error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <MinecraftBackground>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="minecraft-panel border-red-500 border-2">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <UECLogo size="sm" className="mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-red-500 flex items-center justify-center gap-2">
                <Lock className="w-6 h-6" />
                Security Required
              </CardTitle>
              <CardDescription className="text-center">
                For security reasons, you must change your temporary password
                before continuing.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Alert className="mb-6 border-orange-500 bg-orange-500/10">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-600">
                  <strong>First-time login detected.</strong> Please set a
                  secure password to protect your admin account.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter a secure password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      handleInputChange("newPassword", e.target.value)
                    }
                    className="minecraft-input"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="minecraft-input"
                    required
                  />
                </div>

                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full minecraft-button bg-red-500 hover:bg-red-600 text-white"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Updating Password..." : "Change Password"}
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>Password Requirements:</strong>
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• At least 6 characters long</li>
                      <li>• Cannot contain your username</li>
                      <li>• Must be different from common passwords</li>
                      <li>• Use a mix of letters, numbers, and symbols</li>
                    </ul>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Account:</strong> {user?.username} ({user?.role})
            </p>
          </div>
        </div>
      </div>
    </MinecraftBackground>
  );
}
