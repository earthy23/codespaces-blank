import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UECLogo } from "@/components/ui/uec-logo";
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
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor"/>
                        <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
                      </svg>
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-foreground"
                  >
                    {user.username}
                  </Badge>
                  <Link to="/profile">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-primary/20"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                        <circle cx="12" cy="8" r="5" fill="currentColor"/>
                        <path d="M20 21a8 8 0 1 0-16 0" fill="currentColor" opacity="0.7"/>
                      </svg>
                    </Button>
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hover:bg-destructive hover:text-destructive-foreground"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
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
