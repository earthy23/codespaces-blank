import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MinecraftBackground } from "@/components/ui/minecraft-background";
import { UECLogo } from "@/components/ui/uec-logo";

export default function Index() {
  return (
    <MinecraftBackground>
      
      {/* Navigation */}
      <nav className="relative z-10 border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <UECLogo size="lg" />
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Animated Logo */}
            <div className="mb-8 animate-pulse">
              <div className="w-32 h-32 mx-auto bg-primary/20 rounded-2xl border-2 border-primary flex items-center justify-center mb-6 p-4">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F1b395d19798c42b290cad33382fe9140%2F274abb1d54544fee85eb21dbc2ee0ff6?format=webp&width=200"
                  alt="UEC Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              UEC Launcher
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your hub for Eaglercraft clients. Built by the community, for the community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg">
                  Get Started
                </Button>
              </Link>
              <Link to="/downloads">
                <Button size="lg" variant="outline" className="minecraft-button px-8 py-6 text-lg">
                  Browse Clients
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-16 bg-card/80">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Why UEC?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We made this because we got tired of sketchy client sites and wanted something that actually works
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="minecraft-panel">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                </div>
                <h3 className="text-xl font-semibold mb-3">Quick Access</h3>
                <p className="text-muted-foreground">
                  Launch clients straight from your browser. No more hunting around for working links.
                </p>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                </div>
                <h3 className="text-xl font-semibold mb-3">Actually Good Chat</h3>
                <p className="text-muted-foreground">
                  Chat with friends without lag. Voice chat that doesn't cut out every 5 seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                </div>
                <h3 className="text-xl font-semibold mb-3">No BS</h3>
                <p className="text-muted-foreground">
                  Clean interface, no ads, no crypto miners. Just works like it should.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What is UEC Section */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary">What's UEC about?</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <p className="text-lg text-muted-foreground mb-6">
                  Started this project because finding decent Eaglercraft clients was a pain. Too many broken sites,
                  sketchy downloads, and terrible UIs. So we built something better.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    • Chat that doesn't suck
                  </li>
                  <li className="flex items-center">
                    • Add friends without jumping through hoops
                  </li>
                  <li className="flex items-center">
                    • All the good clients in one place
                  </li>
                  <li className="flex items-center">
                    • Actually functional moderation
                  </li>
                </ul>
              </div>
              <div className="minecraft-panel p-8">
                <div className="w-full h-48 bg-primary/10 rounded-lg flex items-center justify-center">
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 bg-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to ditch the sketchy sites?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the community that's tired of broken clients and wants something that works.
          </p>
          <Link to="/register">
            <Button size="lg" className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg">
              Join UEC Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <UECLogo size="md" className="mb-4" />
              <p className="text-sm text-muted-foreground">
                Eaglercraft launcher that doesn't suck. Made by players, for players.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/downloads" className="hover:text-primary">Downloads</Link></li>
                <li><Link to="/news" className="hover:text-primary">News</Link></li>
                <li><Link to="/events" className="hover:text-primary">Events</Link></li>
                <li><Link to="/forums" className="hover:text-primary">Forums</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/support" className="hover:text-primary">Support</Link></li>
                <li><Link to="/store" className="hover:text-primary">Store</Link></li>
                <li><Link to="/partners" className="hover:text-primary">Partners</Link></li>
                <li><Link to="/about" className="hover:text-primary">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 UEC Launcher. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </MinecraftBackground>
  );
}
