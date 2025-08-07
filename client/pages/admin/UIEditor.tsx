import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Palette, Eye, Save, RotateCcw, Upload, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface UISettings {
  // Site branding
  site_name: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
  
  // Color scheme
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  
  // Homepage content
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  features_enabled: boolean;
  testimonials_enabled: boolean;
  
  // Navigation
  nav_items: Array<{
    label: string;
    path: string;
    enabled: boolean;
  }>;
  
  // Footer
  footer_text: string;
  footer_links: Array<{
    label: string;
    url: string;
  }>;
  
  // Social media
  discord_url: string;
  twitter_url: string;
  github_url: string;
  
  // Features
  registration_enabled: boolean;
  store_enabled: boolean;
  forums_enabled: boolean;
  events_enabled: boolean;
}

const defaultSettings: UISettings = {
  site_name: "UEC Launcher",
  site_description: "Ultimate Eaglercraft Client Platform",
  logo_url: "",
  favicon_url: "",
  
  primary_color: "#10b981",
  secondary_color: "#374151",
  accent_color: "#f59e0b",
  background_color: "#000000",
  text_color: "#ffffff",
  
  hero_title: "Welcome to UEC Launcher",
  hero_subtitle: "Launch Eaglercraft clients directly in your browser with friends, chat, and community features.",
  hero_cta_text: "Get Started",
  features_enabled: true,
  testimonials_enabled: true,
  
  nav_items: [
    { label: "Home", path: "/", enabled: true },
    { label: "Dashboard", path: "/dashboard", enabled: true },
    { label: "Store", path: "/store", enabled: true },
    { label: "Forums", path: "/forums", enabled: true },
    { label: "Events", path: "/events", enabled: true },
    { label: "About", path: "/about", enabled: true }
  ],
  
  footer_text: "© 2024 UEC Launcher. All rights reserved.",
  footer_links: [
    { label: "Privacy Policy", url: "/privacy" },
    { label: "Terms of Service", url: "/terms" },
    { label: "Support", url: "/support" }
  ],
  
  discord_url: "",
  twitter_url: "",
  github_url: "",
  
  registration_enabled: true,
  store_enabled: true,
  forums_enabled: true,
  events_enabled: true
};

