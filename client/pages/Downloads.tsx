import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { UserLayout } from "@/components/ui/user-layout";

export default function Downloads() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="max-w-6xl">
        {/* Downloads Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Download Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Download center for UEC Launcher. Downloads will be available soon.
          </p>
        </div>

        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Downloads and clients will be available in a future update.
          </p>
          <Link to="/dashboard">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
