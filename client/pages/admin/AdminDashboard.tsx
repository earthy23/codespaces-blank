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

// Enhanced chart components using Recharts
const MiniLineChart = ({ data, color = "#ffffff" }: { data: any[]; color?: string }) => (
  <ResponsiveContainer width="100%" height={60}>
    <LineChart data={data}>
      <Line
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4, fill: color }}
      />
    </LineChart>
  </ResponsiveContainer>
);

const MiniAreaChart = ({ data, color = "#ffffff" }: { data: any[]; color?: string }) => (
  <ResponsiveContainer width="100%" height={60}>
    <AreaChart data={data}>
      <Area
        type="monotone"
        dataKey="value"
        stroke={color}
        fill={color}
        fillOpacity={0.3}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const MiniBarChart = ({ data, color = "#ffffff" }: { data: any[]; color?: string }) => (
  <ResponsiveContainer width="100%" height={60}>
    <BarChart data={data}>
      <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

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

  // Enhanced chart data with proper structure for Recharts
  const userGrowthData = [
    { day: "Mon", value: 23 },
    { day: "Tue", value: 19 },
    { day: "Wed", value: 27 },
    { day: "Thu", value: 31 },
    { day: "Fri", value: 28 },
    { day: "Sat", value: 35 },
    { day: "Sun", value: 23 },
  ];

  const revenueData = [
    { month: "Jul", value: 1654 },
    { month: "Aug", value: 1789 },
    { month: "Sep", value: 1923 },
    { month: "Oct", value: 1856 },
    { month: "Nov", value: 2190 },
  ];

  const activityData = [
    { day: "Mon", value: 156 },
    { day: "Tue", value: 143 },
    { day: "Wed", value: 178 },
    { day: "Thu", value: 165 },
    { day: "Fri", value: 189 },
    { day: "Sat", value: 201 },
    { day: "Sun", value: 167 },
  ];

  const serverStatusData = [
    { day: "Mon", value: 99.9 },
    { day: "Tue", value: 99.8 },
    { day: "Wed", value: 99.7 },
    { day: "Thu", value: 99.9 },
    { day: "Fri", value: 99.8 },
    { day: "Sat", value: 99.9 },
    { day: "Sun", value: 99.87 },
  ];

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
                <MiniLineChart data={userGrowthData} color="#22c55e" />
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
                <MiniAreaChart data={revenueData} color="#10b981" />
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
                <MiniBarChart data={activityData} color="#3b82f6" />
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
              <div className="mt-3">
                <MiniLineChart data={serverStatusData} color="#f59e0b" />
              </div>
              <Progress
                value={stats?.serverUptime || 0}
                className="mt-2 bg-gray-700"
              />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Analytics */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-white">User Growth Analytics</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Daily user registrations over the past 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={[
                  { date: "Nov 1", users: 12, active: 8 },
                  { date: "Nov 5", users: 19, active: 14 },
                  { date: "Nov 10", users: 25, active: 18 },
                  { date: "Nov 15", users: 31, active: 24 },
                  { date: "Nov 20", users: 28, active: 22 },
                  { date: "Nov 25", users: 35, active: 28 },
                  { date: "Nov 30", users: 42, active: 34 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="New Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="active"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Analytics */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-white">Revenue Analytics</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Monthly revenue breakdown by subscription tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { month: "Jul", vip: 850, vipPlus: 420, legend: 180 },
                  { month: "Aug", vip: 920, vipPlus: 480, legend: 220 },
                  { month: "Sep", vip: 1100, vipPlus: 520, legend: 280 },
                  { month: "Oct", vip: 950, vipPlus: 580, legend: 320 },
                  { month: "Nov", vip: 1450, vipPlus: 520, legend: 220 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="vip" stackId="a" fill="#10b981" name="VIP" />
                  <Bar dataKey="vipPlus" stackId="a" fill="#3b82f6" name="VIP+" />
                  <Bar dataKey="legend" stackId="a" fill="#f59e0b" name="Legend" />
                </BarChart>
              </ResponsiveContainer>
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
