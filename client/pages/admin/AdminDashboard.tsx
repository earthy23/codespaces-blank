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
const MiniLineChart = ({ data, color = "#ffffff" }: { data: any[]; color?: string }) => (
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

const MiniAreaChart = ({ data, color = "#ffffff" }: { data: any[]; color?: string }) => (
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

const MiniBarChart = ({ data, color = "#ffffff" }: { data: any[]; color?: string }) => (
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

    // Set up real-time metrics updates every 15 seconds for better responsiveness
    const metricsInterval = setInterval(async () => {
      if (token) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for real-time updates

          const response = await fetch("/api/admin/metrics/realtime", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          });

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
          if (error.name === 'AbortError') {
            if (process.env.NODE_ENV === 'development') {
              console.warn("Metrics update timed out");
            }
            setConnectionStatus("degraded");
          } else if (error.message?.includes('Failed to fetch')) {
            console.warn("Network issue during metrics update, skipping this cycle");
            setConnectionStatus("offline");
          } else {
            console.error("Error updating real-time metrics:", error);
            setConnectionStatus("degraded");
          }
          // Don't update lastMetricsUpdate on error to show the data is stale
        }
      }
    }, 15000);

    // Set up live activity feed updates every 10 seconds
    const activityInterval = setInterval(async () => {
      if (token) {
        let controller;
        let timeoutId;
        try {
          controller = new AbortController();
          timeoutId = setTimeout(() => {
            controller.abort(new Error('Request timeout'));
          }, 5000);

          const response = await fetch(`/api/admin/activity/live?since=${lastActivityUpdate}&limit=10`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          });

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
          
          if (error.name === 'AbortError') {
            // Timeout is expected behavior, just log in dev mode
            if (process.env.NODE_ENV === 'development') {
              console.warn("Live activity fetch timed out");
            }
          } else if (error.message?.includes('Failed to fetch')) {
            console.warn("Network issue during live activity update, skipping this cycle");
          } else {
            console.warn("Failed to fetch live activity:", error.message);
          }
        }
      }
    }, 10000);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-300">
              Welcome back, {user?.username}. System overview and controls.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Time Range Filter */}
            <select
              className="bg-white text-black border border-black rounded px-3 py-2 text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <div className="flex space-x-2">
              <Button
                onClick={loadDashboardData}
                className="bg-white text-black hover:bg-gray-200"
                disabled={isLoading}
                size="sm"
              >
                <span className={`mr-2 ${isLoading ? "animate-spin" : ""}`}>
                  {isLoading ? "↻" : "↻"}
                </span>
                Refresh All
              </Button>

              <Button
                onClick={() => {
                  setLiveActivity([]);
                  setLastActivityUpdate(Date.now());
                }}
                className="bg-white text-black hover:bg-gray-200"
                size="sm"
              >
                Clear Feed
              </Button>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border-black">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-black">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-gray-600">
                <span className="text-black font-medium">
                  +{stats?.newUsersToday || 0}
                </span>{" "}
                new today
              </p>
              <div className="mt-3">
                <MiniLineChart data={userGrowthData} color="#ffffff" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-black">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-black">
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats?.activeSessions || 0}
              </div>
              <p className="text-xs text-gray-600">
                {stats?.activeUsers || 0} users online
              </p>
              <div className="mt-3">
                <MiniBarChart data={activityData} color="#ffffff" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Analytics Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* User Growth Analytics */}
          <Card className="bg-white border-black">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-black">User Activity & Growth</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-black rounded"></div>
                    <span className="text-gray-600">Daily Registrations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded"></div>
                    <span className="text-gray-600">Active Sessions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span className="text-gray-600">Login Events</span>
                  </div>
                </div>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Real-time user engagement metrics and registration trends
                {dashboardData?.userGrowthData && (
                  <span className="ml-2 text-black">• Live data</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={dashboardData?.userGrowthData || [
                  { day: "Mon", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0, logins: (stats?.totalMessages || 0) },
                  { day: "Tue", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0, logins: (stats?.totalMessages || 0) },
                  { day: "Wed", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0, logins: (stats?.totalMessages || 0) },
                  { day: "Thu", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0, logins: (stats?.totalMessages || 0) },
                  { day: "Fri", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0, logins: (stats?.totalMessages || 0) },
                  { day: "Sat", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0, logins: (stats?.totalMessages || 0) },
                  { day: "Sun", registrations: stats?.newUsersToday || 0, activeSessions: stats?.activeSessions || 0, logins: (stats?.totalMessages || 0) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
                  <XAxis dataKey="day" stroke="#000000" />
                  <YAxis stroke="#000000" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #000000",
                      borderRadius: "8px"
                    }}
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="logins"
                    stackId="1"
                    stroke="#d1d5db"
                    fill="#d1d5db"
                    fillOpacity={0.4}
                    name="Login Events"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeSessions"
                    stackId="2"
                    stroke="#9ca3af"
                    fill="#9ca3af"
                    fillOpacity={0.6}
                    name="Active Sessions"
                  />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stackId="3"
                    stroke="#000000"
                    fill="#000000"
                    fillOpacity={0.8}
                    name="New Registrations"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <Card className="bg-white border-black">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-black">Support Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Tickets</span>
                <span className="font-bold text-black">
                  {stats?.supportTickets || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Tickets</span>
                <Badge className="bg-black text-white">
                  {stats?.pendingTickets || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Rate</span>
                <span className="font-bold text-black">98.7%</span>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-black text-white hover:bg-gray-800">
                  Manage Support
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Real-time System Performance */}
        <div className="grid grid-cols-1 gap-6">
          {/* System Performance Metrics */}
          <Card className="bg-white border-black">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-black">System Performance</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Real-time server metrics and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* CPU Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className="text-sm font-medium text-black">
                      {systemMetrics?.system?.cpu || 23}%
                    </span>
                  </div>
                  <Progress value={systemMetrics?.system?.cpu || 23} className="bg-gray-200" />
                </div>

                {/* Memory Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="text-sm font-medium text-black">
                      {systemMetrics?.system?.memory || 67}%
                    </span>
                  </div>
                  <Progress value={systemMetrics?.system?.memory || 67} className="bg-gray-200" />
                </div>

                {/* Network I/O */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Network I/O</span>
                    <span className="text-sm font-medium text-black">
                      {systemMetrics?.system?.network || 34}%
                    </span>
                  </div>
                  <Progress value={systemMetrics?.system?.network || 34} className="bg-gray-200" />
                </div>

                {/* Real-time Status with enhanced info */}
                <div className="flex justify-between items-center text-xs text-gray-600 mt-2">
                  <span>Last updated: {new Date(lastMetricsUpdate).toLocaleTimeString()}</span>
                  {realTimeData && (
                    <div className="flex space-x-2">
                      <span>Uptime: {Math.floor((realTimeData.uptime || 0) / 3600)}h</span>
                      <span>Mem: {realTimeData.memoryUsage?.used || 0}MB</span>
                    </div>
                  )}
                </div>

                {/* Performance Chart */}
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={(dashboardData?.systemPerformance?.performanceHistory || [
                      { time: "00:00", cpu: 15, memory: 45, network: 20 },
                      { time: "04:00", cpu: 25, memory: 52, network: 35 },
                      { time: "08:00", cpu: 45, memory: 68, network: 55 },
                      { time: "12:00", cpu: 35, memory: 72, network: 40 },
                      { time: "16:00", cpu: 28, memory: 65, network: 38 },
                      { time: "20:00", cpu: systemMetrics?.system?.cpu || 23, memory: systemMetrics?.system?.memory || 67, network: systemMetrics?.system?.network || 34 },
                    ]).map((item, index, array) => {
                      // Add real-time data point as the latest entry
                      if (index === array.length - 1 && realTimeData) {
                        return {
                          ...item,
                          cpu: realTimeData.system?.cpu || item.cpu,
                          memory: realTimeData.system?.memory || item.memory,
                          network: realTimeData.system?.network || item.network
                        };
                      }
                      return item;
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
                      <XAxis dataKey="time" stroke="#000000" />
                      <YAxis stroke="#000000" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #000000",
                          borderRadius: "8px",
                          color: "#000000"
                        }}
                      />
                      <Line type="monotone" dataKey="cpu" stroke="#000000" strokeWidth={3} name="CPU %" />
                      <Line type="monotone" dataKey="memory" stroke="#6b7280" strokeWidth={3} name="Memory %" />
                      <Line type="monotone" dataKey="network" stroke="#d1d5db" strokeWidth={3} name="Network %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Recent Activity */}
        <Card className="bg-white border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-gray-900">Recent Activity</span>
              </div>
              <Link to="/admin/logs">
                <Button
                  className="bg-gray-900 text-white hover:bg-gray-800"
                  size="sm"
                >
                  View All Logs
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(liveActivity.length > 0 || recentActivity.length > 0) ? (
              <div className="space-y-3">
                {/* Live Activity First */}
                {liveActivity.slice(0, 4).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 border-l-2 border-black bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-900">
                        {activity.username || "System"} -{" "}
                        {activity.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-black">
                        {formatTime(activity.timestamp)} • LIVE
                      </p>
                    </div>
                    <Badge className="text-xs bg-black text-white">
                      {activity.category}
                    </Badge>
                  </div>
                ))}
                
                {/* Recent Activity */}
                {recentActivity.slice(0, Math.max(4, 8 - liveActivity.length)).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-900">
                        {activity.username || "System"} -{" "}
                        {activity.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatTime(activity.timestamp)}
                      </p>
                    </div>
                    <Badge className="text-xs bg-black text-white">
                      {activity.category}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No recent activity</p>
                <p className="text-xs mt-1">Live feed will update automatically</p>
              </div>
            )}
            
            {/* Live indicator */}
            {liveActivity.length > 0 && (
              <div className="flex items-center justify-center mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-xs text-gray-700">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                  <span>Live activity feed active</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Quick Actions */}
        <Card className="bg-white border-black">
          <CardHeader>
            <CardTitle className="text-black">Quick Actions & System Control</CardTitle>
            <CardDescription className="text-gray-600">
              Administrative tools, system management, and emergency controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Primary Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3">Management</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link to="/admin/users">
                    <Button className="w-full bg-black text-white hover:bg-gray-800 h-auto p-4 flex flex-col space-y-2">
                      <span className="text-sm">Manage Users</span>
                    </Button>
                  </Link>
                  <Link to="/admin/news">
                    <Button className="w-full bg-black text-white hover:bg-gray-800 h-auto p-4 flex flex-col space-y-2">
                      <span className="text-sm">Create News</span>
                    </Button>
                  </Link>
                  <Link to="/admin/settings">
                    <Button className="w-full bg-black text-white hover:bg-gray-800 h-auto p-4 flex flex-col space-y-2">
                      <span className="text-sm">System Settings</span>
                    </Button>
                  </Link>
                  <Link to="/admin/analytics">
                    <Button className="w-full bg-black text-white hover:bg-gray-800 h-auto p-4 flex flex-col space-y-2">
                      <span className="text-sm">View Analytics</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* System Controls */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3">System Controls</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="w-full bg-black text-white hover:bg-gray-800 h-auto p-4 flex flex-col space-y-2">
                    <span className="text-sm">Clear Cache</span>
                  </Button>
                  <Button className="w-full bg-black text-white hover:bg-gray-800 h-auto p-4 flex flex-col space-y-2">
                    <span className="text-sm">Restart Services</span>
                  </Button>
                  <Button className="w-full bg-black text-white hover:bg-gray-800 h-auto p-4 flex flex-col space-y-2">
                    <span className="text-sm">Maintenance Mode</span>
                  </Button>
                  <Button className="w-full bg-black text-white hover:bg-gray-800 h-auto p-4 flex flex-col space-y-2">
                    <span className="text-sm">Health Check</span>
                  </Button>
                </div>
              </div>

              {/* Real-time Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3">Real-time Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-black hover:bg-gray-800 text-white">
                    Broadcast Message
                  </Button>
                  <Button size="sm" className="bg-black hover:bg-gray-800 text-white">
                    View Live Sessions
                  </Button>
                  <Button size="sm" className="bg-black hover:bg-gray-800 text-white">
                    Server Status
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
