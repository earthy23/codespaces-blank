import { Link } from "react-router-dom";
import { UECLogo } from "@/components/ui/uec-logo";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function TopNavigation() {
  const { user } = useAuth();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm font-extralight pb-1.5 mt-auto px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo on the left */}
        <Link to="/" className="flex items-center">
          <UECLogo size="md" />
        </Link>

        {/* Profile section on the right */}
        {user && (
          <Link to="/profile">
            <Button variant="ghost" className="flex items-center space-x-3 hover:bg-primary/10 rounded-full px-4 py-2">
              {/* Circular profile avatar */}
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
                <span className="text-sm font-semibold text-primary">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              {/* Username */}
              <span className="text-sm font-medium text-foreground">
                {user.username}
              </span>
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
