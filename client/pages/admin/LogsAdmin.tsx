import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from "@/components/ui/admin-layout";
import { useAuth } from "@/lib/auth";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  category: string;
  message: string;
  username?: string;
  ip?: string;
  details?: any;
}

export default function LogsAdmin() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0,
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      // Generate mock logs data for demonstration
      const mockLogs: LogEntry[] = [
        {
          id: "1",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          level: "info",
          category: "auth",
          message: "User login successful",
          username: "admin",
          ip: "192.168.1.100",
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          level: "error",
          category: "database",
          message: "Database connection timeout",
          details: { error: "Connection timeout after 30s" },
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          level: "warning",
          category: "security",
          message: "Multiple failed login attempts detected",
          username: "unknown",
          ip: "203.0.113.42",
        },
        {
          id: "4",
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
          level: "success",
          category: "admin",
          message: "User role updated successfully",
          username: "admin",
          details: { targetUser: "user123", newRole: "moderator" },
        },
        // Add more mock logs...
        ...Array.from({ length: 50 }, (_, i) => {
          const levels: Array<"info" | "warning" | "error" | "success"> = [
            "info",
            "warning",
            "error",
            "success",
          ];
          const categories = [
            "auth",
            "database",
            "security",
            "admin",
            "api",
            "system",
          ];
          const messages = [
            "User login successful",
            "Password changed",
            "File uploaded",
            "Database query executed",
            "API request processed",
            "System backup completed",
            "Configuration updated",
            "Cache cleared",
          ];

          const level = levels[Math.floor(Math.random() * levels.length)];
          const category =
            categories[Math.floor(Math.random() * categories.length)];
          const message = messages[Math.floor(Math.random() * messages.length)];

          return {
            id: `${i + 5}`,
            timestamp: new Date(
              Date.now() - Math.random() * 1000 * 60 * 60 * 24,
            ).toISOString(),
            level,
            category,
            message,
            username:
              Math.random() > 0.5
                ? `user${Math.floor(Math.random() * 100)}`
                : undefined,
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          };
        }),
      ].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      setLogs(mockLogs);

      // Calculate stats
      const newStats = {
        total: mockLogs.length,
        errors: mockLogs.filter((l) => l.level === "error").length,
        warnings: mockLogs.filter((l) => l.level === "warning").length,
        info: mockLogs.filter((l) => l.level === "info").length,
      };
      setStats(newStats);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = () => {
    const csvContent = [
      "Timestamp,Level,Category,Message,Username,IP",
      ...filteredLogs.map(
        (log) =>
          `"${log.timestamp}","${log.level}","${log.category}","${log.message}","${log.username || ""}","${log.ip || ""}"`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.username &&
        log.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    const matchesCategory =
      filterCategory === "all" || log.category === filterCategory;

    return matchesSearch && matchesLevel && matchesCategory;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <span className="w-4 h-4 text-red-400">❌</span>;
      case "warning":
        return <span className="w-4 h-4 text-yellow-400">⚠️</span>;
      case "success":
        return <span className="w-4 h-4 text-green-400">✅</span>;
      default:
        return <span className="w-4 h-4 text-blue-400">ℹ️</span>;
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-600 text-white";
      case "warning":
        return "bg-yellow-600 text-white";
      case "success":
        return "bg-green-600 text-white";
      default:
        return "bg-blue-600 text-white";
    }
  };

  const categories = Array.from(
    new Set(logs.map((log) => log.category)),
  ).sort();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">System Logs</h1>
            <p className="text-gray-400">
              Monitor system activity and troubleshoot issues
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={exportLogs}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              <span className="mr-2">⬇️</span>
              Export
            </Button>
            <Button
              onClick={loadLogs}
              className="bg-white text-black hover:bg-gray-200"
              disabled={isLoading}
            >
              <span className={`mr-2 ${isLoading ? "animate-spin" : ""}`}>
                {isLoading ? "↻" : "↻"}
              </span>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Logs
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Errors
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.errors}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Warnings
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.warnings}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Info Logs
              </CardTitle>
              <Info className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.info}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Search and Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Recent Logs ({filteredLogs.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              System activity and events log
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Timestamp</TableHead>
                    <TableHead className="text-gray-300">Level</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Message</TableHead>
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 100).map((log) => (
                    <TableRow key={log.id} className="border-gray-700">
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getLevelIcon(log.level)}
                          <Badge className={getLevelBadgeColor(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-gray-700 text-white">
                          {log.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white max-w-md">
                        <div className="truncate" title={log.message}>
                          {log.message}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {log.username || "-"}
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {log.ip || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredLogs.length > 100 && (
              <div className="mt-4 text-center text-gray-400">
                Showing first 100 results. Use filters to narrow down the
                search.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
