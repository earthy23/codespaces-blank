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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminLayout } from "@/components/ui/admin-layout";
// SVG icons removed as requested
import { useAuth } from "@/lib/auth";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "mod" | "user";
  status: "active" | "banned" | "suspended";
  lastLogin: string;
  joinDate: string;
  avatar?: string;
}

export default function UsersAdmin() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    admins: 0,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      // Generate mock users data for demonstration
      const mockUsers: User[] = [
        {
          id: "1",
          username: "admin",
          email: "admin@uec.com",
          role: "admin",
          status: "active",
          lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          joinDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 365,
          ).toISOString(),
        },
        {
          id: "2",
          username: "moderator1",
          email: "mod1@uec.com",
          role: "mod",
          status: "active",
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          joinDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 200,
          ).toISOString(),
        },
        {
          id: "3",
          username: "user123",
          email: "user123@example.com",
          role: "user",
          status: "active",
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          joinDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 30,
          ).toISOString(),
        },
        {
          id: "4",
          username: "banneduser",
          email: "banned@example.com",
          role: "user",
          status: "banned",
          lastLogin: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 7,
          ).toISOString(),
          joinDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 60,
          ).toISOString(),
        },
        // Add more mock users...
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `${i + 5}`,
          username: `user${i + 5}`,
          email: `user${i + 5}@example.com`,
          role: "user" as const,
          status: Math.random() > 0.9 ? "banned" : ("active" as const),
          lastLogin: new Date(
            Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30,
          ).toISOString(),
          joinDate: new Date(
            Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365,
          ).toISOString(),
        })),
      ];

      setUsers(mockUsers);

      // Calculate stats
      const newStats = {
        total: mockUsers.length,
        active: mockUsers.filter((u) => u.status === "active").length,
        banned: mockUsers.filter((u) => u.status === "banned").length,
        admins: mockUsers.filter((u) => u.role === "admin" || u.role === "mod")
          .length,
      };
      setStats(newStats);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = async (
    userId: string,
    newStatus: "active" | "banned" | "suspended",
  ) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user,
      ),
    );
  };

  const updateUserRole = async (
    userId: string,
    newRole: "admin" | "mod" | "user",
  ) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user,
      ),
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastLogin = (dateString: string) => {
    const now = new Date();
    const loginDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - loginDate.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-600 text-white";
      case "mod":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600 text-white";
      case "banned":
        return "bg-red-600 text-white";
      case "suspended":
        return "bg-yellow-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-400">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <Button
            onClick={loadUsers}
            className="bg-white text-black hover:bg-gray-200"
            disabled={isLoading}
          >
            <span className={`mr-2 ${isLoading ? "animate-spin" : ""}`}>
              {isLoading ? "↻" : "↻"}
            </span>
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Active Users
              </CardTitle>
              <Eye className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.active}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Banned Users
              </CardTitle>
              <Ban className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.banned}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Staff Members
              </CardTitle>
              <Shield className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.admins}
              </div>
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="mod">Moderator</option>
                <option value="user">User</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Role</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Last Login</TableHead>
                    <TableHead className="text-gray-300">Join Date</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-gray-700">
                      <TableCell className="text-white">
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(user.status)}>
                          {user.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatLastLogin(user.lastLogin)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatDate(user.joinDate)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-300 hover:bg-gray-800"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-gray-800 border-gray-700"
                          >
                            <DropdownMenuLabel className="text-white">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-700" />

                            {user.role !== "admin" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateUserRole(user.id, "admin")
                                  }
                                  className="text-gray-300 hover:bg-gray-700"
                                >
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateUserRole(user.id, "mod")}
                                  className="text-gray-300 hover:bg-gray-700"
                                >
                                  Make Moderator
                                </DropdownMenuItem>
                              </>
                            )}

                            {user.role !== "user" && (
                              <DropdownMenuItem
                                onClick={() => updateUserRole(user.id, "user")}
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                Remove Staff Role
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-gray-700" />

                            {user.status === "active" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateUserStatus(user.id, "suspended")
                                  }
                                  className="text-yellow-400 hover:bg-gray-700"
                                >
                                  Suspend User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateUserStatus(user.id, "banned")
                                  }
                                  className="text-red-400 hover:bg-gray-700"
                                >
                                  Ban User
                                </DropdownMenuItem>
                              </>
                            )}

                            {user.status !== "active" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateUserStatus(user.id, "active")
                                }
                                className="text-green-400 hover:bg-gray-700"
                              >
                                Unban/Unsuspend
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
