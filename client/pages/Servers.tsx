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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
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
  const { currentTier } = useStore();
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
    websocketUrl: "",
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
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const hasToken = !!localStorage.getItem("auth_token");

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    if (user && hasToken) {
      fetchTimeoutRef.current = setTimeout(async () => {
        try {
          await fetchServers();
          setTimeout(() => {
            fetchMyServers();
          }, 200);
        } catch (error) {
          console.error("❌ Error in debounced fetch:", error);
        }
      }, 300);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [user]);

  const fetchServers = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const data = await serversApi.getAll();
      setServers(data.servers || []);
    } catch (error) {
      console.error("❌ fetchServers: Failed to fetch servers:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch servers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyServers = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token || !user) return;

      const data = await serversApi.getMyServers();
      setMyServers(data.servers || []);
    } catch (error) {
      console.error("❌ fetchMyServers: Failed to fetch my servers:", error);
      if (
        !error.message.includes("Authentication required") &&
        !error.message.includes("timed out")
      ) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch your servers",
          variant: "destructive",
        });
      }
    }
  };

  // Check if user can add more servers based on tier
  const canAddServer = () => {
    if (!currentTier) return false;
    const maxServers = currentTier.limits.owned_servers;
    return maxServers === -1 || myServers.length < maxServers;
  };

  // Check if user can upload banner based on tier
  const canUploadBanner = () => {
    if (!currentTier) return false;
    return currentTier.tier !== "free";
  };

  // Get max file upload size based on tier
  const getMaxFileSize = () => {
    if (!currentTier) return 1024 * 1024; // 1MB default
    return currentTier.limits.file_upload_size;
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = getMaxFileSize();
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: `Banner file must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB`,
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
    if (!ip || ip.trim().length === 0) return false;
    const hostnameRegex =
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*(([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?))$/;
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return hostnameRegex.test(ip) || ipv4Regex.test(ip);
  };

  const validateWebSocketUrl = (url: string) => {
    if (!url || url.trim().length === 0)
      return { valid: false, error: "WebSocket URL is required" };

    // Must start with wss:// for security
    if (!url.startsWith("wss://")) {
      return {
        valid: false,
        error: "WebSocket URL must use secure protocol (wss://)",
      };
    }

    try {
      new URL(url);
      return { valid: true, error: null };
    } catch {
      return { valid: false, error: "Invalid WebSocket URL format" };
    }
  };

  const testWebSocketConnection = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(url);
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 5000); // 5 second timeout

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      } catch {
        resolve(false);
      }
    });
  };

  const handleSubmitServer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canAddServer()) {
      toast({
        title: "Server Limit Reached",
        description: `Your ${currentTier?.tier || "free"} tier allows ${currentTier?.limits.owned_servers || 0} servers. Upgrade for more!`,
        variant: "destructive",
      });
      return;
    }

    if (!validateServerInfo(newServerData.ip)) {
      toast({
        title: "Error",
        description: "Please enter a valid IP address or hostname",
        variant: "destructive",
      });
      return;
    }

    // Validate WebSocket URL
    const wsValidation = validateWebSocketUrl(newServerData.websocketUrl);
    if (!wsValidation.valid) {
      toast({
        title: "WebSocket Error",
        description: wsValidation.error,
        variant: "destructive",
      });
      return;
    }

    // Test WebSocket connection
    toast({
      title: "Testing Connection",
      description: "Verifying secure WebSocket connection...",
    });

    const isWebSocketConnectable = await testWebSocketConnection(
      newServerData.websocketUrl,
    );
    if (!isWebSocketConnectable) {
      toast({
        title: "Connection Failed",
        description:
          "Unable to establish secure WebSocket connection. Please check your URL and server configuration.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newServerData.name);
      formData.append("description", newServerData.description);
      formData.append("ip", newServerData.ip);
      formData.append("websocketUrl", newServerData.websocketUrl);
      formData.append("category", newServerData.category);
      formData.append("version", newServerData.version);

      if (bannerFile) {
        formData.append("banner", bannerFile);
      }

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
      console.error("❌ Server submission error:", error);
      let errorMessage = "Failed to add server";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
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
      await navigator.clipboard.writeText(server.ip);
      toast({
        title: "Success",
        description: `Server IP copied to clipboard: ${server.ip}`,
      });
    } catch (error) {
      const tempInput = document.createElement("input");
      tempInput.value = server.ip;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);

      toast({
        title: "Success",
        description: `Server IP copied to clipboard: ${server.ip}`,
      });
    }
  };

  const resetForm = () => {
    setNewServerData({
      name: "",
      description: "",
      ip: "",
      websocketUrl: "",
      category: "survival",
      version: "1.8.8",
    });
    setBannerFile(null);
    setBannerPreview("");
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

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Servers</h1>
            <p className="text-muted-foreground">
              Discover and share Minecraft servers with the community
            </p>
          </div>

          {/* Tier info and server limits */}
          <div className="text-right">
            <Badge variant="outline" className="mb-2">
              {currentTier?.tier || "Free"} Tier
            </Badge>
            <p className="text-sm text-muted-foreground">
              Servers: {myServers.length}/
              {currentTier?.limits.owned_servers === -1
                ? "∞"
                : currentTier?.limits.owned_servers || 0}
            </p>
          </div>
        </div>

        <Tabs
          value={currentView}
          onValueChange={(value) => setCurrentView(value as "all" | "my")}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="all">All Servers</TabsTrigger>
              <TabsTrigger value="my">
                My Servers ({myServers.length})
              </TabsTrigger>
            </TabsList>

            <Dialog open={isAddServerOpen} onOpenChange={setIsAddServerOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground"
                  disabled={!canAddServer()}
                >
                  Add Server
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Your Server</DialogTitle>
                  <DialogDescription>
                    Share your Minecraft server with the community.
                    {!canUploadBanner() &&
                      " Banner uploads available for VIP+ members."}
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

                  <div>
                    <Label htmlFor="websocketUrl">Secure WebSocket URL</Label>
                    <Input
                      id="websocketUrl"
                      value={newServerData.websocketUrl}
                      onChange={(e) =>
                        setNewServerData({
                          ...newServerData,
                          websocketUrl: e.target.value,
                        })
                      }
                      placeholder="wss://yourserver.com:8080"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must use secure WebSocket protocol (wss://). Connection
                      will be tested before approval.
                    </p>
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

                  {canUploadBanner() && (
                    <div>
                      <Label htmlFor="banner">Server Banner (Optional)</Label>
                      <div className="mt-2">
                        <Input
                          id="banner"
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload a banner image (max{" "}
                          {(getMaxFileSize() / (1024 * 1024)).toFixed(1)}MB)
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
                  )}

                  {!canAddServer() && (
                    <Alert>
                      <AlertDescription>
                        You've reached your server limit (
                        {currentTier?.limits.owned_servers || 0} servers).
                        <Link
                          to="/store"
                          className="text-primary hover:underline ml-1"
                        >
                          Upgrade your tier
                        </Link>{" "}
                        to add more servers.
                      </AlertDescription>
                    </Alert>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddServerOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!canAddServer()}>
                      Add Server
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

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

          <TabsContent value="all" className="mt-0">
            {/* Server List */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <span className="animate-spin h-5 w-5 text-primary"></span>
                  <span className="text-muted-foreground">
                    Loading servers...
                  </span>
                </div>
              </div>
            )}

            {!loading && filteredServers.length > 0 ? (
              <div className="grid gap-6">
                {filteredServers.map((server) => (
                  <Card
                    key={server.id}
                    className="minecraft-panel overflow-hidden"
                  >
                    {server.banner && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={server.banner}
                          alt={`${server.name} banner`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold">{server.name}</h3>
                            <Badge variant="outline">{server.version}</Badge>
                            <Badge
                              variant={
                                server.isOnline ? "default" : "destructive"
                              }
                            >
                              {server.isOnline ? "Online" : "Offline"}
                            </Badge>
                            <Badge variant="secondary">{server.category}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">
                            {server.description}
                          </p>

                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <span>{server.likes} likes</span>
                            <span>by {server.ownerName}</span>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            onClick={() => handleCopyIP(server)}
                            disabled={!server.isOnline}
                            className="bg-primary text-primary-foreground"
                          >
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
                            {server.hasLiked ? "Liked" : "Like"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !loading ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No servers found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Be the first to add a server to the community!"}
                </p>
                <Button
                  onClick={() => setIsAddServerOpen(true)}
                  disabled={!canAddServer()}
                >
                  Add Your Server
                </Button>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="my" className="mt-0">
            {myServers.length > 0 ? (
              <div className="grid gap-6">
                {myServers.map((server) => (
                  <Card
                    key={server.id}
                    className="minecraft-panel overflow-hidden"
                  >
                    {server.banner && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={server.banner}
                          alt={`${server.name} banner`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold">{server.name}</h3>
                            <Badge variant="outline">{server.version}</Badge>
                            <Badge
                              variant={
                                server.isOnline ? "default" : "destructive"
                              }
                            >
                              {server.isOnline ? "Online" : "Offline"}
                            </Badge>
                            <Badge variant="secondary">{server.category}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">
                            {server.description}
                          </p>

                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <span>{server.likes} likes</span>
                            <span className="text-green-600">
                              You own this server
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            onClick={() => handleCopyIP(server)}
                            disabled={!server.isOnline}
                            className="bg-primary text-primary-foreground"
                          >
                            {server.isOnline ? "Copy IP" : "Offline"}
                          </Button>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setServerToDelete(server);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No servers yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't added any servers yet. Share your server with the
                  community!
                </p>
                <Button
                  onClick={() => setIsAddServerOpen(true)}
                  disabled={!canAddServer()}
                >
                  Add Your First Server
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                <span>Delete Server</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete "
                {serverToDelete?.name}"? This action cannot be undone.
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
                Delete Server
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </UserLayout>
  );
}
