import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UECLogo } from "@/components/ui/uec-logo";
import { LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export function TopNavigation() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("auth_token");
      navigate("/login");
    }
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/">
              <UECLogo size="md" showText={false} />
            </Link>
            <Link to="/">
              <h1 className="text-2xl font-bold text-primary">UEC Launcher</h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {isAdmin() && (
                  <Link to="/admin">
                    <Button
                      variant="outline"
                      className="minecraft-border bg-card border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-lg hover:shadow-destructive/20"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Badge
                  variant="secondary"
                  className="bg-primary/20 text-foreground"
                >
                  {user.username}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-foreground hover:text-primary"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
