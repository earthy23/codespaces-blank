import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terms() {
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

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              By accessing and using UEC Launcher, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>2. Description of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              UEC Launcher is a web-based platform that provides access to Eaglercraft clients and related gaming services. 
              The service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Browser-based Minecraft client access</li>
              <li>Social features including friends and chat</li>
              <li>Community forums and news</li>
              <li>Store for in-game purchases</li>
              <li>User account management</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>3. User Accounts and Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To access certain features of UEC Launcher, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>4. User Conduct</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use the service for any unlawful purpose or activity</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Upload or distribute malicious content</li>
              <li>Attempt to gain unauthorized access to the service</li>
              <li>Interfere with the proper working of the service</li>
              <li>Use cheats, exploits, or unauthorized modifications</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>5. Privacy and Data Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your privacy is important to us. We collect and use information in accordance with our Privacy Policy. 
              By using our service, you consent to the collection and use of information as described in our Privacy Policy.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>6. Purchases and Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              UEC Launcher may offer digital goods and services for purchase. By making a purchase, you agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>All sales are final unless otherwise specified</li>
              <li>Prices are subject to change without notice</li>
              <li>You are responsible for all applicable taxes</li>
              <li>Digital goods have no monetary value outside the service</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>7. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The service and its original content, features, and functionality are owned by UEC Launcher and are protected 
              by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>8. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              In no event shall UEC Launcher be liable for any indirect, incidental, special, consequential, or punitive damages, 
              including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>9. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, 
              we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>10. Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us through our support system.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
