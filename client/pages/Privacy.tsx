import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
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
          <h1 className="text-3xl font-bold text-primary mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">We collect information you provide directly to us, such as when you:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Create an account or update your profile</li>
              <li>Make purchases through our store</li>
              <li>Participate in chat or forums</li>
              <li>Contact us for support</li>
              <li>Subscribe to newsletters or notifications</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>2. Types of Data Collected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-primary mb-2">Personal Information</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Username and email address</li>
                <li>Profile information you choose to provide</li>
                <li>Payment information (processed securely by third parties)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Usage Information</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Game activity and statistics</li>
                <li>Chat messages and forum posts</li>
                <li>Login times and session duration</li>
                <li>Feature usage and preferences</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Technical Information</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>IP address and browser information</li>
                <li>Device type and operating system</li>
                <li>Cookies and local storage data</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>3. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>4. Information Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>With your explicit consent</li>
              <li>To trusted service providers who assist in operating our service</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>5. Data Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We implement appropriate security measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. This includes encryption of sensitive data, secure servers, 
              and regular security audits.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>6. Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We retain your personal information only for as long as necessary to provide our services and fulfill 
              the purposes outlined in this privacy policy. Account data is retained until you request deletion, 
              while usage logs may be retained for up to 2 years for security and analytics purposes.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>7. Your Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of promotional communications</li>
              <li>Request information about how your data is used</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>8. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. 
              You can control cookie settings through your browser, though some features may not work properly if cookies are disabled.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>9. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information 
              from children under 13. If we become aware that we have collected personal information from a child under 13, 
              we will take steps to delete such information.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>10. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new 
              privacy policy on this page and updating the "Last updated" date. Continued use of the service after changes 
              constitutes acceptance of the new policy.
            </p>
          </CardContent>
        </Card>

        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>11. Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our data practices, please contact us through our 
              support system or email us at privacy@ueclauncher.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
