import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  Shield,
  Users,
  MessageCircle,
  Settings,
  ShoppingBag,
  Newspaper,
  Calendar,
  BarChart3,
  FileText,
  Download,
  Palette,
  Globe,
  Mail,
  Server,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    section: "Overview",
    items: [
      { icon: BarChart3, label: "Dashboard", path: "/admin", exactMatch: true },
      { icon: Activity, label: "Analytics", path: "/admin/analytics" },
    ],
  },
  {
    section: "User Management",
    items: [
      { icon: Users, label: "Users", path: "/admin/users" },
      { icon: MessageCircle, label: "Chat Review", path: "/admin/chat-review" },
    ],
  },
  {
    section: "Content",
    items: [
      { icon: Newspaper, label: "News", path: "/admin/news" },
      { icon: Calendar, label: "Events", path: "/admin/events" },
      { icon: Server, label: "Servers", path: "/admin/servers" },
    ],
  },
  {
    section: "System",
    items: [
      { icon: FileText, label: "Logs", path: "/admin/logs" },
      { icon: ShoppingBag, label: "Clients", path: "/admin/clients" },
      { icon: Download, label: "Downloads", path: "/admin/downloads" },
    ],
  },
  {
    section: "Settings",
    items: [
      { icon: Settings, label: "General", path: "/admin/settings" },
      { icon: Globe, label: "Domains", path: "/admin/domains" },
      { icon: Mail, label: "Email", path: "/admin/email" },
      { icon: Palette, label: "UI Editor", path: "/admin/ui-editor" },
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="minecraft-button"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-card/50 border-r-2 border-border transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-72"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-primary">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">
                  Welcome, {user?.username}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="minecraft-button"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminNavItems.map((section) => (
            <div key={section.section}>
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                  {section.section}
                </h3>
              )}
              <div className="space-y-1 mb-4">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path, item.exactMatch);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        active
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                      title={sidebarCollapsed ? item.label : ""}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
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
        <div className="p-4 border-t border-border">
          <div className="space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title={sidebarCollapsed ? "Back to Dashboard" : ""}
            >
              <Home className="w-5 h-5" />
              {!sidebarCollapsed && (
                <span className="text-sm">Back to Dashboard</span>
              )}
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={`w-full justify-start space-x-3 px-3 py-2 hover:bg-red-500/20 hover:text-red-500 ${
                sidebarCollapsed ? "px-2" : ""
              }`}
              title={sidebarCollapsed ? "Logout" : ""}
            >
              <LogOut className="w-5 h-5" />
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
          className="minecraft-button bg-card/90 backdrop-blur"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 bg-card/95 backdrop-blur border-r-2 border-border">
            {/* Mobile Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">
                  Welcome, {user?.username}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="minecraft-button"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {adminNavItems.map((section) => (
                <div key={section.section}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                    {section.section}
                  </h3>
                  <div className="space-y-1 mb-4">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path, item.exactMatch);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            active
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
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
            <div className="p-4 border-t border-border space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start space-x-3 px-3 py-2 hover:bg-red-500/20 hover:text-red-500"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