export default function UIEditor() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<UISettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/login");
    } else {
      loadUISettings();
    }
  }, [user, navigate]);

  const loadUISettings = () => {
    // Load from localStorage for demo - in production this would be from API
    const savedSettings = localStorage.getItem('ui_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse UI settings:', error);
        setSettings(defaultSettings);
      }
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Save to localStorage for demo - in production this would go to API
      localStorage.setItem('ui_settings', JSON.stringify(settings));
      
      // Apply CSS variables for immediate preview
      applyCSSVariables();
      
      toast({
        title: "Settings saved",
        description: "UI settings have been updated successfully.",
      });
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save UI settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    toast({
      title: "Settings reset",
      description: "UI settings have been reset to defaults.",
    });
  };

  const applyCSSVariables = () => {
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS variables
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Apply color variables
    root.style.setProperty('--primary', hexToHsl(settings.primary_color));
    root.style.setProperty('--background', hexToHsl(settings.background_color));
    root.style.setProperty('--foreground', hexToHsl(settings.text_color));
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'uec-ui-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...imported });
        toast({
          title: "Settings imported",
          description: "UI settings have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid settings file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const updateSetting = <K extends keyof UISettings>(key: K, value: UISettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNavItem = (index: number, field: 'label' | 'path' | 'enabled', value: string | boolean) => {
    const newNavItems = [...settings.nav_items];
    newNavItems[index] = { ...newNavItems[index], [field]: value };
    updateSetting('nav_items', newNavItems);
  };

  const addNavItem = () => {
    const newNavItems = [...settings.nav_items, { label: 'New Item', path: '/new', enabled: true }];
    updateSetting('nav_items', newNavItems);
  };

  const removeNavItem = (index: number) => {
    const newNavItems = settings.nav_items.filter((_, i) => i !== index);
    updateSetting('nav_items', newNavItems);
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
            <h1 className="text-2xl font-bold text-primary">UI Editor</h1>
            <div className="flex items-center space-x-2">
              <Switch
                checked={previewMode}
                onCheckedChange={setPreviewMode}
              />
              <Label>Preview Mode</Label>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Website Customization</h1>
              <p className="text-muted-foreground">Customize your website appearance and content without coding</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
              id="import-settings"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-settings')?.click()}
              className="minecraft-button"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            
            <Button
              variant="outline"
              onClick={exportSettings}
              className="minecraft-button"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="minecraft-button"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>

            <Button
              onClick={saveSettings}
              disabled={loading}
              className="minecraft-button bg-primary text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-6">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Site Branding</CardTitle>
                <CardDescription>
                  Configure your website's brand identity and basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name}
                      onChange={(e) => updateSetting('site_name', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_description">Site Description</Label>
                    <Input
                      id="site_description"
                      value={settings.site_description}
                      onChange={(e) => updateSetting('site_description', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      placeholder="https://example.com/logo.png"
                      value={settings.logo_url}
                      onChange={(e) => updateSetting('logo_url', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favicon_url">Favicon URL</Label>
                    <Input
                      id="favicon_url"
                      placeholder="https://example.com/favicon.ico"
                      value={settings.favicon_url}
                      onChange={(e) => updateSetting('favicon_url', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discord_url">Discord URL</Label>
                    <Input
                      id="discord_url"
                      placeholder="https://discord.gg/..."
                      value={settings.discord_url}
                      onChange={(e) => updateSetting('discord_url', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter URL</Label>
                    <Input
                      id="twitter_url"
                      placeholder="https://twitter.com/..."
                      value={settings.twitter_url}
                      onChange={(e) => updateSetting('twitter_url', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github_url">GitHub URL</Label>
                    <Input
                      id="github_url"
                      placeholder="https://github.com/..."
                      value={settings.github_url}
                      onChange={(e) => updateSetting('github_url', e.target.value)}
                      className="minecraft-input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-6">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
                <CardDescription>
                  Customize your website's color palette and theme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        id="primary_color"
                        value={settings.primary_color}
                        onChange={(e) => updateSetting('primary_color', e.target.value)}
                        className="w-12 h-12 p-1 rounded"
                      />
                      <Input
                        value={settings.primary_color}
                        onChange={(e) => updateSetting('primary_color', e.target.value)}
                        className="minecraft-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        id="secondary_color"
                        value={settings.secondary_color}
                        onChange={(e) => updateSetting('secondary_color', e.target.value)}
                        className="w-12 h-12 p-1 rounded"
                      />
                      <Input
                        value={settings.secondary_color}
                        onChange={(e) => updateSetting('secondary_color', e.target.value)}
                        className="minecraft-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accent_color">Accent Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        id="accent_color"
                        value={settings.accent_color}
                        onChange={(e) => updateSetting('accent_color', e.target.value)}
                        className="w-12 h-12 p-1 rounded"
                      />
                      <Input
                        value={settings.accent_color}
                        onChange={(e) => updateSetting('accent_color', e.target.value)}
                        className="minecraft-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background_color">Background Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        id="background_color"
                        value={settings.background_color}
                        onChange={(e) => updateSetting('background_color', e.target.value)}
                        className="w-12 h-12 p-1 rounded"
                      />
                      <Input
                        value={settings.background_color}
                        onChange={(e) => updateSetting('background_color', e.target.value)}
                        className="minecraft-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text_color">Text Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        id="text_color"
                        value={settings.text_color}
                        onChange={(e) => updateSetting('text_color', e.target.value)}
                        className="w-12 h-12 p-1 rounded"
                      />
                      <Input
                        value={settings.text_color}
                        onChange={(e) => updateSetting('text_color', e.target.value)}
                        className="minecraft-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={applyCSSVariables}
                    variant="outline"
                    className="minecraft-button"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Colors
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Homepage Content</CardTitle>
                <CardDescription>
                  Customize the content displayed on your homepage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_title">Hero Title</Label>
                  <Input
                    id="hero_title"
                    value={settings.hero_title}
                    onChange={(e) => updateSetting('hero_title', e.target.value)}
                    className="minecraft-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                  <Textarea
                    id="hero_subtitle"
                    value={settings.hero_subtitle}
                    onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                    className="minecraft-input"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_cta_text">Call-to-Action Button Text</Label>
                  <Input
                    id="hero_cta_text"
                    value={settings.hero_cta_text}
                    onChange={(e) => updateSetting('hero_cta_text', e.target.value)}
                    className="minecraft-input"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.features_enabled}
                      onCheckedChange={(checked) => updateSetting('features_enabled', checked)}
                    />
                    <Label>Show Features Section</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.testimonials_enabled}
                      onCheckedChange={(checked) => updateSetting('testimonials_enabled', checked)}
                    />
                    <Label>Show Testimonials Section</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Footer Text</Label>
                  <Input
                    id="footer_text"
                    value={settings.footer_text}
                    onChange={(e) => updateSetting('footer_text', e.target.value)}
                    className="minecraft-input"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-6">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Navigation Menu</CardTitle>
                <CardDescription>
                  Configure the main navigation menu items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.nav_items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <Input
                        placeholder="Label"
                        value={item.label}
                        onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                        className="minecraft-input"
                      />
                      <Input
                        placeholder="Path"
                        value={item.path}
                        onChange={(e) => updateNavItem(index, 'path', e.target.value)}
                        className="minecraft-input"
                      />
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={(checked) => updateNavItem(index, 'enabled', checked)}
                        />
                        <Label>Enabled</Label>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeNavItem(index)}
                      className="minecraft-button text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                <Button
                  onClick={addNavItem}
                  variant="outline"
                  className="minecraft-button w-full"
                >
                  Add Navigation Item
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>
                  Enable or disable specific features of your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>User Registration</Label>
                      <p className="text-sm text-muted-foreground">Allow new users to register accounts</p>
                    </div>
                    <Switch
                      checked={settings.registration_enabled}
                      onCheckedChange={(checked) => updateSetting('registration_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Store</Label>
                      <p className="text-sm text-muted-foreground">Enable the store and purchases</p>
                    </div>
                    <Switch
                      checked={settings.store_enabled}
                      onCheckedChange={(checked) => updateSetting('store_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Forums</Label>
                      <p className="text-sm text-muted-foreground">Enable community forums</p>
                    </div>
                    <Switch
                      checked={settings.forums_enabled}
                      onCheckedChange={(checked) => updateSetting('forums_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Events</Label>
                      <p className="text-sm text-muted-foreground">Enable events and tournaments</p>
                    </div>
                    <Switch
                      checked={settings.events_enabled}
                      onCheckedChange={(checked) => updateSetting('events_enabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Live Preview */}
        {previewMode && (
          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                Preview how your changes will look on the website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 border border-border rounded-lg bg-card">
                <div style={{ 
                  backgroundColor: settings.background_color,
                  color: settings.text_color,
                  padding: '2rem',
                  borderRadius: '0.5rem'
                }}>
                  <h1 style={{ color: settings.primary_color, fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    {settings.hero_title}
                  </h1>
                  <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                    {settings.hero_subtitle}
                  </p>
                  <button style={{
                    backgroundColor: settings.primary_color,
                    color: settings.background_color,
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontWeight: '600'
                  }}>
                    {settings.hero_cta_text}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
