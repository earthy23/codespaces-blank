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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Activity,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  Settings,
  Zap,
  Cpu,
  HardDrive,
  Network,
  TrendingUp,
  Eye,
  UserCheck,
  RefreshCw,
} from "lucide-react";

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
const MiniLineChart = ({ data, color = "#8b5cf6" }: { data: any[]; color?: string }) => (
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

const MiniAreaChart = ({ data, color = "#8b5cf6" }: { data: any[]; color?: string }) => (
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

const MiniBarChart = ({ data, color = "#8b5cf6" }: { data: any[]; color?: string }) => (
  <ResponsiveContainer width="100%" height={60}>
    <BarChart data={data}>
      <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} stroke={color} strokeWidth={1} />
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

  // Enhanced dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [lastMetricsUpdate, setLastMetricsUpdate] = useState(Date.now());
  const [timeRange, setTimeRange] = useState("24h");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "degraded" | "offline">("connected");
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [liveActivity, setLiveActivity] = useState<RecentActivity[]>([]);
  const [lastActivityUpdate, setLastActivityUpdate] = useState(Date.now());
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

    // Set up real-time metrics updates every 30 seconds with robust error handling
    const metricsInterval = setInterval(async () => {
      if (!token || !user) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        // Check for FullStory interference
        const isFullStoryBlocking = () => {
          try {
            return window.fetch !== fetch ||
                   (window.fetch.toString().includes('fullstory') ||
                    document.querySelector('script[src*="fullstory"]') !== null);
          } catch {
            return false;
          }
        };

        let response;
        if (isFullStoryBlocking()) {
          // Use XMLHttpRequest as fallback when FullStory is interfering
          response = await new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/api/admin/metrics/realtime');
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.timeout = 15000;

            xhr.onload = () => {
              try {
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve({
                    ok: true,
                    status: xhr.status,
                    json: () => Promise.resolve(JSON.parse(xhr.responseText))
                  });
                } else {
                  resolve({ ok: false, status: xhr.status });
                }
              } catch (parseError) {
                resolve({ ok: false, status: xhr.status });
              }
            };

            xhr.onerror = () => resolve({ ok: false, status: 0 });
            xhr.ontimeout = () => resolve({ ok: false, status: 408 });

            try {
              xhr.send();
            } catch (sendError) {
              resolve({ ok: false, status: 0 });
            }
          });
        } else {
          try {
            response = await fetch("/api/admin/metrics/realtime", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            });
          } catch (fetchError) {
            response = { ok: false, status: 0 };
          }
        }

        clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            setSystemMetrics(data.metrics);
            setRealTimeData(data.metrics);
            setLastMetricsUpdate(Date.now());
            setConnectionStatus("connected");

            // Update live stats if we have real-time user data
            if (data.metrics.userActivity) {
              setStats(prevStats => {
                if (prevStats) {
                  return {
                    ...prevStats,
                    totalUsers: data.metrics.userActivity.totalUsers,
                    activeUsers: data.metrics.userActivity.activeUsers,
                    activeSessions: data.metrics.activeConnections,
                  };
                }
                return prevStats;
              });
            }
          } else {
            console.warn("Metrics update failed, keeping previous data");
            setConnectionStatus("degraded");
          }
      } catch (error) {
        // Silently handle all errors to prevent console spam
        setConnectionStatus("degraded");
      }
    }, 30000); // Increased interval to 30 seconds

    // Set up live activity feed updates every 30 seconds with robust error handling
    const activityInterval = setInterval(async () => {
      if (!token || !user) return;

      let controller;
      let timeoutId;
      try {
        controller = new AbortController();
        timeoutId = setTimeout(() => {
          controller.abort();
        }, 15000); // 15 second timeout

          // Check for FullStory interference
          const isFullStoryBlocking = () => {
            try {
              return window.fetch !== fetch ||
                     (window.fetch.toString().includes('fullstory') ||
                      document.querySelector('script[src*="fullstory"]') !== null);
            } catch {
              return false;
            }
          };

          let response;
          if (isFullStoryBlocking()) {
            // Use XMLHttpRequest as fallback
            response = await new Promise((resolve) => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', `/api/admin/activity/live?since=${lastActivityUpdate}&limit=10`);
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
              xhr.setRequestHeader('Content-Type', 'application/json');
              xhr.timeout = 15000;

              xhr.onload = () => {
                try {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({
                      ok: true,
                      json: () => Promise.resolve(JSON.parse(xhr.responseText))
                    });
                  } else {
                    resolve({ ok: false });
                  }
                } catch (parseError) {
                  resolve({ ok: false });
                }
              };

              xhr.onerror = () => resolve({ ok: false });
              xhr.ontimeout = () => resolve({ ok: false });

              try {
                xhr.send();
              } catch (sendError) {
                resolve({ ok: false });
              }
            });
          } else {
            try {
              response = await fetch(`/api/admin/activity/live?since=${lastActivityUpdate}&limit=10`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                signal: controller.signal,
              });
            } catch (fetchError) {
              response = { ok: false };
            }
          }

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.activity && data.activity.length > 0) {
              setLiveActivity(prev => {
                const newActivity = data.activity.filter(activity =>
                  !prev.some(existing => existing.id === activity.id)
                );
                return [...newActivity, ...prev].slice(0, 10);
              });
              setLastActivityUpdate(data.timestamp);
            }
          }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        // Silently handle all errors to prevent console spam
      }
    }, 30000); // Increased interval to 30 seconds

    return () => {
      clearInterval(metricsInterval);
      clearInterval(activityInterval);
      // Abort any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
      
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Set timeout for the entire operation
      const timeoutId = setTimeout(() => {
        controller.abort(new Error('Dashboard data loading timeout'));
      }, 10000); // 10 second timeout

      try {
        const [statsRes, activityRes, metricsRes] = await Promise.allSettled([
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
          fetch("/api/admin/metrics/realtime", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }),
        ]);

        clearTimeout(timeoutId);

        // Check overall connection status
        const successCount = [statsRes, activityRes, metricsRes].filter(
          (res) => res.status === 'fulfilled' && res.value.ok
        ).length;

        if (successCount === 3) {
          setConnectionStatus("connected");
        } else if (successCount >= 1) {
          setConnectionStatus("degraded");
        } else {
          setConnectionStatus("offline");
        }

        // Handle stats response
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const statsData = await statsRes.value.json();
          const stats = statsData.stats;

          // Set enhanced stats with better real data integration
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
          
          console.log("Dashboard stats loaded successfully:", {
            users: enhancedStats.totalUsers,
            active: enhancedStats.activeUsers,
          });
        } else {
          console.warn("Failed to load dashboard stats, using cached/fallback data");
          // Use cached data if available, otherwise set minimal fallback
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
            console.warn("Using fallback stats due to API failure");
          }
        }

        // Handle activity response
        if (activityRes.status === 'fulfilled' && activityRes.value.ok) {
          const activityData = await activityRes.value.json();
          const logs = activityData.logs || [];
          setRecentActivity(logs);
          cacheManager.set(CACHE_KEYS.ADMIN_LOGS, logs);
        } else {
          console.warn("Failed to load activity logs, keeping existing data");
        }

        // Handle metrics response
        if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
          const metricsData = await metricsRes.value.json();
          setSystemMetrics(metricsData.metrics);
          setLastMetricsUpdate(Date.now());
        } else {
          console.warn("Failed to load system metrics, using fallback");
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);

      // Show user-friendly error handling and update connection status
      if (error.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.warn("Dashboard data loading timed out, using cached data");
        }
        setConnectionStatus("degraded");
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn("Network connectivity issue, using cached/fallback data");
        setConnectionStatus("offline");
      } else {
        console.error("Unexpected error loading dashboard data:", error.message);
        setConnectionStatus("degraded");
      }

      // Ensure we have some data even on error
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

  // Enhanced chart data with proper structure for Recharts - use API data when available
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Welcome back, {user?.username}. System overview and controls.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected" ? "bg-green-500" :
                connectionStatus === "degraded" ? "bg-yellow-500" : "bg-red-500"
              }`} />
              <span className="text-sm font-medium capitalize">{connectionStatus}</span>
            </div>

            {/* Time Range Filter */}
            <select
              className="bg-card border border-border rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
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
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="minecraft-panel bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">
                  +{stats?.newUsersToday || 0}
                </span>{" "}
                new today
              </p>
              <div className="mt-3">
                <MiniLineChart data={userGrowthData} color="#2563eb" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.activeSessions || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.activeUsers || 0} users online
              </p>
              <div className="mt-3">
                <MiniBarChart data={activityData} color="#16a34a" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats?.totalMessages || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.flaggedMessages || 0} flagged
              </p>
              <div className="mt-3">
                <MiniAreaChart data={activityData} color="#9333ea" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {stats?.supportTickets || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-orange-600 font-medium">
                  {stats?.pendingTickets || 0}
                </span>{" "}
                pending
              </p>
              <div className="mt-3">
                <MiniBarChart data={userGrowthData} color="#ea580c" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Performance */}
        <Card className="minecraft-panel bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-primary" />
              <span>System Performance</span>
            </CardTitle>
            <CardDescription>
              Real-time server metrics and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* CPU Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <span className="text-sm font-bold">
                    {systemMetrics?.system?.cpu || 23}%
                  </span>
                </div>
                <Progress value={systemMetrics?.system?.cpu || 23} className="h-2" />
              </div>

              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Memory</span>
                  </div>
                  <span className="text-sm font-bold">
                    {systemMetrics?.system?.memory || 67}%
                  </span>
                </div>
                <Progress value={systemMetrics?.system?.memory || 67} className="h-2" />
              </div>

              {/* Network I/O */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Network className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Network</span>
                  </div>
                  <span className="text-sm font-bold">
                    {systemMetrics?.system?.network || 34}%
                  </span>
                </div>
                <Progress value={systemMetrics?.system?.network || 34} className="h-2" />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Last updated: {new Date(lastMetricsUpdate).toLocaleTimeString()}</span>
              {realTimeData && (
                <div className="flex space-x-4">
                  <span>Uptime: {Math.floor((realTimeData.uptime || 0) / 3600)}h</span>
                  <span>Memory: {realTimeData.memoryUsage?.used || 0}MB</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analytics and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Analytics */}
          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>User Activity</span>
              </CardTitle>
              <CardDescription>
                Daily user registrations and activity trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData?.userGrowthData || [
                  { day: "Mon", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0 },
                  { day: "Tue", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0 },
                  { day: "Wed", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0 },
                  { day: "Thu", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0 },
                  { day: "Fri", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0 },
                  { day: "Sat", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0 },
                  { day: "Sun", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activeSessions"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                    name="Active Sessions"
                  />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stackId="2"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="New Registrations"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span>Recent Activity</span>
                </div>
                <Link to="/admin/logs">
                  <Button variant="outline" size="sm">
                    View All Logs
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(liveActivity.length > 0 || recentActivity.length > 0) ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {/* Live Activity First */}
                  {liveActivity.slice(0, 4).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border-l-4 border-primary"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.username || "System"} - {activity.action.replace(/_/g, " ")}
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
                  
                  {/* Recent Activity */}
                  {recentActivity.slice(0, Math.max(4, 8 - liveActivity.length)).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.username || "System"} - {activity.action.replace(/_/g, " ")}
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
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-xs mt-1">Live feed will update automatically</p>
                </div>
              )}
              
              {/* Live indicator */}
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

        {/* Quick Actions */}
        <Card className="minecraft-panel bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Quick Actions & System Control</span>
            </CardTitle>
            <CardDescription>
              Administrative tools and system management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link to="/admin/users">
                <Button className="w-full h-auto p-4 flex flex-col space-y-2 bg-blue-500 hover:bg-blue-600 text-white">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Users</span>
                </Button>
              </Link>
              <Link to="/admin/news">
                <Button className="w-full h-auto p-4 flex flex-col space-y-2 bg-green-500 hover:bg-green-600 text-white">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm">News</span>
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button className="w-full h-auto p-4 flex flex-col space-y-2 bg-purple-500 hover:bg-purple-600 text-white">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Settings</span>
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button className="w-full h-auto p-4 flex flex-col space-y-2 bg-orange-500 hover:bg-orange-600 text-white">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </Link>
              <Button className="w-full h-auto p-4 flex flex-col space-y-2 bg-yellow-500 hover:bg-yellow-600 text-white">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">Support</span>
              </Button>
              <Button className="w-full h-auto p-4 flex flex-col space-y-2 bg-red-500 hover:bg-red-600 text-white">
                <Zap className="w-5 h-5" />
                <span className="text-sm">System</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
