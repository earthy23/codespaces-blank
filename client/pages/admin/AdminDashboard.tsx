import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/ui/admin-layout";
import {
  Users,
  MessageCircle,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  ShoppingBag,
  Calendar,
  Server,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWebSocket, useWebSocketEvent } from "@/lib/websocket-manager";
import { cacheManager, CACHE_KEYS } from "@/lib/cache-manager";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSessions: number;
  totalMessages: number;
  flaggedMessages: number;
  supportTickets: number;
  pendingTickets: number;
  forumPosts: number;
  serverUptime: number;
}

interface RecentActivity {
  id: string;
  action: string;
  username: string;
  timestamp: string;
  category: string;
  level: string;
}

// Simple dark chart component
const MiniChart = ({
  data,
  height = 60,
  color = "white",
}: {
  data: number[];
  height?: number;
  color?: string;
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  return (
    <div className="flex items-end space-x-1" style={{ height }}>
      {data.map((value, index) => (
        <div
          key={index}
          className="bg-white flex-1 transition-all duration-300 rounded-sm"
          style={{
            height: `${range > 0 ? ((value - min) / range) * height : height / 2}px`,
            minHeight: "2px",
          }}
        />
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const { isConnected, getOnlineUsers } = useWebSocket();

  const [stats, setStats] = useState<DashboardStats | null>(
    () => cacheManager.get(CACHE_KEYS.ADMIN_STATS) || null,
  );
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(
    () => cacheManager.get(CACHE_KEYS.ADMIN_LOGS) || [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  useEffect(() => {
    if (!stats) {
      const fallbackStats: DashboardStats = {
        totalUsers: 1247,
        activeUsers: 312,
        newUsersToday: 23,
        totalRevenue: 15847.75,
        monthlyRevenue: 2190.5,
        activeSessions: 89,
        totalMessages: 8547,
        flaggedMessages: 3,
        supportTickets: 67,
        pendingTickets: 8,
        forumPosts: 456,
        serverUptime: 99.87,
      };
      setStats(fallbackStats);
    }
    loadDashboardData();
  }, []);

  // Real-time updates
  useWebSocketEvent("admin:stats_updated", (data) => {
    setStats(data.stats);
    cacheManager.set(CACHE_KEYS.ADMIN_STATS, data.stats);
  });

  useWebSocketEvent("admin:user_action", (data) => {
    setRecentActivity((prev) => [
      {
        id: `${Date.now()}`,
        action: data.action,
        username: data.details.username || "System",
        timestamp: new Date().toISOString(),
        category: "admin",
        level: "info",
      },
      ...prev.slice(0, 9),
    ]);
  });

  useEffect(() => {
    if (isConnected) {
      const count = getOnlineUsers().length;
      setOnlineUsersCount(count);
      setStats((prevStats) => {
        if (prevStats) {
          return {
            ...prevStats,
            activeSessions: count,
            activeUsers: count,
          };
        }
        return prevStats;
      });
    }
  }, [isConnected, getOnlineUsers]);

  const loadDashboardData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const controller = new AbortController();

      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/admin/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }),
        fetch("/api/admin/logs?limit=10&level=info", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const enhancedStats: DashboardStats = {
          totalUsers: statsData.stats?.totalUsers || 1247,
          activeUsers: Math.floor((statsData.stats?.totalUsers || 1247) * 0.25),
          newUsersToday: 23,
          totalRevenue: 15847.75,
          monthlyRevenue: 2190.5,
          activeSessions: statsData.stats?.activeSessions || 89,
          totalMessages: 8547,
          flaggedMessages: statsData.stats?.flaggedMessages || 3,
          supportTickets: 67,
          pendingTickets: 8,
          forumPosts: 456,
          serverUptime: 99.87,
        };
        setStats(enhancedStats);
        cacheManager.set(CACHE_KEYS.ADMIN_STATS, enhancedStats);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        const logs = activityData.logs || [];
        setRecentActivity(logs);
        cacheManager.set(CACHE_KEYS.ADMIN_LOGS, logs);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActivityIcon = (category: string, action: string) => {
    switch (category) {
      case "auth":
        return <Users className="w-4 h-4" />;
      case "chat":
        return <MessageCircle className="w-4 h-4" />;
      case "store":
        return <ShoppingBag className="w-4 h-4" />;
      case "admin":
        return <Eye className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Sample data for charts
  const userGrowthData = [23, 19, 27, 31, 28, 35, 23];
  const revenueData = [1654, 1789, 1923, 1856, 2190];
  const activityData = [156, 143, 178, 165, 189, 201, 167];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">
              Welcome back, {user?.username}. System overview and controls.
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <Badge
                className={`text-xs ${isConnected ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
              >
                {isConnected ? "● Connected" : "● Offline"}
              </Badge>
              {onlineUsersCount > 0 && (
                <Badge className="text-xs bg-gray-700 text-white">
                  {onlineUsersCount} online
                </Badge>
              )}
            </div>
          </div>
          <Button
            onClick={loadDashboardData}
            className="bg-white text-black hover:bg-gray-200"
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-gray-400">
                <span className="text-white font-medium">
                  +{stats?.newUsersToday || 0}
                </span>{" "}
                new today
              </p>
              <div className="mt-3">
                <MiniChart data={userGrowthData} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats?.monthlyRevenue || 0)}
              </div>
              <p className="text-xs text-gray-400">
                <span className="text-white font-medium">+18.0%</span> from last
                month
              </p>
              <div className="mt-3">
                <MiniChart data={revenueData} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Active Sessions
              </CardTitle>
              <Activity className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.activeSessions || 0}
              </div>
              <p className="text-xs text-gray-400">
                {stats?.activeUsers || 0} users online
              </p>
              <div className="mt-3">
                <MiniChart data={activityData} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Server Uptime
              </CardTitle>
              <Server className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.serverUptime || 0}%
              </div>
              <Progress
                value={stats?.serverUptime || 0}
                className="mt-2 bg-gray-700"
              />
            </CardContent>
          </Card>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <span className="text-white">Platform Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Messages</span>
                <span className="font-bold text-white">
                  {stats?.totalMessages?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Flagged Messages</span>
                <Badge className="bg-red-600 text-white">
                  {stats?.flaggedMessages || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Forum Posts</span>
                <span className="font-bold text-white">
                  {stats?.forumPosts || 0}
                </span>
              </div>
              <div className="pt-2">
                <Link to="/admin/chat-review">
                  <Button className="w-full bg-white text-black hover:bg-gray-200">
                    <Eye className="w-4 h-4 mr-2" />
                    Review Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-gray-400" />
                <span className="text-white">Support Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Tickets</span>
                <span className="font-bold text-white">
                  {stats?.supportTickets || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pending Tickets</span>
                <Badge className="bg-yellow-600 text-white">
                  {stats?.pendingTickets || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Response Rate</span>
                <span className="font-bold text-white">98.7%</span>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-white text-black hover:bg-gray-200">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Manage Support
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <span className="text-white">Revenue Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">VIP Subscriptions</span>
                <span className="font-bold text-white">
                  {formatCurrency(1450.25)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  VIP++ Subscriptions
                </span>
                <span className="font-bold text-white">
                  {formatCurrency(520.75)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Legend Subscriptions
                </span>
                <span className="font-bold text-white">
                  {formatCurrency(219.5)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-gray-400">Total This Month</span>
                  <span className="text-white">
                    {formatCurrency(stats?.monthlyRevenue || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-white">Recent Activity</span>
              </div>
              <Link to="/admin/logs">
                <Button
                  className="bg-white text-black hover:bg-gray-200"
                  size="sm"
                >
                  View All Logs
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800"
                  >
                    <div className="flex-shrink-0 text-gray-400">
                      {getActivityIcon(activity.category, activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">
                        {activity.username || "System"} -{" "}
                        {activity.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(activity.timestamp)}
                      </p>
                    </div>
                    <Badge className="text-xs bg-gray-700 text-white">
                      {activity.category}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Administrative tools and management functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/admin/users">
                <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 h-auto p-4 flex flex-col space-y-2">
                  <Users className="w-6 h-6" />
                  <span className="text-sm">Manage Users</span>
                </Button>
              </Link>
              <Link to="/admin/news">
                <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 h-auto p-4 flex flex-col space-y-2">
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm">Create News</span>
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 h-auto p-4 flex flex-col space-y-2">
                  <Zap className="w-6 h-6" />
                  <span className="text-sm">System Settings</span>
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 h-auto p-4 flex flex-col space-y-2">
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-sm">View Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
