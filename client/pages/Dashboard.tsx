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
  const [fetchError, setFetchError] = useState(null);
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
      if (!user) return;

      setLoading(true);

      // Helper function to make authenticated requests with timeout
      const makeRequest = async (url, timeout = 10000) => {
        const token = localStorage.getItem("auth_token");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          console.log(`Making request to: ${url}`);
          const response = await fetch(url, {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          console.log(
            `Response from ${url}:`,
            response.status,
            response.statusText,
          );
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          console.error(`Request to ${url} failed:`, error);
          throw error;
        }
      };

      // Reset error state
      setFetchError(null);

      // Fetch clients with error handling
      try {
        const clientsResponse = await makeRequest("/api/clients");
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData.clients || []);
        } else {
          console.warn(
            "Clients API returned:",
            clientsResponse.status,
            clientsResponse.statusText,
          );
          setClients([]);
          if (clientsResponse.status >= 500) {
            setFetchError(
              "Server is experiencing issues. Some features may be unavailable.",
            );
          }
        }
      } catch (error) {
        const errorMsg =
          error.name === "AbortError" ? "Request timed out" : error.message;
        console.warn("Failed to fetch clients:", errorMsg);
        setClients([]);
        if (error.name === "AbortError" || error.message.includes("fetch")) {
          setFetchError(
            "Unable to connect to server. Please check your internet connection.",
          );
        }
      }

      // Fetch top servers with error handling
      try {
        const serversResponse = await makeRequest("/api/servers/top?limit=3");
        if (serversResponse.ok) {
          const serversData = await serversResponse.json();
          setTopServers(serversData.servers || []);
        } else {
          console.warn(
            "Servers API returned:",
            serversResponse.status,
            serversResponse.statusText,
          );
          setTopServers([]);
        }
      } catch (error) {
        console.warn(
          "Failed to fetch servers:",
          error.name === "AbortError" ? "Request timed out" : error.message,
        );
        setTopServers([]);
      }

      // Fetch partners with error handling
      try {
        const partnersResponse = await makeRequest("/api/admin/partners");
        if (partnersResponse.ok) {
          const partnersData = await partnersResponse.json();
          setPartners(partnersData.partners || []);
        } else {
          console.warn(
            "Partners API returned:",
            partnersResponse.status,
            partnersResponse.statusText,
          );
          setPartners([]);
        }
      } catch (error) {
        console.warn(
          "Failed to fetch partners:",
          error.name === "AbortError" ? "Request timed out" : error.message,
        );
        setPartners([]);
      }

      setLoading(false);
    };

    // Debounce the fetch to prevent rapid calls
    const timeoutId = setTimeout(() => {
      fetchDashboardData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user]);

  const launchClient = async () => {
    if (!selectedClient || selectedClient === "no-clients") return;

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Launch client and get URLs
      const response = await fetch(`/api/clients/${selectedClient}/launch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
          console.error(
            "Failed to launch client: Response not readable",
            response.status,
            response.statusText,
          );
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Launch request timed out");
      } else {
        console.error("Error launching client:", error.message || error);
      }
    } finally {
      setLoading(false);
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

        {/* Error message */}
        {fetchError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{fetchError}</p>
          </div>
        )}

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
                    <SelectValue
                      placeholder={
                        loading ? "Loading clients..." : "Choose a client..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        Loading clients...
                      </SelectItem>
                    ) : clients.length > 0 ? (
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
                disabled={
                  !selectedClient || selectedClient === "no-clients" || loading
                }
                size="lg"
                className="h-12 px-8 minecraft-button bg-primary text-primary-foreground border-none hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
              >
                <span className="-ml-0.5">
                  {loading ? "Loading..." : "Launch Game"}
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
