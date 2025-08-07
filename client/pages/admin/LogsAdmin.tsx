import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MinecraftBackground } from "@/components/ui/minecraft-background";
import { 
  Shield, 
  ArrowLeft,
  Search,
  Download,
  Trash2,
  Filter,
  Eye,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  Activity,
  Calendar,
  User
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLogging, LogEntry } from "@/lib/logging";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const levelIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  admin: Shield,
  security: Shield,
};

const levelColors = {
  info: "text-blue-500",
  warning: "text-yellow-500", 
  error: "text-red-500",
  admin: "text-purple-500",
  security: "text-red-600",
};

const categoryLabels = {
  auth: "Authentication",
  user: "User Management",
  chat: "Chat System",
  store: "Store Operations",
  admin: "Admin Actions", 
  system: "System Events",
  security: "Security Events",
};

export default function LogsAdmin() {
  const { user, isAdmin } = useAuth();
  const { logs, getLogsByCategory, getLogsByLevel, clearLogs } = useLogging();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/admin");
    }
  }, [user, isAdmin, navigate]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      switch (dateFilter) {
        case "today":
          matchesDate = logDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = logDate > weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = logDate > monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesLevel && matchesCategory && matchesDate;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const exportLogs = () => {
    const logsData = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uec-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Logs Exported",
      description: "Logs have been exported to JSON file",
    });
  };

  const handleClearLogs = () => {
    if (confirm("Are you sure you want to clear all logs? This action cannot be undone.")) {
      clearLogs();
      toast({
        title: "Logs Cleared",
        description: "All system logs have been cleared",
        variant: "destructive",
      });
    }
  };

  const getLogStats = () => {
    const total = logs.length;
    const today = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length;
    
    const errors = logs.filter(log => log.level === 'error').length;
    const warnings = logs.filter(log => log.level === 'warning').length;
    
    return { total, today, errors, warnings };
  };

  const stats = getLogStats();

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <MinecraftBackground>
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary">System Logs</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={exportLogs} variant="outline" className="minecraft-border">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleClearLogs} variant="outline" className="minecraft-border text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Logs
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Log Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Logs</div>
              </CardContent>
            </Card>
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-500">{stats.today}</div>
                <div className="text-sm text-muted-foreground">Today's Logs</div>
              </CardContent>
            </Card>
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </CardContent>
            </Card>
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-500">{stats.warnings}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="minecraft-panel mb-6">
            <CardHeader>
              <CardTitle>Log Filters</CardTitle>
              <CardDescription>Search and filter system logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="minecraft-input pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="minecraft-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="minecraft-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                      <SelectItem value="user">User Management</SelectItem>
                      <SelectItem value="chat">Chat System</SelectItem>
                      <SelectItem value="store">Store Operations</SelectItem>
                      <SelectItem value="admin">Admin Actions</SelectItem>
                      <SelectItem value="system">System Events</SelectItem>
                      <SelectItem value="security">Security Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Time Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="minecraft-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setLevelFilter("all");
                      setCategoryFilter("all");
                      setDateFilter("all");
                    }}
                    variant="outline"
                    className="minecraft-border"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Logs Table */}
            <div className="lg:col-span-2">
              <Card className="minecraft-panel">
                <CardHeader>
                  <CardTitle>System Logs ({filteredLogs.length})</CardTitle>
                  <CardDescription>Real-time system activity and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => {
                          const LevelIcon = levelIcons[log.level];
                          return (
                            <TableRow 
                              key={log.id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedLog(log)}
                            >
                              <TableCell className="text-xs">
                                {formatTimestamp(log.timestamp)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <LevelIcon className={`w-4 h-4 ${levelColors[log.level]}`} />
                                  <Badge 
                                    variant={log.level === 'error' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {log.level}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {categoryLabels[log.category as keyof typeof categoryLabels]}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {log.action}
                              </TableCell>
                              <TableCell className="text-sm">
                                {log.username || 'System'}
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Log Details */}
            <div>
              <Card className="minecraft-panel">
                <CardHeader>
                  <CardTitle>Log Details</CardTitle>
                  <CardDescription>
                    {selectedLog ? "Detailed log information" : "Select a log entry to view details"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedLog ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Timestamp</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(selectedLog.timestamp)}
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Level</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          {React.createElement(levelIcons[selectedLog.level], {
                            className: `w-4 h-4 ${levelColors[selectedLog.level]}`
                          })}
                          <Badge variant={selectedLog.level === 'error' ? 'destructive' : 'secondary'}>
                            {selectedLog.level}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <p className="text-sm text-muted-foreground">
                          {categoryLabels[selectedLog.category as keyof typeof categoryLabels]}
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Action</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedLog.action}
                        </p>
                      </div>

                      {selectedLog.username && (
                        <div>
                          <Label className="text-sm font-medium">User</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedLog.username} ({selectedLog.userId})
                          </p>
                        </div>
                      )}

                      {selectedLog.ipAddress && (
                        <div>
                          <Label className="text-sm font-medium">IP Address</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedLog.ipAddress}
                          </p>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Details</Label>
                        <ScrollArea className="h-32 mt-1">
                          <pre className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            {JSON.stringify(selectedLog.details, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>

                      {selectedLog.userAgent && (
                        <div>
                          <Label className="text-sm font-medium">User Agent</Label>
                          <p className="text-xs text-muted-foreground break-all">
                            {selectedLog.userAgent}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Select a log entry to view detailed information</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MinecraftBackground>
  );
}
