import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useFriends } from "@/lib/friends";
import { useChat } from "@/lib/chat";
import { UserLayout } from "@/components/ui/user-layout";

export default function Dashboard() {
  const [selectedClient, setSelectedClient] = useState("");
  const [clients, setClients] = useState([]);
  const [topServers, setTopServers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { onlineFriends } = useFriends();
  const { unreadTotal } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch clients
        const clientsResponse = await fetch("/api/clients");
        const clientsData = await clientsResponse.json();
        setClients(clientsData.clients || []);

        // Fetch top servers
        const serversResponse = await fetch("/api/servers/top?limit=3");
        const serversData = await serversResponse.json();
        setTopServers(serversData.servers || []);

        // Fetch partners
        const partnersResponse = await fetch("/api/admin/partners");
        const partnersData = await partnersResponse.json();
        setPartners(partnersData.partners || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setClients([]);
        setTopServers([]);
        setPartners([]);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const launchClient = async () => {
    if (!selectedClient || selectedClient === "no-clients") return;
    try {
      // Launch client and get URLs
      const response = await fetch(`/api/clients/${selectedClient}/launch`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        // Open client play URL
        window.open(`/api/clients/${selectedClient}/play`, "_blank");
      } else {
        console.error("Failed to launch client:", data.error);
      }
    } catch (error) {
      console.error("Error launching client:", error);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back!
            </h1>
            <p className="text-muted-foreground">
              Ready to play some Eaglercraft?
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <img src="https://images.pexels.com/photos/10068851/pexels-photo-10068851.jpeg" alt="Rank" className="w-5 h-5 rounded object-cover" />
            <span className="text-sm font-medium">
              Level {user?.role === "admin" ? "Admin" : "Member"}
            </span>
          </div>
        </div>

        {/* Enhanced Client Launcher */}
        <Card className="minecraft-panel mb-8 bg-card border-2 border-primary/20 shadow-xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/30 overflow-hidden">
                <img src="https://images.pexels.com/photos/4225229/pexels-photo-4225229.jpeg" alt="Gaming Setup" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-xl">Launch Client</span>
                <p className="text-sm font-normal text-muted-foreground">
                  Select and launch your preferred Eaglercraft client
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                  disabled={false}
                >
                  <SelectTrigger className="minecraft-input h-12 text-base border-2">
                    <SelectValue
                      placeholder="Choose a client..."
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length > 0
                      ? clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="py-1">
                              <div className="font-medium">
                                {client.name} v{client.version}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {client.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      : (
                          <SelectItem value="no-clients" disabled>
                            No clients available
                          </SelectItem>
                        )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={launchClient}
                disabled={
                  !selectedClient || selectedClient === "no-clients"
                }
                size="lg"
                className="h-12 px-8 minecraft-button bg-primary text-primary-foreground border-none hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
              >
                <img src="https://images.pexels.com/photos/4225229/pexels-photo-4225229.jpeg" alt="Gaming" className="w-5 h-5 mr-2 rounded object-cover" />
"Launch Game"
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg hover:shadow-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Online Friends
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {onlineFriends.length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Users className="w-6 h-6 text-primary drop-shadow-[0_0_4px_currentColor]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg hover:shadow-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Unread Messages
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {unreadTotal}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                  <MessageCircle className="w-6 h-6 text-primary drop-shadow-[0_0_4px_currentColor]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg hover:shadow-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Account Status
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {user?.role === "admin" ? "Administrator" : "Member"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Shield className="w-6 h-6 text-primary drop-shadow-[0_0_4px_currentColor]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Servers */}
        {topServers.length > 0 && (
          <Card className="minecraft-panel mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Server className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                </div>
                <span>Popular Servers</span>
              </CardTitle>
              <CardDescription>
                Most liked servers in the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {topServers.map((server) => (
                  <Card
                    key={server.id}
                    className="minecraft-panel hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4">
                      {server.banner && (
                        <div className="h-20 mb-3 overflow-hidden rounded-lg">
                          <img
                            src={server.banner}
                            alt={server.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h4 className="font-semibold mb-1">{server.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {server.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>{server.likes} likes</span>
                        <Badge
                          variant={server.isOnline ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {server.isOnline ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <Link to="/servers">
                        <Button
                          size="sm"
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/20"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          View Servers
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <Card className="minecraft-panel mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Shield className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                </div>
                <span>Our Partners</span>
              </CardTitle>
              <CardDescription>Organizations we work with</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {partners.map((partner) => (
                  <Card
                    key={partner.id}
                    className="minecraft-panel text-center hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4">
                      {partner.logo && (
                        <div className="h-16 mb-3 flex items-center justify-center">
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}
                      <h5 className="font-semibold text-sm mb-1">
                        {partner.name}
                      </h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        {partner.description}
                      </p>
                      {partner.url && (
                        <a
                          href={partner.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-primary hover:underline"
                        >
                          Visit
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
