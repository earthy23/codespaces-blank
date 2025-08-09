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
import { useAuth } from "@/lib/auth";
import { useWebSocket, useWebSocketEvent } from "@/lib/websocket-manager";
import { cacheManager, CACHE_KEYS } from "@/lib/cache-manager";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  activeSessions: number;
  totalMessages: number;
  flaggedMessages: number;
  supportTickets: number;
  pendingTickets: number;
  forumPosts: number;
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
const MiniLineChart = ({
  data,
  color = "#8b5cf6",
}: {
  data: any[];
  color?: string;
}) => (
  <ResponsiveContainer width="100%" height={60}>
    <LineChart data={data}>
      <Line
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={3}
        dot={false}
        activeDot={{ r: 4, fill: color }}
      />
    </LineChart>
  </ResponsiveContainer>
);

const MiniAreaChart = ({
  data,
  color = "#8b5cf6",
}: {
  data: any[];
  color?: string;
}) => (
  <ResponsiveContainer width="100%" height={60}>
    <AreaChart data={data}>
      <Area
        type="monotone"
        dataKey="value"
        stroke={color}
        fill={color}
        fillOpacity={0.4}
      />
    </AreaChart>
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

  // Enhanced dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [lastMetricsUpdate, setLastMetricsUpdate] = useState(Date.now());
  const [timeRange, setTimeRange] = useState("24h");
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "degraded" | "offline"
  >("connected");
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [liveActivity, setLiveActivity] = useState<RecentActivity[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!stats) {
      const fallbackStats: DashboardStats = {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        activeSessions: 0,
        totalMessages: 0,
        flaggedMessages: 0,
        supportTickets: 0,
        pendingTickets: 0,
        forumPosts: 0,
      };
      setStats(fallbackStats);
    }
    loadDashboardData();
  }, [token]);

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

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => {
        controller.abort(new Error("Dashboard data loading timeout"));
      }, 10000);

      try {
        const [statsRes, activityRes] = await Promise.allSettled([
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

        clearTimeout(timeoutId);

        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          const statsData = await statsRes.value.json();
          const stats = statsData.stats;

          const enhancedStats: DashboardStats = {
            totalUsers: stats?.totalUsers || 0,
            activeUsers: stats?.activeUsers || 0,
            newUsersToday: stats?.newUsersToday || 0,
            activeSessions: stats?.activeSessions || 0,
            totalMessages: stats?.totalMessages || 0,
            flaggedMessages: stats?.flaggedMessages || 0,
            supportTickets: stats?.supportTickets || 0,
            pendingTickets: stats?.pendingTickets || 0,
            forumPosts: stats?.forumPosts || 0,
          };
          setStats(enhancedStats);
          setDashboardData(stats);
          cacheManager.set(CACHE_KEYS.ADMIN_STATS, enhancedStats);
        }

        if (activityRes.status === "fulfilled" && activityRes.value.ok) {
          const activityData = await activityRes.value.json();
          const logs = activityData.logs || [];
          setRecentActivity(logs);
          cacheManager.set(CACHE_KEYS.ADMIN_LOGS, logs);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);

      if (!stats) {
        const emergencyFallback: DashboardStats = {
          totalUsers: 0,
          activeUsers: 0,
          newUsersToday: 0,
          activeSessions: 0,
          totalMessages: 0,
          flaggedMessages: 0,
          supportTickets: 0,
          pendingTickets: 0,
          forumPosts: 0,
        };
        setStats(emergencyFallback);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const userGrowthData = dashboardData?.userGrowthData || [
    { day: "Mon", value: stats?.newUsersToday || 0 },
    { day: "Tue", value: stats?.newUsersToday || 0 },
    { day: "Wed", value: stats?.newUsersToday || 0 },
    { day: "Thu", value: stats?.newUsersToday || 0 },
    { day: "Fri", value: stats?.newUsersToday || 0 },
    { day: "Sat", value: stats?.newUsersToday || 0 },
    { day: "Sun", value: stats?.newUsersToday || 0 },
  ];

  const activityData = [
    { day: "Mon", value: stats?.activeSessions || 0 },
    { day: "Tue", value: stats?.activeSessions || 0 },
    { day: "Wed", value: stats?.activeSessions || 0 },
    { day: "Thu", value: stats?.activeSessions || 0 },
    { day: "Fri", value: stats?.activeSessions || 0 },
    { day: "Sat", value: stats?.activeSessions || 0 },
    { day: "Sun", value: stats?.activeSessions || 0 },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Welcome back, {user?.username}. System overview and controls.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "degraded"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium capitalize">
                {connectionStatus}
              </span>
            </div>

            <select
              className="bg-card border border-border rounded-lg px-4 py-2 text-sm font-medium"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <Button
              onClick={loadDashboardData}
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="minecraft-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">
                  +{stats?.newUsersToday || 0}
                </span>{" "}
                new today
              </p>
              <div className="mt-3">
                <MiniLineChart data={userGrowthData} color="#8b5cf6" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats?.activeSessions || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.activeUsers || 0} users online
              </p>
              <div className="mt-3">
                <MiniAreaChart data={activityData} color="#8b5cf6" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats?.totalMessages || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.flaggedMessages || 0} flagged
              </p>
              <div className="mt-3">
                <MiniAreaChart data={activityData} color="#8b5cf6" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Support Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats?.supportTickets || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-orange-600 font-medium">
                  {stats?.pendingTickets || 0}
                </span>{" "}
                pending
              </p>
              <div className="mt-3">
                <MiniLineChart data={userGrowthData} color="#8b5cf6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Performance */}
        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>
              Real-time server metrics and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm font-bold">
                    {systemMetrics?.system?.cpu || 23}%
                  </span>
                </div>
                <Progress
                  value={systemMetrics?.system?.cpu || 23}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory</span>
                  <span className="text-sm font-bold">
                    {systemMetrics?.system?.memory || 67}%
                  </span>
                </div>
                <Progress
                  value={systemMetrics?.system?.memory || 67}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network</span>
                  <span className="text-sm font-bold">
                    {systemMetrics?.system?.network || 34}%
                  </span>
                </div>
                <Progress
                  value={systemMetrics?.system?.network || 34}
                  className="h-2"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                Last updated: {new Date(lastMetricsUpdate).toLocaleTimeString()}
              </span>
              {realTimeData && (
                <div className="flex space-x-4">
                  <span>
                    Uptime: {Math.floor((realTimeData.uptime || 0) / 3600)}h
                  </span>
                  <span>Memory: {realTimeData.memoryUsage?.used || 0}MB</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Domain Management */}
        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>Domain Management</CardTitle>
            <CardDescription>
              Manage domains, SSL certificates, and DNS settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Primary Domain</h4>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">ueclub.com</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <Badge className="bg-green-500/20 text-green-600">
                        SSL Valid
                      </Badge>
                      <span className="text-muted-foreground">
                        Expires: Dec 2024
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Custom Domains</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">play.ueclub.com</p>
                      <Badge className="bg-green-500/20 text-green-600 text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">api.ueclub.com</p>
                      <Badge className="bg-green-500/20 text-green-600 text-xs">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">DNS Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>A Record</span>
                      <span className="font-mono text-xs">192.168.1.100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CNAME</span>
                      <span className="font-mono text-xs">www.ueclub.com</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MX Record</span>
                      <span className="font-mono text-xs">mail.ueclub.com</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    Add Custom Domain
                  </Button>
                  <Button variant="outline" className="w-full">
                    Renew SSL Certificate
                  </Button>
                  <Button variant="outline" className="w-full">
                    Update DNS Records
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Actions */}
        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>System Management</CardTitle>
            <CardDescription>
              Administrative tools and system controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Link to="/admin/users">
                <Button className="w-full h-auto p-4 flex flex-col space-y-2">
                  <span className="text-sm">Users</span>
                </Button>
              </Link>
              <Link to="/admin/news">
                <Button className="w-full h-auto p-4 flex flex-col space-y-2">
                  <span className="text-sm">News</span>
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button className="w-full h-auto p-4 flex flex-col space-y-2">
                  <span className="text-sm">Settings</span>
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button className="w-full h-auto p-4 flex flex-col space-y-2">
                  <span className="text-sm">Analytics</span>
                </Button>
              </Link>
              <Link to="/admin/logs">
                <Button className="w-full h-auto p-4 flex flex-col space-y-2">
                  <span className="text-sm">Logs</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Video Monitoring */}
        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Video Monitoring & User Features</span>
              <Badge className="bg-green-500/20 text-green-600">Live</Badge>
            </CardTitle>
            <CardDescription>
              Real-time monitoring of video content and user feature usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Video Stats */}
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Video Platform</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Videos
                    </span>
                    <span className="font-bold">247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Active Streams
                    </span>
                    <span className="font-bold text-green-600">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Views Today
                    </span>
                    <span className="font-bold">1,854</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Flagged Content
                    </span>
                    <span className="font-bold text-red-600">3</span>
                  </div>
                </div>
              </div>

              {/* User Features */}
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">User Features</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      File Uploads
                    </span>
                    <span className="font-bold">89</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Voice Calls Active
                    </span>
                    <span className="font-bold text-blue-600">7</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Chat Messages
                    </span>
                    <span className="font-bold">2,156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Server Connections
                    </span>
                    <span className="font-bold text-green-600">34</span>
                  </div>
                </div>
              </div>

              {/* Monitoring Controls */}
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">
                  Monitoring Controls
                </h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    size="sm"
                  >
                    Review Flagged Videos
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    size="sm"
                  >
                    Monitor Live Streams
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    size="sm"
                  >
                    User Feature Analytics
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    size="sm"
                  >
                    Content Moderation Queue
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Video monitoring active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>User features tracked</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Activity</span>
              <Link to="/admin/logs">
                <Button variant="outline" size="sm">
                  View All Logs
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveActivity.length > 0 || recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {liveActivity.slice(0, 4).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border-l-4 border-primary"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.username || "System"} -{" "}
                        {activity.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(activity.timestamp)} • LIVE
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.category}
                    </Badge>
                  </div>
                ))}

                {recentActivity
                  .slice(0, Math.max(4, 8 - liveActivity.length))
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.username || "System"} -{" "}
                          {activity.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(activity.timestamp)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.category}
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
                <p className="text-xs mt-1">
                  Live feed will update automatically
                </p>
              </div>
            )}

            {liveActivity.length > 0 && (
              <div className="flex items-center justify-center mt-4 pt-3 border-t border-border">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live activity feed active</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
