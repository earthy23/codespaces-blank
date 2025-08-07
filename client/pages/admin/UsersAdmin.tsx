import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { MinecraftBackground } from "@/components/ui/minecraft-background";
import {
  Shield,
  ArrowLeft,
  Search,
  UserX,
  UserCheck,
  Edit,
  Trash2,
  Key,
  Eye,
  Ban,
  MessageSquare,
  Calendar,
  Activity,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, User } from "@/lib/auth";
import { useLogging } from "@/lib/logging";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";

interface UserWithStats extends User {
  lastLogin?: string;
  loginCount: number;
  messagesSent: number;
  purchaseTotal: number;
  banned: boolean;
  banReason?: string;
  banExpiry?: string;
}

export default function UsersAdmin() {
  const { user, isAdmin } = useAuth();
  const { logAction } = useLogging();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);
  const [showBanDialog, setShowBanDialog] = useState<UserWithStats | null>(
    null,
  );

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/admin");
      return;
    }
    loadUsers();
  }, [user, isAdmin, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll(1, 100); // Get first 100 users
      setUsers(response.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveUserStats = (userId: string, stats: any) => {
    const userStats = JSON.parse(
      localStorage.getItem("uec_user_stats") || "{}",
    );
    userStats[userId] = { ...userStats[userId], ...stats };
    localStorage.setItem("uec_user_stats", JSON.stringify(userStats));
  };

  const updateUserRole = (userId: string, newRole: "admin" | "user") => {
    const allUsers = JSON.parse(localStorage.getItem("uec_users") || "[]");
    const updatedUsers = allUsers.map((u: User) =>
      u.id === userId ? { ...u, role: newRole } : u,
    );
    localStorage.setItem("uec_users", JSON.stringify(updatedUsers));

    logAction(`role_changed_to_${newRole}`, "admin", "admin", {
      targetUserId: userId,
      targetUsername: users.find((u) => u.id === userId)?.username,
      newRole,
    });

    toast({
      title: "Role Updated",
      description: `User role changed to ${newRole}`,
    });

    loadUsers();
  };

  const banUser = (userId: string, reason: string, duration?: string) => {
    const banExpiry = duration
      ? new Date(
          Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000,
        ).toISOString()
      : undefined;

    saveUserStats(userId, {
      banned: true,
      banReason: reason,
      banExpiry,
    });

    logAction("user_banned", "admin", "admin", {
      targetUserId: userId,
      targetUsername: users.find((u) => u.id === userId)?.username,
      reason,
      duration: duration ? `${duration} days` : "permanent",
    });

    toast({
      title: "User Banned",
      description: `User has been banned for: ${reason}`,
    });

    loadUsers();
    setShowBanDialog(null);
  };

  const unbanUser = (userId: string) => {
    saveUserStats(userId, {
      banned: false,
      banReason: undefined,
      banExpiry: undefined,
    });

    logAction("user_unbanned", "admin", "admin", {
      targetUserId: userId,
      targetUsername: users.find((u) => u.id === userId)?.username,
    });

    toast({
      title: "User Unbanned",
      description: "User has been unbanned successfully",
    });

    loadUsers();
  };

  const resetPassword = (userId: string) => {
    const newPassword = `temp${Math.random().toString(36).slice(2, 8)}`;
    const passwords = JSON.parse(localStorage.getItem("uec_passwords") || "{}");
    const targetUser = users.find((u) => u.id === userId);

    if (targetUser) {
      passwords[targetUser.username] = newPassword;
      localStorage.setItem("uec_passwords", JSON.stringify(passwords));

      logAction("password_reset", "admin", "admin", {
        targetUserId: userId,
        targetUsername: targetUser.username,
      });

      toast({
        title: "Password Reset",
        description: `New password: ${newPassword}`,
      });
    }
  };

  const deleteUser = (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Are you sure you want to permanently delete this user?")) {
      const allUsers = JSON.parse(localStorage.getItem("uec_users") || "[]");
      const updatedUsers = allUsers.filter((u: User) => u.id !== userId);
      localStorage.setItem("uec_users", JSON.stringify(updatedUsers));

      // Clean up user data
      localStorage.removeItem(`uec_friends_${userId}`);
      localStorage.removeItem(`uec_chats_${userId}`);
      localStorage.removeItem(`uec_settings_${userId}`);

      logAction("user_deleted", "admin", "admin", {
        targetUserId: userId,
        targetUsername: users.find((u) => u.id === userId)?.username,
      });

      toast({
        title: "User Deleted",
        description: "User and all associated data have been removed",
      });

      loadUsers();
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "banned" && user.banned) ||
      (statusFilter === "active" && !user.banned);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getBadgeVariant = (role: string) => {
    return role === "admin" ? "destructive" : "secondary";
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <MinecraftBackground>
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/admin"
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary">
                User Management
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <Card className="minecraft-panel mb-6">
            <CardHeader>
              <CardTitle>User Filters</CardTitle>
              <CardDescription>Search and filter users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Username or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="minecraft-input pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Role Filter</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="minecraft-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">Users</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="minecraft-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={loadUsers}
                    className="minecraft-button bg-primary text-primary-foreground"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {users.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </CardContent>
            </Card>
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-500">
                  {users.filter((u) => !u.banned).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Users
                </div>
              </CardContent>
            </Card>
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-500">
                  {users.filter((u) => u.banned).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Banned Users
                </div>
              </CardContent>
            </Card>
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-500">
                  {users.filter((u) => u.role === "admin").length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Administrators
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {userData.username}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {userData.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(userData.role)}>
                            {userData.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {userData.banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(userData.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(userData.lastLogin || userData.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{userData.loginCount} logins</div>
                            <div>{userData.messagesSent} messages</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Select
                              onValueChange={(action) => {
                                switch (action) {
                                  case "make_admin":
                                    updateUserRole(userData.id, "admin");
                                    break;
                                  case "make_user":
                                    updateUserRole(userData.id, "user");
                                    break;
                                  case "ban":
                                    setShowBanDialog(userData);
                                    break;
                                  case "unban":
                                    unbanUser(userData.id);
                                    break;
                                  case "reset_password":
                                    resetPassword(userData.id);
                                    break;
                                  case "delete":
                                    deleteUser(userData.id);
                                    break;
                                }
                              }}
                            >
                              <SelectTrigger className="minecraft-input w-32">
                                <SelectValue placeholder="Actions" />
                              </SelectTrigger>
                              <SelectContent>
                                {userData.role === "user" && (
                                  <SelectItem value="make_admin">
                                    Make Admin
                                  </SelectItem>
                                )}
                                {userData.role === "admin" &&
                                  userData.id !== user?.id && (
                                    <SelectItem value="make_user">
                                      Remove Admin
                                    </SelectItem>
                                  )}
                                {userData.banned ? (
                                  <SelectItem value="unban">
                                    Unban User
                                  </SelectItem>
                                ) : (
                                  <SelectItem value="ban">Ban User</SelectItem>
                                )}
                                <SelectItem value="reset_password">
                                  Reset Password
                                </SelectItem>
                                {userData.id !== user?.id && (
                                  <SelectItem value="delete">
                                    Delete User
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Ban Dialog */}
          {showBanDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="minecraft-panel w-full max-w-md">
                <CardHeader>
                  <CardTitle>Ban User: {showBanDialog.username}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(
                        e.target as HTMLFormElement,
                      );
                      const reason = formData.get("reason") as string;
                      const duration = formData.get("duration") as string;
                      banUser(showBanDialog.id, reason, duration);
                    }}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reason">Ban Reason *</Label>
                        <Input
                          name="reason"
                          placeholder="Enter ban reason..."
                          className="minecraft-input"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="duration">Duration (days)</Label>
                        <Select name="duration">
                          <SelectTrigger className="minecraft-input">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Permanent</SelectItem>
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                            <SelectItem value="90">90 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          type="submit"
                          className="minecraft-button bg-red-600 text-white"
                        >
                          Ban User
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowBanDialog(null)}
                          className="minecraft-border"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MinecraftBackground>
  );
}
