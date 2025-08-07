import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { UserLayout } from "@/components/ui/user-layout";

const clientDownloads = [
  {
    id: "vanilla",
    name: "Vanilla Client",
    description: "Classic Minecraft experience with all the original features",
    version: "1.8.8",
    size: "12.4 MB",
    type: "Stable",
    features: [
      "Classic Minecraft gameplay",
      "Multiplayer support",
      "Creative and Survival modes",
      "Redstone mechanics",
      "Command blocks",
    ],
    downloadUrl: "/downloads/vanilla-client.zip",
    webUrl: "/client/vanilla/",
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary drop-shadow-[0_0_4px_currentColor]">
        <rect x="6" y="4" width="12" height="16" rx="2" fill="currentColor" opacity="0.8"/>
        <rect x="8" y="6" width="8" height="2" rx="1" fill="white"/>
        <rect x="8" y="9" width="8" height="2" rx="1" fill="white"/>
        <rect x="8" y="12" width="6" height="2" rx="1" fill="white"/>
      </svg>
    ),
  },
  {
    id: "pvp",
    name: "PvP Client",
    description: "Optimized for player vs player combat with enhanced features",
    version: "1.8.8-PvP",
    size: "13.1 MB",
    type: "Optimized",
    features: [
      "Low latency optimization",
      "Combat enhancements",
      "FPS optimizations",
      "PvP-focused UI",
      "Tournament mode support",
    ],
    downloadUrl: "/downloads/pvp-client.zip",
    webUrl: "/client/pvp/",
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary drop-shadow-[0_0_4px_currentColor]">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="currentColor"/>
        <polyline points="7.5,4.21 12,6.81 16.5,4.21" stroke="white" strokeWidth="2" fill="none"/>
        <polyline points="7.5,19.79 7.5,14.6 3,12" stroke="white" strokeWidth="2" fill="none"/>
        <polyline points="21,12 16.5,14.6 16.5,19.79" stroke="white" strokeWidth="2" fill="none"/>
        <polyline points="12,22.08 12,17" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    ),
  },
  {
    id: "creative",
    name: "Creative Client",
    description: "Enhanced creative mode with additional building tools",
    version: "1.8.8-Creative",
    size: "14.2 MB",
    type: "Enhanced",
    features: [
      "Extended block palette",
      "Advanced building tools",
      "World edit capabilities",
      "Schematic support",
      "Creative-focused interface",
    ],
    downloadUrl: "/downloads/creative-client.zip",
    webUrl: "/client/creative/",
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary drop-shadow-[0_0_4px_currentColor]">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="currentColor" opacity="0.8"/>
        <circle cx="9" cy="7" r="4" fill="currentColor"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    ),
  },
];

const tools = [
  {
    name: "UEC Launcher Desktop",
    description: "Desktop application for managing multiple clients",
    version: "2.1.0",
    size: "45.3 MB",
    platform: "Windows/Mac/Linux",
    downloadUrl: "/downloads/uec-launcher-desktop.zip",
  },
  {
    name: "Resource Pack Manager",
    description: "Tool for managing and applying custom resource packs",
    version: "1.5.2",
    size: "8.7 MB",
    platform: "Universal",
    downloadUrl: "/downloads/resource-pack-manager.zip",
  },
];

export default function Downloads() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleDownload = (clientId: string, downloadUrl: string) => {
    console.log(`Downloading ${clientId} from ${downloadUrl}`);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${clientId}-client.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`Download initiated for ${clientId}`);
  };

  const handlePlayOnline = (webUrl: string) => {
    window.open(webUrl, "_blank");
  };

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="max-w-6xl">
        {/* Downloads Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Download Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Download Eaglercraft clients and tools. All downloads are exclusive
            to registered users.
          </p>
        </div>

        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-2 minecraft-border">
            <TabsTrigger value="clients">Game Clients</TabsTrigger>
            <TabsTrigger value="tools">Tools & Utilities</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientDownloads.map((client) => {
                return (
                  <Card
                    key={client.id}
                    className="minecraft-panel bg-card border-2 border-border shadow-lg hover:shadow-primary/10"
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 flex items-center justify-center">
                          {client.iconSvg}
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {client.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{client.version}</Badge>
                            <Badge variant="secondary">{client.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription>{client.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          Features:
                        </h4>
                        <ul className="space-y-1">
                          {client.features.map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-center text-sm text-muted-foreground"
                            >
                              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 mr-2 flex-shrink-0 text-primary">
                                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.8"/>
                                <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>Size: {client.size}</p>
                      </div>

                      <div className="space-y-2">
                        <Button
                          className="w-full minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
                          onClick={() => handlePlayOnline(client.webUrl)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                            <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                          </svg>
                          Play Online
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full minecraft-border hover:shadow-primary/20"
                          onClick={() =>
                            handleDownload(client.id, client.downloadUrl)
                          }
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          Download Client
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="mt-8">
            <div className="grid md:grid-cols-2 gap-6">
              {tools.map((tool, index) => (
                <Card
                  key={index}
                  className="minecraft-panel bg-card border-2 border-border shadow-lg hover:shadow-primary/10"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{tool.name}</span>
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Version</p>
                          <p className="font-medium">{tool.version}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Size</p>
                          <p className="font-medium">{tool.size}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Platform</p>
                          <p className="font-medium">{tool.platform}</p>
                        </div>
                      </div>

                      <Button
                        className="w-full minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
                        onClick={() =>
                          handleDownload(tool.name, tool.downloadUrl)
                        }
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                          <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" fill="none"/>
                          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Download Information */}
        <Card className="minecraft-panel mt-8 bg-card border-2 border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <span>Download Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2 text-primary">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor"/>
                    <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
                  </svg>
                  Security
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• All files are scanned for malware</li>
                  <li>• Digital signatures verify authenticity</li>
                  <li>• Regular security updates</li>
                  <li>• Safe download guaranteed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Modern web browser (Chrome, Firefox, Safari)</li>
                  <li>• JavaScript enabled</li>
                  <li>• Stable internet connection</li>
                  <li>• For downloads: 50MB+ free space</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">Need Help?</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Having trouble with downloads or need technical support?
              </p>
              <Link to="/support">
                <Button
                  variant="outline"
                  className="minecraft-border hover:shadow-primary/20"
                >
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
