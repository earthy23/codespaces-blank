import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/ui/admin-layout";
// SVG icons removed as requested
import { useAuth } from "@/lib/auth";

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  chatEnabled: boolean;
  maxUsersOnline: number;
  sessionTimeout: number;
  supportEmail: string;
  serverMessage: string;
  backupEnabled: boolean;
  backupInterval: number;
  logLevel: "error" | "warning" | "info" | "debug";
  rateLimit: number;
  maxFileSize: number;
}

export default function SettingsAdmin() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "UEC Launcher",
    siteDescription: "Ultimate gaming experience platform",
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    chatEnabled: true,
    maxUsersOnline: 1000,
    sessionTimeout: 24,
    supportEmail: "support@uec.com",
    serverMessage: "Welcome to UEC Launcher! Enjoy your gaming experience.",
    backupEnabled: true,
    backupInterval: 24,
    logLevel: "info",
    rateLimit: 100,
    maxFileSize: 50,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      // In a real app, this would fetch from the API
      // For now, we'll use the default settings above
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!token) return;

    try {
      setIsSaving(true);

      // In a real app, this would send to the API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      console.log("Settings saved:", settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">System Settings</h1>
            <p className="text-gray-400">
              Configure system-wide settings and preferences
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={loadSettings}
              className="bg-gray-700 text-white hover:bg-gray-600"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={saveSettings}
              className="bg-white text-black hover:bg-gray-200"
              disabled={isSaving}
            >
              <Save
                className={`w-4 h-4 mr-2 ${isSaving ? "animate-spin" : ""}`}
              />
              Save Changes
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Settings */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-white">General Settings</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Basic site configuration and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Site Name
                  </label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => updateSetting("siteName", e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Support Email
                  </label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) =>
                      updateSetting("supportEmail", e.target.value)
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">
                  Site Description
                </label>
                <Textarea
                  value={settings.siteDescription}
                  onChange={(e) =>
                    updateSetting("siteDescription", e.target.value)
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">
                  Server Message
                </label>
                <Textarea
                  value={settings.serverMessage}
                  onChange={(e) =>
                    updateSetting("serverMessage", e.target.value)
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* User & Access Settings */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-white">User & Access Settings</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Control user registration and access settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">
                      Registration Enabled
                    </label>
                    <p className="text-xs text-gray-400">
                      Allow new user registrations
                    </p>
                  </div>
                  <Switch
                    checked={settings.registrationEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("registrationEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">
                      Maintenance Mode
                    </label>
                    <p className="text-xs text-gray-400">
                      Disable site for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      updateSetting("maintenanceMode", checked)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Max Users Online
                  </label>
                  <Input
                    type="number"
                    value={settings.maxUsersOnline}
                    onChange={(e) =>
                      updateSetting("maxUsersOnline", parseInt(e.target.value))
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Session Timeout (hours)
                  </label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      updateSetting("sessionTimeout", parseInt(e.target.value))
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Communication Settings */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <span className="text-white">Communication Settings</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure chat and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">
                      Chat Enabled
                    </label>
                    <p className="text-xs text-gray-400">
                      Enable global chat system
                    </p>
                  </div>
                  <Switch
                    checked={settings.chatEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("chatEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">
                      Email Notifications
                    </label>
                    <p className="text-xs text-gray-400">
                      Send system email notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("emailNotifications", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Performance */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-white">Security & Performance</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure security and performance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Rate Limit (requests/min)
                  </label>
                  <Input
                    type="number"
                    value={settings.rateLimit}
                    onChange={(e) =>
                      updateSetting("rateLimit", parseInt(e.target.value))
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Max File Size (MB)
                  </label>
                  <Input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) =>
                      updateSetting("maxFileSize", parseInt(e.target.value))
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Log Level
                  </label>
                  <select
                    value={settings.logLevel}
                    onChange={(e) => updateSetting("logLevel", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  >
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Backup Interval (hours)
                  </label>
                  <Input
                    type="number"
                    value={settings.backupInterval}
                    onChange={(e) =>
                      updateSetting("backupInterval", parseInt(e.target.value))
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">
                    Automatic Backups
                  </label>
                  <p className="text-xs text-gray-400">
                    Enable scheduled database backups
                  </p>
                </div>
                <Switch
                  checked={settings.backupEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("backupEnabled", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
