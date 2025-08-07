import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", path: "/admin", exactMatch: true },
      { label: "Analytics", path: "/admin/analytics" },
    ],
  },
  {
    section: "Management", 
    items: [
      { label: "Users", path: "/admin/users" },
      { label: "News", path: "/admin/news" },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Logs", path: "/admin/logs" },
      { label: "Settings", path: "/admin/settings" },
    ],
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string, exactMatch?: boolean) => {
    if (exactMatch) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (user?.role !== "admin" && user?.role !== "mod") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="bg-white border border-gray-300">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2 text-gray-900">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-300 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-72"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-600">
                  Welcome, {user?.username}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-900 hover:text-gray-600 hover:bg-gray-100"
            >
              {sidebarCollapsed ? (
                <span className="text-sm">»</span>
              ) : (
                <span className="text-sm">«</span>
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminNavItems.map((section) => (
            <div key={section.section}>
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-2">
                  {section.section}
                </h3>
              )}
              <div className="space-y-1 mb-4">
                {section.items.map((item) => {
                  const active = isActive(item.path, item.exactMatch);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        active
                          ? "bg-gray-900 text-white"
                          : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                      }`}
                      title={sidebarCollapsed ? item.label : ""}
                    >
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-300">
          <div className="space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
              title={sidebarCollapsed ? "Back to Dashboard" : ""}
            >
              {!sidebarCollapsed && (
                <span className="text-sm">Back to Dashboard</span>
              )}
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={`w-full justify-start space-x-3 px-3 py-2 hover:bg-gray-100 hover:text-gray-900 text-gray-700 ${
                sidebarCollapsed ? "px-2" : ""
              }`}
              title={sidebarCollapsed ? "Logout" : ""}
            >
              {!sidebarCollapsed && <span className="text-sm">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(true)}
          className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
        >
          <span className="text-sm">☰</span>
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 bg-white border-r border-gray-300">
            {/* Mobile Header */}
            <div className="p-4 border-b border-gray-300 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-600">
                  Welcome, {user?.username}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-900 hover:text-gray-600 hover:bg-gray-100"
              >
                <span className="text-sm">✕</span>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {adminNavItems.map((section) => (
                <div key={section.section}>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-2">
                    {section.section}
                  </h3>
                  <div className="space-y-1 mb-4">
                    {section.items.map((item) => {
                      const active = isActive(item.path, item.exactMatch);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            active
                              ? "bg-gray-900 text-white"
                              : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-gray-300 space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span className="text-sm">Back to Dashboard</span>
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start space-x-3 px-3 py-2 hover:bg-gray-100 hover:text-gray-900 text-gray-700"
              >
                <span className="text-sm">Logout</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
