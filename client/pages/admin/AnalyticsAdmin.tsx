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
  Server,
  Shield,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

interface AnalyticsData {
  userGrowth: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
    dailyData: Array<{ date: string; users: number; newUsers: number }>;
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
    monthlyData: Array<{ month: string; revenue: number }>;
  };
  activity: {
    dailyActiveUsers: number;
    messagesSent: number;
    forumPosts: number;
    supportTickets: number;
    hourlyActivity: Array<{ hour: number; users: number; messages: number }>;
  };
  performance: {
    serverUptime: number;
    responseTime: number;
    errorRate: number;
    peakConcurrentUsers: number;
    uptimeHistory: Array<{ date: string; uptime: number }>;
  };
}

// Simple chart components for realistic data visualization
const BarChart = ({ data, height = 200, title }: { data: Array<{label: string, value: number}>, height?: number, title?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-medium text-gray-700">{title}</h4>}
      <div className="flex items-end space-x-1" style={{ height: height }}>
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="bg-black w-full min-w-[8px] transition-all duration-300"
              style={{ 
                height: `${(item.value / maxValue) * (height - 40)}px`,
                minHeight: '2px'
              }}
            />
            <div className="text-xs text-gray-600 mt-1 text-center truncate w-full">
              {item.label}
            </div>
            <div className="text-xs font-medium text-black">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChart = ({ data, height = 200, title }: { data: Array<{label: string, value: number}>, height?: number, title?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  
  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-medium text-gray-700">{title}</h4>}
      <div className="relative" style={{ height: height }}>
        <svg width="100%" height={height} className="overflow-visible">
          <polyline
            fill="none"
            stroke="black"
            strokeWidth="2"
            points={data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((item.value - minValue) / range) * 80;
              return `${x},${y}`;
            }).join(' ')}
            vectorEffect="non-scaling-stroke"
            transform="scale(1, 1.5)"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((item.value - minValue) / range) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y * 1.5}
                r="3"
                fill="black"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div>{item.label}</div>
              <div className="font-medium text-black">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PieChartComponent = ({ data, title }: { data: Array<{label: string, value: number, color?: string}>, title?: string }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  
  return (
    <div className="space-y-4">
      {title && <h4 className="text-sm font-medium text-gray-700">{title}</h4>}
      <div className="flex items-center space-x-6">
        <div className="relative w-32 h-32">
          <svg width="128" height="128" className="transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="16"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage * 3.52} ${351.86 - percentage * 3.52}`;
              const strokeDashoffset = -cumulativePercentage * 3.52;
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={index === 0 ? "#000000" : index === 1 ? "#4b5563" : "#9ca3af"}
                  strokeWidth="16"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ 
                  backgroundColor: index === 0 ? "#000000" : index === 1 ? "#4b5563" : "#9ca3af" 
                }}
              />
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm font-medium text-black">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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

      // Generate realistic analytics data
      const mockAnalytics: AnalyticsData = {
        userGrowth: {
          total: 1247,
          thisMonth: 89,
          lastMonth: 73,
          growthRate: 21.9,
          dailyData: [
            { date: "Mon", users: 156, newUsers: 12 },
            { date: "Tue", users: 143, newUsers: 8 },
            { date: "Wed", users: 178, newUsers: 15 },
            { date: "Thu", users: 165, newUsers: 11 },
            { date: "Fri", users: 189, newUsers: 18 },
            { date: "Sat", users: 201, newUsers: 14 },
            { date: "Sun", users: 167, newUsers: 9 },
          ],
        },
        revenue: {
          total: 15847.75,
          thisMonth: 2190.50,
          lastMonth: 1856.25,
          growthRate: 18.0,
          breakdown: {
            vip: 1450.25,
            vipPlus: 520.75,
            legend: 219.50,
          },
          monthlyData: [
            { month: "Jan", revenue: 1654 },
            { month: "Feb", revenue: 1789 },
            { month: "Mar", revenue: 1923 },
            { month: "Apr", revenue: 1856 },
            { month: "May", revenue: 2190 },
            { month: "Jun", revenue: 2245 },
          ],
        },
        activity: {
          dailyActiveUsers: 312,
          messagesSent: 8547,
          forumPosts: 456,
          supportTickets: 23,
          hourlyActivity: [
            { hour: 0, users: 45, messages: 23 },
            { hour: 6, users: 78, messages: 89 },
            { hour: 12, users: 156, messages: 234 },
            { hour: 18, users: 198, messages: 312 },
            { hour: 24, users: 89, messages: 67 },
          ],
        },
        performance: {
          serverUptime: 99.87,
          responseTime: 127,
          errorRate: 0.12,
          peakConcurrentUsers: 234,
          uptimeHistory: [
            { date: "Week 1", uptime: 99.95 },
            { date: "Week 2", uptime: 99.82 },
            { date: "Week 3", uptime: 99.91 },
            { date: "Week 4", uptime: 99.87 },
          ],
        },
      };

      setAnalytics(mockAnalytics);
      setLastUpdated(new Date());
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

  if (error) {
    return (
      <AdminLayout>
        <Card className="bg-white border border-gray-300 shadow-lg">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-xl font-bold mb-2 text-black">Error Loading Analytics</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadAnalytics} className="bg-black text-white hover:bg-gray-800">
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
            <h1 className="text-3xl font-bold text-black">Analytics Dashboard</h1>
            <p className="text-gray-600">
              Comprehensive insights into platform performance and user engagement
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button
              onClick={loadAnalytics}
              className="bg-black text-white hover:bg-gray-800 border border-gray-300"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 border border-gray-300">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">Overview</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-black">Users</TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-white data-[state=active]:text-black">Revenue</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:text-black">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">{analytics?.userGrowth.total}</div>
                  <p className="text-xs text-gray-600">
                    <span className="text-black font-medium">
                      {formatPercentage(analytics?.userGrowth.growthRate || 0)}
                    </span>{" "}
                    from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    {formatCurrency(analytics?.revenue.thisMonth || 0)}
                  </div>
                  <p className="text-xs text-gray-600">
                    <span className="text-black font-medium">
                      {formatPercentage(analytics?.revenue.growthRate || 0)}
                    </span>{" "}
                    from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">{analytics?.activity.dailyActiveUsers}</div>
                  <p className="text-xs text-gray-600">
                    <span className="text-black font-medium">
                      {((analytics?.activity.dailyActiveUsers || 0) / (analytics?.userGrowth.total || 1) * 100).toFixed(1)}%
                    </span>{" "}
                    of total users
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Server Uptime</CardTitle>
                  <Server className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">{analytics?.performance.serverUptime}%</div>
                  <Progress value={analytics?.performance.serverUptime || 0} className="mt-2 bg-gray-200" />
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-gray-500" />
                    <span className="text-black">Daily User Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart 
                    data={analytics?.userGrowth.dailyData?.map(d => ({ label: d.date, value: d.users })) || []}
                    height={200}
                  />
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="w-5 h-5 text-gray-500" />
                    <span className="text-black">Revenue Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart 
                    data={analytics?.revenue.monthlyData?.map(d => ({ label: d.month, value: d.revenue })) || []}
                    height={200}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Activity Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-gray-500" />
                    <span className="text-black">Platform Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Messages Sent</span>
                    <span className="font-bold text-black">
                      {analytics?.activity.messagesSent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Forum Posts</span>
                    <span className="font-bold text-black">{analytics?.activity.forumPosts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Support Tickets</span>
                    <span className="font-bold text-black">{analytics?.activity.supportTickets}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5 text-gray-500" />
                    <span className="text-black">Revenue Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChartComponent 
                    data={[
                      { label: "VIP", value: analytics?.revenue.breakdown.vip || 0 },
                      { label: "VIP++", value: analytics?.revenue.breakdown.vipPlus || 0 },
                      { label: "Legend", value: analytics?.revenue.breakdown.legend || 0 },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-gray-500" />
                    <span className="text-black">Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="font-bold text-black">{analytics?.performance.responseTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-bold text-black">{analytics?.performance.errorRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Peak Users</span>
                    <span className="font-bold text-black">{analytics?.performance.peakConcurrentUsers}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-black">User Growth Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart 
                    data={analytics?.userGrowth.dailyData?.map(d => ({ label: d.date, value: d.newUsers })) || []}
                    height={250}
                    title="New Users Per Day"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-black">User Engagement Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Users</span>
                      <span className="font-bold text-black text-lg">{analytics?.userGrowth.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">New This Month</span>
                      <span className="font-bold text-black text-lg">{analytics?.userGrowth.thisMonth}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Daily Active</span>
                      <span className="font-bold text-black text-lg">{analytics?.activity.dailyActiveUsers}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-sm font-medium text-gray-700">Growth Rate</span>
                      <Badge variant="outline" className="text-black border-gray-300">
                        {formatPercentage(analytics?.userGrowth.growthRate || 0)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-black">Monthly Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart 
                    data={analytics?.revenue.monthlyData?.map(d => ({ label: d.month, value: d.revenue })) || []}
                    height={250}
                    title="Revenue by Month"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-black">Revenue by Subscription Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <PieChartComponent 
                      data={[
                        { label: "VIP", value: analytics?.revenue.breakdown.vip || 0 },
                        { label: "VIP++", value: analytics?.revenue.breakdown.vipPlus || 0 },
                        { label: "Legend", value: analytics?.revenue.breakdown.legend || 0 },
                      ]}
                    />
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Revenue</span>
                        <span className="font-bold text-black text-lg">
                          {formatCurrency(analytics?.revenue.total || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="font-bold text-black text-lg">
                          {formatCurrency(analytics?.revenue.thisMonth || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-black">Server Uptime History</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart 
                    data={analytics?.performance.uptimeHistory?.map(d => ({ label: d.date, value: d.uptime })) || []}
                    height={250}
                    title="Uptime Percentage by Week"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-black">System Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Server Uptime</span>
                        <span className="font-bold text-black text-lg">{analytics?.performance.serverUptime}%</span>
                      </div>
                      <Progress value={analytics?.performance.serverUptime || 0} className="bg-gray-200" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Response Time</span>
                      <span className="font-bold text-black text-lg">{analytics?.performance.responseTime}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Error Rate</span>
                      <span className="font-bold text-black text-lg">{analytics?.performance.errorRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Peak Concurrent Users</span>
                      <span className="font-bold text-black text-lg">{analytics?.performance.peakConcurrentUsers}</span>
                    </div>
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
