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
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Server,
  Trash2,
  Eye,
  ExternalLink,
  RefreshCw,
  Users,
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

interface GameServer {
  id: string;
  name: string;
  description: string;
  websocketUrl: string;
  banner?: string;
  category: string;
  isOnline: boolean;
  playerCount: number;
  maxPlayers: number;
  version: string;
  likes: number;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  lastChecked: string;
}

export default function ServersAdmin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [servers, setServers] = useState<GameServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedServer, setSelectedServer] = useState<GameServer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/admin");
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/servers');
        if (response.ok) {
          const data = await response.json();
          setServers(data.servers || []);
        }
      } catch (error) {
        console.error('Failed to fetch servers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && isAdmin()) {
      fetchServers();
    }
  }, [user, isAdmin]);

  const handleDeleteServer = async () => {
    if (!selectedServer) return;

    try {
      const response = await fetch(`/api/servers/${selectedServer.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setServers(servers.filter(s => s.id !== selectedServer.id));
        setShowDeleteDialog(false);
        setSelectedServer(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete server');
      }
    } catch (error) {
      console.error('Failed to delete server:', error);
      alert('Failed to delete server');
    }
  };

  const handleRefreshStatus = async (serverId: string) => {
    try {
      const response = await fetch(`/api/servers/${serverId}/status`, {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        setServers(servers.map(s => 
          s.id === serverId ? data.server : s
        ));
      }
    } catch (error) {
      console.error('Failed to refresh server status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-primary">Server Management</h1>
              </div>
            </div>
            <Link to="/servers">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public List
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Server Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage all community servers
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="minecraft-panel">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Servers</p>
                    <p className="text-2xl font-bold text-primary">{servers.length}</p>
                  </div>
                  <Server className="w-8 h-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Online Servers</p>
                    <p className="text-2xl font-bold text-green-500">
                      {servers.filter(s => s.isOnline).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Offline Servers</p>
                    <p className="text-2xl font-bold text-red-500">
                      {servers.filter(s => !s.isOnline).length}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Players</p>
                    <p className="text-2xl font-bold text-primary">
                      {servers.reduce((sum, s) => sum + s.playerCount, 0)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Servers Table */}
          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle>All Servers</CardTitle>
              <CardDescription>
                Monitor and manage community servers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading servers...</p>
                </div>
              ) : servers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Server</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Players</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.map((server) => (
                      <TableRow key={server.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {server.banner && (
                              <img
                                src={server.banner}
                                alt={server.name}
                                className="w-12 h-8 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{server.name}</p>
                              <p className="text-sm text-muted-foreground">{server.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{server.ownerName}</p>
                            <p className="text-sm text-muted-foreground">{server.ownerId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={server.isOnline ? "default" : "destructive"}
                              className={server.isOnline ? "bg-green-500" : ""}
                            >
                              {server.isOnline ? "Online" : "Offline"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRefreshStatus(server.id)}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{server.playerCount}/{server.maxPlayers}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>{server.likes}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(server.createdAt)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(server.lastChecked)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <a
                              href={server.websocketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedServer(server);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Server className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No servers found</h3>
                  <p className="text-muted-foreground">
                    No servers have been submitted to the community yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Server</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedServer?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteServer}>
              Delete Server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
