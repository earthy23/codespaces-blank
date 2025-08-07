import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Mail, Handshake, Star, Users, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function Partners() {
  const partners = [
    {
      name: "Tebex",
      description: "Payment processing and store management for Minecraft servers",
      website: "https://tebex.io",
      logo: "🛒",
      type: "Payment Partner"
    },
    {
      name: "Eaglercraft Community",
      description: "The community behind browser-based Minecraft clients",
      website: "https://eaglercraft.com",
      logo: "⛏️",
      type: "Technology Partner"
    },
    {
      name: "Discord",
      description: "Community communication and support channels",
      website: "https://discord.gg/uec",
      logo: "💬",
      type: "Community Partner"
    }
  ];

  const benefits = [
    {
      icon: Users,
      title: "Community Growth",
      description: "Join our network of servers and reach more players"
    },
    {
      icon: Star,
      title: "Enhanced Features",
      description: "Access to premium tools and exclusive integrations"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Expand your server's presence across multiple regions"
    },
    {
      icon: Handshake,
      title: "Technical Support",
      description: "Priority support and development assistance"
    }
  ];

  return (
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
            <Handshake className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-primary">Our Partners</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Working together with leading companies and communities to deliver the best Minecraft experience.
          </p>
        </div>

        {/* Current Partners */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-primary text-center">Current Partners</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {partners.map((partner, index) => (
              <Card key={index} className="minecraft-panel">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">{partner.logo}</div>
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {partner.type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {partner.description}
                  </p>
                  <Button 
                    variant="outline" 
                    className="minecraft-button w-full"
                    onClick={() => window.open(partner.website, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Partnership Benefits */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-primary text-center">Partnership Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="minecraft-panel">
                <CardHeader className="text-center">
                  <benefit.icon className="w-12 h-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Partnership Types */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle>Server Partners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Partner with UEC Launcher to feature your server and reach more players through our platform.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Featured server listings</li>
                <li>Dedicated client configurations</li>
                <li>Analytics and player insights</li>
                <li>Custom branding options</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle>Technology Partners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Collaborate on technical integrations and platform improvements to enhance the user experience.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>API integrations</li>
                <li>Plugin development</li>
                <li>Performance optimizations</li>
                <li>Security enhancements</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle>Content Partners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Create content, tutorials, and resources to help grow the UEC Launcher community.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Video tutorials</li>
                <li>Blog posts and guides</li>
                <li>Community events</li>
                <li>Social media promotion</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How to Partner */}
        <Card className="minecraft-panel">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Become a Partner</CardTitle>
            <CardDescription>
              Interested in partnering with UEC Launcher? We'd love to hear from you!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">What We Look For</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Alignment with our community values</li>
                  <li>Quality products or services</li>
                  <li>Active engagement with the Minecraft community</li>
                  <li>Commitment to long-term partnership</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Partnership Process</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Submit partnership proposal</li>
                  <li>Initial review and discussion</li>
                  <li>Technical integration planning</li>
                  <li>Agreement finalization</li>
                  <li>Launch and ongoing support</li>
                </ul>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Ready to explore a partnership opportunity? Get in touch with our team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/support">
                  <Button className="minecraft-button bg-primary text-primary-foreground">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Us
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="minecraft-button"
                  onClick={() => window.open('mailto:partnerships@ueclauncher.com', '_blank')}
                >
                  partnerships@ueclauncher.com
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
