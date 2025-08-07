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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { serversApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { UserLayout } from "@/components/ui/user-layout";

interface GameServer {
  id: string;
  name: string;
  description: string;
  ip: string;
  port: number;
  websocketUrl: string;
  banner?: string;
  category: string;
  isOnline: boolean;
  playerCount: number;
  maxPlayers: number;
  version: string;
  likes: number;
  hasLiked: boolean;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  lastChecked: string;
  features: string[];
}

export default function Servers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [servers, setServers] = useState<GameServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("likes");
  const [searchQuery, setSearchQuery] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [newServerData, setNewServerData] = useState({
    name: "",
    description: "",
    ip: "",
    category: "survival",
    version: "1.8.8",
  });
  const [currentView, setCurrentView] = useState<"all" | "my">("all");
  const [myServers, setMyServers] = useState<GameServer[]>([]);
  const [editingServer, setEditingServer] = useState<GameServer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<GameServer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const hasToken = !!localStorage.getItem("auth_token");
    console.log("🔄 Servers useEffect: User state changed:", {
      hasUser: !!user,
      username: user?.username,
      userId: user?.id,
      hasToken,
    });

    if (user && hasToken) {
      console.log(
        "🔄 Servers useEffect: User and token exist, fetching servers...",
      );
      fetchServers();
      fetchMyServers();
    } else {
      console.log(
        "🔄 Servers useEffect: Missing user or token, skipping fetch:",
        {
          hasUser: !!user,
          hasToken,
        },
      );
    }
  }, [user]);

  const fetchServers = async () => {
    try {
      const data = await serversApi.getAll();
      setServers(data.servers || []);
    } catch (error) {
      console.error("Failed to fetch servers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch servers",
        variant: "destructive",
      });
    }
  };

  const fetchMyServers = async () => {
    try {
      console.log("🔍 fetchMyServers: Starting fetch...");
      console.log("🔍 fetchMyServers: Current user state:", {
        hasUser: !!user,
        username: user?.username,
        userId: user?.id,
      });

      const token = localStorage.getItem("auth_token");
      console.log("��� fetchMyServers: Auth token status:", {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token?.substring(0, 20) + "...",
      });

      // Don't proceed if we don't have a token
      if (!token) {
        console.warn(
          "⚠️ fetchMyServers: No auth token available, skipping request",
        );
        return;
      }

      // Don't proceed if we don't have user info
      if (!user) {
        console.warn(
          "⚠️ fetchMyServers: No user info available, skipping request",
        );
        return;
      }

      console.log(
        "✅ fetchMyServers: Prerequisites met, making API request...",
      );
      const data = await serversApi.getMyServers();
      console.log(
        "✅ fetchMyServers: Success, got servers:",
        data.servers?.length || 0,
      );
      setMyServers(data.servers || []);
    } catch (error) {
      console.error("❌ fetchMyServers: Failed to fetch my servers:", error);

      // Only show toast for non-authentication errors
      if (!error.message.includes("Authentication required")) {
        toast({
          title: "Error",
          description: `Failed to fetch your servers: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Error",
          description: "Banner file must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUploadEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Error",
          description: "Banner file must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateServerInfo = (ip: string) => {
    // Basic IP/hostname validation
    if (!ip || ip.trim().length === 0) return false;

    // Check for valid hostname/domain
    const hostnameRegex =
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*(([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?))$/;

    // Check for valid IPv4
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    return hostnameRegex.test(ip) || ipv4Regex.test(ip);
  };

  const handleSubmitServer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateServerInfo(newServerData.ip)) {
      toast({
        title: "Error",
        description: "Please enter a valid IP address or hostname",
        variant: "destructive",
      });
      return;
    }

    if (!bannerFile) {
      toast({
        title: "Error",
        description: "Please upload a banner image for your server",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newServerData.name);
      formData.append("description", newServerData.description);
      formData.append("ip", newServerData.ip);
      formData.append("category", newServerData.category);
      formData.append("version", newServerData.version);
      formData.append("banner", bannerFile);

      const data = await serversApi.add(formData);

      setServers([...servers, data.server]);
      setMyServers([...myServers, data.server]);
      resetForm();
      setIsAddServerOpen(false);

      toast({
        title: "Success",
        description: "Server added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add server",
        variant: "destructive",
      });
    }
  };

  const handleLikeServer = async (serverId: string) => {
    try {
      const data = await serversApi.like(serverId);

      setServers(
        servers.map((server) =>
          server.id === serverId
            ? { ...server, likes: data.likes, hasLiked: data.hasLiked }
            : server,
        ),
      );

      setMyServers(
        myServers.map((server) =>
          server.id === serverId
            ? { ...server, likes: data.likes, hasLiked: data.hasLiked }
            : server,
        ),
      );
    } catch (error) {
      console.error("Failed to like server:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const handleCopyIP = async (server: GameServer) => {
    if (!server.isOnline) {
      toast({
        title: "Error",
        description: "Server is currently offline",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use server IP directly
      const serverIP = server.ip;

      // Copy to clipboard
      await navigator.clipboard.writeText(serverIP);
      toast({
        title: "Success",
        description: `Server IP copied to clipboard: ${serverIP}`,
      });
    } catch (error) {
      // Fallback for older browsers
      const serverIP = server.ip;

      // Create temporary input element
      const tempInput = document.createElement("input");
      tempInput.value = serverIP;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);

      toast({
        title: "Success",
        description: `Server IP copied to clipboard: ${serverIP}`,
      });
    }
  };

  const resetForm = () => {
    setNewServerData({
      name: "",
      description: "",
      ip: "",
      category: "survival",
      version: "1.8.8",
    });
    setBannerFile(null);
    setBannerPreview("");
  };

  const handleEditServer = (server: GameServer) => {
    setEditingServer(server);
    setNewServerData({
      name: server.name,
      description: server.description,
      ip: server.ip,
      category: server.category,
      version: server.version,
    });
    setBannerFile(null);
    setBannerPreview("");
    setIsEditDialogOpen(true);
  };

  const handleUpdateServer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingServer) return;

    try {
      const formData = new FormData();
      formData.append("name", newServerData.name);
      formData.append("description", newServerData.description);
      formData.append("ip", newServerData.ip);
      formData.append("category", newServerData.category);
      formData.append("version", newServerData.version);

      if (bannerFile) {
        formData.append("banner", bannerFile);
      }

      const data = await serversApi.update(editingServer.id, formData);

      // Update both server lists
      setServers(
        servers.map((s) => (s.id === editingServer.id ? data.server : s)),
      );
      setMyServers(
        myServers.map((s) => (s.id === editingServer.id ? data.server : s)),
      );

      setIsEditDialogOpen(false);
      setEditingServer(null);
      resetForm();

      toast({
        title: "Success",
        description: "Server updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update server",
        variant: "destructive",
      });
    }
  };

  const handleDeleteServer = async () => {
    if (!serverToDelete) return;

    try {
      await serversApi.delete(serverToDelete.id);

      setServers(servers.filter((s) => s.id !== serverToDelete.id));
      setMyServers(myServers.filter((s) => s.id !== serverToDelete.id));

      setIsDeleteDialogOpen(false);
      setServerToDelete(null);

      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete server",
        variant: "destructive",
      });
    }
  };

  const handleRefreshStatus = async (serverId: string) => {
    try {
      const data = await serversApi.updateStatus(serverId);

      setServers(servers.map((s) => (s.id === serverId ? data.server : s)));
      setMyServers(myServers.map((s) => (s.id === serverId ? data.server : s)));

      if (data.statusChanged) {
        toast({
          title: "Status Updated",
          description: `Server is now ${data.server.isOnline ? "online" : "offline"}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to refresh server status",
        variant: "destructive",
      });
    }
  };

  const getDisplayServers = () => {
    const sourceServers = currentView === "my" ? myServers : servers;

    return sourceServers
      .filter((server) => {
        const matchesCategory =
          selectedCategory === "all" || server.category === selectedCategory;
        const matchesSearch =
          server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          server.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "likes":
            return b.likes - a.likes;
          case "name":
            return a.name.localeCompare(b.name);
          case "newest":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          default:
            return 0;
        }
      });
  };

  const filteredServers = getDisplayServers();

  const categories = [
    { value: "all", label: "All Servers" },
    { value: "survival", label: "Survival" },
    { value: "creative", label: "Creative" },
    { value: "pvp", label: "PvP" },
    { value: "minigames", label: "Minigames" },
    { value: "roleplay", label: "Roleplay" },
    { value: "modded", label: "Modded" },
  ];

  return (
    <UserLayout>
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <nav className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <Link
                to="/dashboard"
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                  <rect x="3" y="4" width="18" height="2" rx="1" fill="currentColor"/>
                  <rect x="3" y="8" width="18" height="2" rx="1" fill="currentColor"/>
                  <rect x="3" y="12" width="18" height="2" rx="1" fill="currentColor"/>
                  <rect x="2" y="16" width="20" height="6" rx="2" fill="currentColor" opacity="0.6"/>
                </svg>
                Back to Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary-foreground">
                    <rect x="3" y="4" width="18" height="2" rx="1" fill="currentColor"/>
                    <rect x="3" y="8" width="18" height="2" rx="1" fill="currentColor"/>
                    <rect x="3" y="12" width="18" height="2" rx="1" fill="currentColor"/>
                    <rect x="2" y="16" width="20" height="6" rx="2" fill="currentColor" opacity="0.6"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-primary">
                  {currentView === "my" ? "My Servers" : "Server List"}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={currentView === "all" ? "default" : "outline"}
                  onClick={() => setCurrentView("all")}
                  size="sm"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M2 12h20" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  All Servers
                </Button>
                <Button
                  variant={currentView === "my" ? "default" : "outline"}
                  onClick={() => setCurrentView("my")}
                  size="sm"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M12 1v6m0 6v6" stroke="currentColor" strokeWidth="2"/>
                    <path d="m21 12-6-6-6 6 6 6 6-6Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  My Servers ({myServers.length})
                </Button>
                <Dialog
                  open={isAddServerOpen}
                  onOpenChange={setIsAddServerOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground">
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                        <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Add Server
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Your Server</DialogTitle>
                      <DialogDescription>
                        Share your Minecraft server with the community. Enter
                        your server IP. Your server must be online to be added.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitServer} className="space-y-4">
                      <div>
                        <Label htmlFor="serverName">Server Name</Label>
                        <Input
                          id="serverName"
                          value={newServerData.name}
                          onChange={(e) =>
                            setNewServerData({
                              ...newServerData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter server name"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newServerData.description}
                          onChange={(e) =>
                            setNewServerData({
                              ...newServerData,
                              description: e.target.value,
                            })
                          }
                          placeholder="Describe your server"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="ip">Server IP</Label>
                        <Input
                          id="ip"
                          value={newServerData.ip}
                          onChange={(e) =>
                            setNewServerData({
                              ...newServerData,
                              ip: e.target.value,
                            })
                          }
                          placeholder="play.yourserver.com"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={newServerData.category}
                            onValueChange={(value) =>
                              setNewServerData({
                                ...newServerData,
                                category: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .filter((c) => c.value !== "all")
                                .map((category) => (
                                  <SelectItem
                                    key={category.value}
                                    value={category.value}
                                  >
                                    {category.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="version">Minecraft Version</Label>
                          <Input
                            id="version"
                            value={newServerData.version}
                            onChange={(e) =>
                              setNewServerData({
                                ...newServerData,
                                version: e.target.value,
                              })
                            }
                            placeholder="1.8.8"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="banner">Server Banner (Required)</Label>
                        <div className="mt-2">
                          <Input
                            id="banner"
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload a banner image (max 5MB). Minimum size:
                            400x100px, Maximum: 1920x600px
                          </p>
                          {bannerPreview && (
                            <div className="mt-3">
                              <img
                                src={bannerPreview}
                                alt="Banner preview"
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddServerOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          Add Server
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Filters and Search */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search servers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="likes">Most Liked</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Server List */}
            {filteredServers.length > 0 ? (
              <div className="grid gap-6">
                {filteredServers.map((server) => (
                  <Card
                    key={server.id}
                    className="minecraft-panel overflow-hidden"
                  >
                    <div className="relative">
                      {server.banner && (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={server.banner}
                            alt={`${server.name} banner`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <Badge
                          variant={server.isOnline ? "default" : "destructive"}
                          className="bg-black/50 backdrop-blur"
                        >
                          {server.isOnline ? "Online" : "Offline"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-black/50 backdrop-blur text-white"
                        >
                          {server.category}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold">{server.name}</h3>
                            <Badge variant="outline">{server.version}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">
                            {server.description}
                          </p>

                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{server.likes} likes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>by {server.ownerName}</span>
                            </div>
                          </div>

                          {server.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {server.features.map((feature, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            onClick={() => handleCopyIP(server)}
                            disabled={!server.isOnline}
                            className="bg-primary text-primary-foreground"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {server.isOnline ? "Copy IP" : "Offline"}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleLikeServer(server.id)}
                            className={
                              server.hasLiked
                                ? "text-red-500 border-red-500"
                                : ""
                            }
                          >
                            <Heart
                              className={`w-4 h-4 mr-2 ${server.hasLiked ? "fill-current" : ""}`}
                            />
                            {server.hasLiked ? "Liked" : "Like"}
                          </Button>

                          {/* Show management buttons for own servers */}
                          {(currentView === "my" ||
                            server.ownerId === user?.id) && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-1 text-xs text-green-600">
                                <Crown className="w-3 h-3" />
                                <span>You own this server</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditServer(server)}
                                  className="flex-1"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRefreshStatus(server.id)}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setServerToDelete(server);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Show owner info for servers owned by others */}
                          {server.ownerId !== user?.id &&
                            currentView !== "my" && (
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-2">
                                <Crown className="w-3 h-3" />
                                <span>Owner: {server.ownerName}</span>
                              </div>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Server className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No servers found</h3>
                <p className="text-muted-foreground mb-4">
                  {currentView === "my"
                    ? "You haven't added any servers yet"
                    : searchQuery || selectedCategory !== "all"
                      ? "Try adjusting your search or filters"
                      : "Be the first to add a server to the community!"}
                </p>
                <Button onClick={() => setIsAddServerOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your Server
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Server Dialog */}
        {editingServer && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Server</DialogTitle>
                <DialogDescription>
                  Update your server information. IP changes require the new
                  server to be online.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateServer} className="space-y-4">
                <div>
                  <Label htmlFor="editServerName">Server Name</Label>
                  <Input
                    id="editServerName"
                    value={newServerData.name}
                    onChange={(e) =>
                      setNewServerData({
                        ...newServerData,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter server name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={newServerData.description}
                    onChange={(e) =>
                      setNewServerData({
                        ...newServerData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe your server"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="editIp">Server IP</Label>
                  <Input
                    id="editIp"
                    value={newServerData.ip}
                    onChange={(e) =>
                      setNewServerData({ ...newServerData, ip: e.target.value })
                    }
                    placeholder="play.yourserver.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Changing IP will test connectivity to the new address
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editCategory">Category</Label>
                    <Select
                      value={newServerData.category}
                      onValueChange={(value) =>
                        setNewServerData({ ...newServerData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c.value !== "all")
                          .map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editVersion">Minecraft Version</Label>
                    <Input
                      id="editVersion"
                      value={newServerData.version}
                      onChange={(e) =>
                        setNewServerData({
                          ...newServerData,
                          version: e.target.value,
                        })
                      }
                      placeholder="1.8.8"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="editBanner">Update Banner (Optional)</Label>
                  <div className="mt-2">
                    <Input
                      id="editBanner"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUploadEdit}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a new banner (max 5MB). Minimum size: 400x100px,
                      Maximum: 1920x600px
                    </p>
                    {bannerPreview && (
                      <div className="mt-3">
                        <img
                          src={bannerPreview}
                          alt="New banner preview"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {!bannerPreview && editingServer.banner && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          Current banner:
                        </p>
                        <img
                          src={editingServer.banner}
                          alt="Current banner"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingServer(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Upload className="w-4 h-4 mr-2" />
                    Update Server
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Delete Your Server</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-3">
                  <p>
                    Are you sure you want to permanently delete "
                    {serverToDelete?.name}"?
                  </p>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <Crown className="w-4 h-4" />
                      <span className="font-medium">Server Owner:</span>
                      <span>{serverToDelete?.ownerName}</span>
                    </div>
                    <p className="text-xs text-red-500 mt-1">
                      This action cannot be undone and will remove all server
                      data.
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setServerToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteServer}
                className="bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Server
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </UserLayout>
  );
}
