import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gamepad2, Users, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { MinecraftBackground } from "@/components/ui/minecraft-background";

export default function About() {
  return (
    <MinecraftBackground>
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-primary">UEC Launcher</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/20 rounded-xl flex items-center justify-center mx-auto">
              <Gamepad2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary">About UEC Launcher</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We built this because we got sick of broken Eaglercraft sites and wanted something that actually works.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="minecraft-panel">
              <CardHeader className="text-center">
                <Gamepad2 className="w-12 h-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Multiple Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  All the clients you need in one place. No more bookmark hell.
                </p>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Social Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Chat that doesn't lag out, friends list that works, forums that aren't dead.
                </p>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardHeader className="text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Admin Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Comprehensive administration panel with user management and analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardHeader className="text-center">
                <Zap className="w-12 h-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Store Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Built-in store with Tebex integration for ranks, cosmetics, and features.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* About Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  UEC Launcher was created to provide the best possible Eaglercraft experience directly in your browser. 
                  We believe in making Minecraft accessible to everyone, anywhere, without the need for downloads or installations.
                </p>
                <p className="text-muted-foreground">
                  Our platform combines the classic Minecraft experience with modern web technologies and social features 
                  to create a comprehensive gaming platform that brings players together.
                </p>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Technical Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Browser-based Eaglercraft clients</li>
                  <li>• Real-time multiplayer support</li>
                  <li>• WebSocket-based chat system</li>
                  <li>• Progressive Web App (PWA) support</li>
                  <li>• Mobile-responsive design</li>
                  <li>• Cloud save synchronization</li>
                  <li>• Admin dashboard with analytics</li>
                  <li>• Tebex payment integration</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Version Info */}
          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-primary mb-2">Version</h4>
                <p className="text-muted-foreground">UEC Launcher v2.0</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Supported Clients</h4>
                <p className="text-muted-foreground">Eaglercraft 1.5.2, 1.8.8</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Browser Support</h4>
                <p className="text-muted-foreground">Chrome, Firefox, Safari, Edge</p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Link to="/dashboard">
              <Button className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                Start Playing Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MinecraftBackground>
  );
}
