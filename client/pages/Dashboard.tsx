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
        try {
          const clientsResponse = await fetch("/api/clients");
          if (clientsResponse.ok) {
            const clientsData = await clientsResponse.json();
            setClients(clientsData.clients || []);
          } else {
            setClients([]);
          }
        } catch (error) {
          console.warn("Failed to fetch clients:", error);
          setClients([]);
        }

        // Fetch top servers
        try {
          const serversResponse = await fetch("/api/servers/top?limit=3");
          if (serversResponse.ok) {
            const serversData = await serversResponse.json();
            setTopServers(serversData.servers || []);
          } else {
            setTopServers([]);
          }
        } catch (error) {
          console.warn("Failed to fetch servers:", error);
          setTopServers([]);
        }

        // Fetch partners
        try {
          const partnersResponse = await fetch("/api/admin/partners");
          if (partnersResponse.ok) {
            const partnersData = await partnersResponse.json();
            setPartners(partnersData.partners || []);
          } else {
            setPartners([]);
          }
        } catch (error) {
          console.warn("Failed to fetch partners:", error);
          setPartners([]);
        }
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

      if (response.ok) {
        // Try to parse response data, but don't fail if it's not JSON
        try {
          const data = await response.json();
          console.log("Launch response:", data);
        } catch (parseError) {
          console.warn("Response not JSON, continuing anyway");
        }
        // Open client play URL
        window.open(`/api/clients/${selectedClient}/play`, "_blank");
      } else {
        // Try to get error message, but handle cases where response is not JSON
        try {
          const data = await response.json();
          console.error(
            "Failed to launch client:",
            data.error || "Unknown error",
          );
        } catch (parseError) {
          console.error("Failed to launch client: Response not readable");
        }
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
            <span className="text-sm font-medium">
              Level {user?.role === "admin" ? "Admin" : "Member"}
            </span>
          </div>
        </div>

        {/* Enhanced Client Launcher */}
        <Card className="minecraft-panel mb-8 bg-card border-2 border-primary/20 shadow-xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
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
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length > 0 ? (
                      clients.map((client) => (
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
                    ) : (
                      <SelectItem value="no-clients" disabled>
                        No clients available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={launchClient}
                disabled={!selectedClient || selectedClient === "no-clients"}
                size="lg"
                className="h-12 px-8 minecraft-button bg-primary text-primary-foreground border-none hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
              >
                <span className="-ml-0.5">
                  Launch Game
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Servers */}
        {topServers.length > 0 && (
          <Card className="minecraft-panel mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
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
