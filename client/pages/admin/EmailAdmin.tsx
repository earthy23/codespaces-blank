import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Send, Settings, TestTube, CheckCircle, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface EmailSettings {
  email_enabled: boolean;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  from_email: string;
}

interface EmailStats {
  sent: number;
  pending: number;
  failed: number;
  total: number;
}

export default function EmailAdmin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [settings, setSettings] = useState<EmailSettings>({
    email_enabled: false,
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_secure: false,
    from_email: 'noreply@localhost'
  });

  const [stats, setStats] = useState<EmailStats>({
    sent: 0,
    pending: 0,
    failed: 0,
    total: 0
  });

  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/login");
    } else {
      loadEmailSettings();
      loadEmailStats();
    }
  }, [user, navigate]);

  const loadEmailSettings = async () => {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use localStorage as a demo
      const savedSettings = localStorage.getItem('email_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
    }
  };

  const loadEmailStats = () => {
    // Mock stats for demo - in production this would come from the API
    setStats({
      sent: 156,
      pending: 3,
      failed: 8,
      total: 167
    });
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Save to localStorage for demo - in production this would go to API
      localStorage.setItem('email_settings', JSON.stringify(settings));
      
      toast({
        title: "Settings saved",
        description: "Email settings have been updated successfully.",
      });
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      // Mock test for demo - in production this would call the API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = settings.smtp_host && settings.smtp_user && settings.smtp_password;
      
      setTestResult({
        success,
        message: success 
          ? 'SMTP connection successful!' 
          : 'SMTP connection failed. Please check your settings.'
      });
      
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection test failed: ' + (error as Error).message
      });
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Mock send test email - in production this would call the API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Test email sent",
        description: `Test email sent to ${testEmail}`,
      });
      
      setTestEmail('');
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof EmailSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>
            <h1 className="text-2xl font-bold text-primary">Email Management</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">Email Settings</h1>
            <p className="text-muted-foreground">Configure SMTP settings and manage email delivery</p>
          </div>
        </div>

        {/* Email Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="minecraft-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Mail className="w-8 h-8 text-yellow-600/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                </div>
                <Send className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">SMTP Settings</TabsTrigger>
            <TabsTrigger value="test">Test Email</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>SMTP Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure your SMTP server settings for sending emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.email_enabled}
                    onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
                  />
                  <Label>Enable Email Service</Label>
                  <Badge variant={settings.email_enabled ? "default" : "secondary"}>
                    {settings.email_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      placeholder="smtp.gmail.com"
                      value={settings.smtp_host}
                      onChange={(e) => updateSetting('smtp_host', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      placeholder="587"
                      value={settings.smtp_port}
                      onChange={(e) => updateSetting('smtp_port', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp_user">SMTP Username</Label>
                    <Input
                      id="smtp_user"
                      placeholder="your-email@gmail.com"
                      value={settings.smtp_user}
                      onChange={(e) => updateSetting('smtp_user', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp_password">SMTP Password</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      placeholder="your-app-password"
                      value={settings.smtp_password}
                      onChange={(e) => updateSetting('smtp_password', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      placeholder="noreply@yourdomain.com"
                      value={settings.from_email}
                      onChange={(e) => updateSetting('from_email', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.smtp_secure}
                      onCheckedChange={(checked) => updateSetting('smtp_secure', checked)}
                    />
                    <Label>Use SSL/TLS</Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={saveSettings}
                    disabled={loading}
                    className="minecraft-button bg-primary text-primary-foreground"
                  >
                    {loading ? "Saving..." : "Save Settings"}
                  </Button>

                  <Button
                    onClick={testEmailConnection}
                    disabled={testing || !settings.email_enabled}
                    variant="outline"
                    className="minecraft-button"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testing ? "Testing..." : "Test Connection"}
                  </Button>
                </div>

                {testResult && (
                  <div className={`p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-500/10 border-green-500/20 text-green-600' 
                      : 'bg-red-500/10 border-red-500/20 text-red-600'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Send Test Email</span>
                </CardTitle>
                <CardDescription>
                  Send a test email to verify your configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test_email">Test Email Address</Label>
                  <Input
                    id="test_email"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="minecraft-input"
                  />
                </div>

                <Button
                  onClick={sendTestEmail}
                  disabled={loading || !settings.email_enabled || !testEmail}
                  className="minecraft-button bg-primary text-primary-foreground"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Sending..." : "Send Test Email"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Manage email templates for automated messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium">Welcome Email</h4>
                    <p className="text-sm text-muted-foreground">Sent to new users when they register</p>
                    <Button variant="outline" className="mt-2 minecraft-button">
                      Edit Template
                    </Button>
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium">Password Reset</h4>
                    <p className="text-sm text-muted-foreground">Sent when users request a password reset</p>
                    <Button variant="outline" className="mt-2 minecraft-button">
                      Edit Template
                    </Button>
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium">Email Verification</h4>
                    <p className="text-sm text-muted-foreground">Sent to verify email addresses</p>
                    <Button variant="outline" className="mt-2 minecraft-button">
                      Edit Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
