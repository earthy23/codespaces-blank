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
              The ultimate platform for Eaglercraft web clients. Launch games, connect with friends, and join the community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-2">
                    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                  </svg>
                  Start Playing Now
                </Button>
              </Link>
              <Link to="/downloads">
                <Button size="lg" variant="outline" className="minecraft-button px-8 py-6 text-lg">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Download Clients
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Why Choose UEC?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience Minecraft like never before with our advanced launcher and community features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="minecraft-panel">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary">
                    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                    <circle cx="12" cy="12" r="2" fill="white"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Launch</h3>
                <p className="text-muted-foreground">
                  Launch multiple Eaglercraft clients instantly from your browser. No downloads required.
                </p>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary">
                    <circle cx="9" cy="7" r="4" fill="currentColor"/>
                    <path d="m3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="16" cy="11" r="3" fill="currentColor" opacity="0.7"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Social Hub</h3>
                <p className="text-muted-foreground">
                  Connect with friends, join voice chats, and build your community in one place.
                </p>
              </CardContent>
            </Card>

            <Card className="minecraft-panel">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor"/>
                    <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure & Safe</h3>
                <p className="text-muted-foreground">
                  Advanced moderation tools and secure infrastructure keep your gaming experience safe.
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
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary">What is UEC?</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <p className="text-lg text-muted-foreground mb-6">
                  UEC (Ultimate Eaglercraft) Launcher is the premier platform for accessing Eaglercraft web clients. 
                  We provide a seamless, browser-based Minecraft experience with powerful social features.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-3 text-primary">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
                      <circle cx="8" cy="11" r="1" fill="white"/>
                      <circle cx="12" cy="11" r="1" fill="white"/>
                      <circle cx="16" cy="11" r="1" fill="white"/>
                    </svg>
                    Real-time chat and voice communication
                  </li>
                  <li className="flex items-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-3 text-primary">
                      <circle cx="9" cy="7" r="4" fill="currentColor"/>
                      <path d="m3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="16" cy="11" r="3" fill="currentColor" opacity="0.7"/>
                    </svg>
                    Friend system and social features
                  </li>
                  <li className="flex items-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-3 text-primary">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Multiple client downloads and versions
                  </li>
                  <li className="flex items-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-3 text-primary">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor"/>
                      <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
                    </svg>
                    Advanced moderation and safety tools
                  </li>
                </ul>
              </div>
              <div className="minecraft-panel p-8">
                <div className="w-full h-48 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-24 h-24 text-primary/50">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="currentColor"/>
                    <circle cx="8" cy="12" r="2" fill="white"/>
                    <circle cx="16" cy="12" r="2" fill="white"/>
                    <rect x="11" y="8" width="2" height="8" rx="1" fill="white"/>
                    <rect x="7" y="11" width="10" height="2" rx="1" fill="white"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 bg-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Adventure?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of players already using UEC Launcher. Create your account and start playing today.
          </p>
          <Link to="/register">
            <Button size="lg" className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-2">
                <polygon points="5,3 19,12 5,21" fill="currentColor"/>
              </svg>
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
                The ultimate platform for Eaglercraft web clients and community features.
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
