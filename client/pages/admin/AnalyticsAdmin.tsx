import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/ui/admin-layout";
import {
  Users,
  DollarSign,
  MessageCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Eye,
  ShoppingBag,
  Loader2,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

interface AnalyticsData {
  userGrowth: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
    breakdown: {
      vip: number;
      vipPlus: number;
      legend: number;
    };
  };
  activity: {
    dailyActiveUsers: number;
    messagesSent: number;
    forumPosts: number;
    supportTickets: number;
  };
  performance: {
    serverUptime: number;
    responseTime: number;
    errorRate: number;
    peakConcurrentUsers: number;
  };
}

export default function AnalyticsAdmin() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    if (!token) return;

    try {
      setError(null);

      // In a real app, this would fetch from a proper analytics API
      // For now, we'll simulate analytics data
      const response = await fetch("/api/admin/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Transform the basic stats into detailed analytics
        const mockAnalytics: AnalyticsData = {
          userGrowth: {
            total: data.stats?.totalUsers || 156,
            thisMonth: 45,
            lastMonth: 38,
            growthRate: 18.4,
          },
          revenue: {
            total: 2847.5,
            thisMonth: 890.25,
            lastMonth: 756.8,
            growthRate: 17.6,
            breakdown: {
              vip: 650.25,
              vipPlus: 180.0,
              legend: 60.0,
            },
          },
          activity: {
            dailyActiveUsers: data.stats?.activeUsers || 47,
            messagesSent: data.stats?.totalMessages || 3420,
            forumPosts: data.stats?.forumPosts || 234,
            supportTickets: data.stats?.supportTickets || 45,
          },
          performance: {
            serverUptime: data.stats?.serverUptime || 99.8,
            responseTime: 145,
            errorRate: 0.2,
            peakConcurrentUsers: 89,
          },
        };

        setAnalytics(mockAnalytics);
        setLastUpdated(new Date());
      } else {
        throw new Error("Failed to load analytics");
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setError("Failed to load analytics data");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  // Always show analytics data immediately

  if (error) {
    return (
      <AdminLayout>
        <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Error Loading Analytics</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadAnalytics} className="minecraft-button">
              Retry
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your platform performance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button
              onClick={loadAnalytics}
              className="minecraft-button"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.userGrowth.total}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={
                        analytics?.userGrowth.growthRate &&
                        analytics.userGrowth.growthRate > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {formatPercentage(analytics?.userGrowth.growthRate || 0)}
                    </span>{" "}
                    from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(analytics?.revenue.thisMonth || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={
                        analytics?.revenue.growthRate &&
                        analytics.revenue.growthRate > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {formatPercentage(analytics?.revenue.growthRate || 0)}
                    </span>{" "}
                    from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Daily Active Users
                  </CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.activity.dailyActiveUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(
                      ((analytics?.activity.dailyActiveUsers || 0) /
                        (analytics?.userGrowth.total || 1)) *
                      100
                    ).toFixed(1)}
                    % of total users
                  </p>
                </CardContent>
              </Card>

              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Server Uptime
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.performance.serverUptime}%
                  </div>
                  <Progress
                    value={analytics?.performance.serverUptime || 0}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Activity Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span>Platform Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Messages Sent
                    </span>
                    <span className="font-bold">
                      {analytics?.activity.messagesSent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Forum Posts
                    </span>
                    <span className="font-bold">
                      {analytics?.activity.forumPosts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Support Tickets
                    </span>
                    <span className="font-bold">
                      {analytics?.activity.supportTickets}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5 text-green-500" />
                    <span>Revenue Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      VIP Subscriptions
                    </span>
                    <span className="font-bold">
                      {formatCurrency(analytics?.revenue.breakdown.vip || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      VIP++ Subscriptions
                    </span>
                    <span className="font-bold">
                      {formatCurrency(
                        analytics?.revenue.breakdown.vipPlus || 0,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Legend Subscriptions
                    </span>
                    <span className="font-bold">
                      {formatCurrency(analytics?.revenue.breakdown.legend || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Users
                    </span>
                    <span className="font-bold">
                      {analytics?.userGrowth.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      This Month
                    </span>
                    <span className="font-bold text-green-500">
                      +{analytics?.userGrowth.thisMonth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last Month
                    </span>
                    <span className="font-bold">
                      +{analytics?.userGrowth.lastMonth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-sm font-medium">Growth Rate</span>
                    <Badge
                      variant={
                        analytics?.userGrowth.growthRate &&
                        analytics.userGrowth.growthRate > 0
                          ? "default"
                          : "destructive"
                      }
                    >
                      {formatPercentage(analytics?.userGrowth.growthRate || 0)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Daily Active
                    </span>
                    <span className="font-bold">
                      {analytics?.activity.dailyActiveUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Peak Concurrent
                    </span>
                    <span className="font-bold">
                      {analytics?.performance.peakConcurrentUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Engagement Rate
                    </span>
                    <span className="font-bold text-green-500">
                      {(
                        ((analytics?.activity.dailyActiveUsers || 0) /
                          (analytics?.userGrowth.total || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle>User Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Messages per User
                    </span>
                    <span className="font-bold">
                      {(
                        (analytics?.activity.messagesSent || 0) /
                        (analytics?.userGrowth.total || 1)
                      ).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Forum Posts per User
                    </span>
                    <span className="font-bold">
                      {(
                        (analytics?.activity.forumPosts || 0) /
                        (analytics?.userGrowth.total || 1)
                      ).toFixed(1)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Revenue
                    </span>
                    <span className="font-bold text-green-500">
                      {formatCurrency(analytics?.revenue.total || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      This Month
                    </span>
                    <span className="font-bold">
                      {formatCurrency(analytics?.revenue.thisMonth || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last Month
                    </span>
                    <span className="font-bold">
                      {formatCurrency(analytics?.revenue.lastMonth || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-sm font-medium">Growth Rate</span>
                    <Badge
                      variant={
                        analytics?.revenue.growthRate &&
                        analytics.revenue.growthRate > 0
                          ? "default"
                          : "destructive"
                      }
                    >
                      {formatPercentage(analytics?.revenue.growthRate || 0)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Subscription Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">VIP</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(analytics?.revenue.breakdown.vip || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">VIP++</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(
                          analytics?.revenue.breakdown.vipPlus || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm">Legend</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(
                          analytics?.revenue.breakdown.legend || 0,
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Server Uptime
                      </span>
                      <span className="font-bold text-green-500">
                        {analytics?.performance.serverUptime}%
                      </span>
                    </div>
                    <Progress
                      value={analytics?.performance.serverUptime || 0}
                      className="h-2"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Response Time
                    </span>
                    <span className="font-bold">
                      {analytics?.performance.responseTime}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Error Rate
                    </span>
                    <span className="font-bold text-green-500">
                      {analytics?.performance.errorRate}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Peak Concurrent Users
                    </span>
                    <span className="font-bold">
                      {analytics?.performance.peakConcurrentUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Current Active Sessions
                    </span>
                    <span className="font-bold">
                      {analytics?.activity.dailyActiveUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Load Average
                    </span>
                    <span className="font-bold text-green-500">Low</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
