import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { User, Save, Mail, Shield, Settings, Eye, EyeOff, Users, Video, Heart, Calendar } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/ui/user-layout";

interface ProfileVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  createdAt: string;
  duration: string;
}

interface ProfileUser {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  joinedAt: string;
  followers: number;
  following: number;
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  isFollowing?: boolean;
  role?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [userVideos, setUserVideos] = useState<ProfileVideo[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    friendRequests: true,
    chatNotifications: true,
    pingNotifications: true,
    voiceChatEnabled: true,
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const targetUserId = userId || user.id;
    const isOwn = !userId || userId === user.id;
    setIsOwnProfile(isOwn);

    if (isOwn) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setProfileUser({
        id: user.id,
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        joinedAt: user.createdAt || new Date().toISOString(),
        followers: 0,
        following: 0,
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        role: user.role,
      });
    } else {
      loadUserProfile(targetUserId);
    }

    loadUserVideos(targetUserId);
  }, [user, userId, navigate]);

  const loadUserProfile = async (targetUserId: string) => {
    try {
      setIsLoadingProfile(true);

      // Mock data for demonstration
      const mockProfile: ProfileUser = {
        id: targetUserId,
        username: "ViewedUser",
        bio: "Minecraft enthusiast and content creator. Love building epic structures and sharing tutorials!",
        joinedAt: new Date(Date.now() - 31536000000).toISOString(), // 1 year ago
        followers: 1250,
        following: 89,
        totalVideos: 23,
        totalViews: 45600,
        totalLikes: 2340,
        isFollowing: false,
      };

      setProfileUser(mockProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadUserVideos = async (targetUserId: string) => {
    try {
      // Mock videos for demonstration
      const mockVideos: ProfileVideo[] = [
        {
          id: "1",
          title: "How to Build a Modern House in Minecraft",
          thumbnail: "https://via.placeholder.com/320x180/8b5cf6/ffffff?text=Modern+House",
          views: 12400,
          likes: 456,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          duration: "15:32",
        },
        {
          id: "2",
          title: "Redstone Tutorial: Automatic Farm",
          thumbnail: "https://via.placeholder.com/320x180/10b981/ffffff?text=Auto+Farm",
          views: 8900,
          likes: 234,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          duration: "22:45",
        },
        {
          id: "3",
          title: "Epic Castle Build Timelapse",
          thumbnail: "https://via.placeholder.com/320x180/f59e0b/ffffff?text=Castle+Build",
          views: 23500,
          likes: 1890,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          duration: "8:12",
        },
      ];

      setUserVideos(mockVideos);
    } catch (error) {
      console.error("Failed to load user videos:", error);
    }
  };

  const handleFollow = async () => {
    if (!profileUser || isOwnProfile) return;

    try {
      const newFollowState = !profileUser.isFollowing;
      setProfileUser(prev => prev ? {
        ...prev,
        isFollowing: newFollowState,
        followers: newFollowState ? prev.followers + 1 : prev.followers - 1,
      } : null);

      toast({
        title: newFollowState ? "Following!" : "Unfollowed",
        description: `You ${newFollowState ? 'are now following' : 'unfollowed'} ${profileUser.username}`,
      });
    } catch (error) {
      console.error("Failed to follow user:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status.",
        variant: "destructive",
      });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                  <User className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                </div>
                <span>Account Information</span>
              </CardTitle>
              <CardDescription>
                Update your account details and credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="minecraft-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="minecraft-input"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Change Password</h4>
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="minecraft-input pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            current: !showPasswords.current,
                          })
                        }
                      >
                        {showPasswords.current ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newPassword: e.target.value,
                            })
                          }
                          className="minecraft-input pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="minecraft-input pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Settings className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                </div>
                <span>Preferences</span>
              </CardTitle>
              <CardDescription>
                Customize your notification and feature preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about important events
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Friend Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to send you friend requests
                    </p>
                  </div>
                  <Switch
                    checked={settings.friendRequests}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, friendRequests: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Chat Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.chatNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, chatNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Ping Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone mentions you with @
                    </p>
                  </div>
                  <Switch
                    checked={settings.pingNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, pingNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Voice Chat</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable voice communication features
                    </p>
                  </div>
                  <Switch
                    checked={settings.voiceChatEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, voiceChatEnabled: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          {user.role === "admin" && (
            <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Shield className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                  </div>
                  <span>Account Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Administrator Account</p>
                    <p className="text-sm text-muted-foreground">
                      You have full administrative privileges
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
