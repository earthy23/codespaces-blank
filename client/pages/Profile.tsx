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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Save,
  Mail,
  Shield,
  Settings,
  Eye,
  EyeOff,
  Users,
  Video,
  Heart,
  Calendar,
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("videos");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    banner: "",
    avatar: "",
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

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);

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
          thumbnail:
            "https://via.placeholder.com/320x180/8b5cf6/ffffff?text=Modern+House",
          views: 12400,
          likes: 456,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          duration: "15:32",
        },
        {
          id: "2",
          title: "Redstone Tutorial: Automatic Farm",
          thumbnail:
            "https://via.placeholder.com/320x180/10b981/ffffff?text=Auto+Farm",
          views: 8900,
          likes: 234,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          duration: "22:45",
        },
        {
          id: "3",
          title: "Epic Castle Build Timelapse",
          thumbnail:
            "https://via.placeholder.com/320x180/f59e0b/ffffff?text=Castle+Build",
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
      setProfileUser((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: newFollowState,
              followers: newFollowState
                ? prev.followers + 1
                : prev.followers - 1,
            }
          : null,
      );

      toast({
        title: newFollowState ? "Following!" : "Unfollowed",
        description: `You ${newFollowState ? "are now following" : "unfollowed"} ${profileUser.username}`,
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingBanner(true);
      // In a real app, you'd upload to a server here
      const fakeUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, banner: fakeUrl }));
      setShowBannerDialog(false);

      toast({
        title: "Banner Updated",
        description: "Your profile banner has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload banner image",
        variant: "destructive",
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      // In a real app, you'd upload to a server here
      const fakeUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar: fakeUrl }));
      setShowAvatarDialog(false);

      toast({
        title: "Avatar Updated",
        description: "Your profile avatar has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar image",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
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

  if (!profileUser) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="minecraft-panel overflow-hidden bg-card/80 backdrop-blur-sm border-border/40">
            {/* Profile Banner */}
            <div className="relative h-64 lg:h-80 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 overflow-hidden">
              {formData.banner && (
                <img
                  src={formData.banner}
                  alt="Profile Banner"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {isOwnProfile && (
                <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm border-white/20 hover:bg-black/30"
                    >
                      ✏️ Edit Banner
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Profile Banner</DialogTitle>
                      <DialogDescription>
                        Upload a new banner image for your profile
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={uploadingBanner}
                      />
                      <p className="text-sm text-muted-foreground">
                        Recommended size: 1200x300px. Max file size: 5MB
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <CardContent className="p-6 -mt-12 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Profile Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-background overflow-hidden">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt={profileUser.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl font-bold text-primary">
                            {profileUser.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {isOwnProfile && (
                      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                          >
                            ✏️
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Profile Picture</DialogTitle>
                            <DialogDescription>
                              Upload a new profile picture
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              disabled={uploadingAvatar}
                            />
                            <p className="text-sm text-muted-foreground">
                              Recommended size: 400x400px. Max file size: 2MB
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-3xl font-bold">
                        {profileUser.username}
                      </h1>
                      {profileUser.role === "admin" && (
                        <Badge variant="default" className="bg-yellow-500">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    {profileUser.bio && (
                      <p className="text-muted-foreground max-w-md">
                        {profileUser.bio}
                      </p>
                    )}
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {formatDate(profileUser.joinedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  {!isOwnProfile ? (
                    <Button
                      onClick={handleFollow}
                      variant={profileUser.isFollowing ? "outline" : "default"}
                      className="min-w-[100px]"
                    >
                      {profileUser.isFollowing ? "Following" : "Follow"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setActiveTab("settings")}
                      variant="outline"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatNumber(profileUser.followers)}
                  </div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatNumber(profileUser.following)}
                  </div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatNumber(profileUser.totalVideos)}
                  </div>
                  <div className="text-sm text-muted-foreground">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatNumber(profileUser.totalViews)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Views
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatNumber(profileUser.totalLikes)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Likes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="videos">
              <Video className="w-4 h-4 mr-2" />
              Videos ({userVideos.length})
            </TabsTrigger>
            <TabsTrigger value="about">
              <User className="w-4 h-4 mr-2" />
              About
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-6">
            {userVideos.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {userVideos.map((video) => (
                  <Card
                    key={video.id}
                    className="minecraft-panel hover:shadow-lg transition-shadow"
                  >
                    <div className="relative">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-40 object-cover rounded-t-lg"
                      />
                      <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                        {video.duration}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatNumber(video.views)} views</span>
                        <span>{formatTimeAgo(video.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1 text-xs">
                          <Heart className="w-3 h-3" />
                          <span>{formatNumber(video.likes)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
                <p className="text-muted-foreground mb-4">
                  {isOwnProfile
                    ? "Upload your first video to get started!"
                    : `${profileUser.username} hasn't uploaded any videos yet.`}
                </p>
                {isOwnProfile && (
                  <Button onClick={() => navigate("/community")}>
                    Upload Video
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>About {profileUser.username}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileUser.bio ? (
                  <div>
                    <h4 className="font-semibold mb-2">Bio</h4>
                    <p className="text-muted-foreground">{profileUser.bio}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    No bio available.
                  </p>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="ml-2">
                        {formatDate(profileUser.joinedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Views:
                      </span>
                      <span className="ml-2">
                        {formatNumber(profileUser.totalViews)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Likes:
                      </span>
                      <span className="ml-2">
                        {formatNumber(profileUser.totalLikes)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Videos:</span>
                      <span className="ml-2">{profileUser.totalVideos}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab (Own Profile Only) */}
          {isOwnProfile && (
            <TabsContent value="settings" className="mt-6">
              <div className="grid gap-6">
                {/* Profile Information */}
                <Card className="minecraft-panel">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and account details
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
                              setFormData({
                                ...formData,
                                username: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) =>
                            setFormData({ ...formData, bio: e.target.value })
                          }
                          placeholder="Tell others about yourself..."
                          rows={3}
                        />
                      </div>
                      <Button type="submit">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Password & Security */}
                <Card className="minecraft-panel">
                  <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                    <CardDescription>
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                              setFormData({ ...formData, currentPassword: e.target.value })
                            }
                            className="pr-10"
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
                                setFormData({ ...formData, newPassword: e.target.value })
                              }
                              className="pr-10"
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
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={formData.confirmPassword}
                              onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                              }
                              className="pr-10"
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
                      <Button variant="outline">
                        Update Password
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold">Email Settings</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Verification</p>
                          <p className="text-sm text-muted-foreground">
                            {user.emailVerified ? 'Your email is verified' : 'Your email is not verified'}
                          </p>
                        </div>
                        {!user.emailVerified && (
                          <Button variant="outline" size="sm">
                            Send Verification
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold">Two-Factor Authentication</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">2FA Status</p>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable 2FA
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Settings */}
                <Card className="minecraft-panel">
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                      Customize your experience and notification settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                          setSettings({
                            ...settings,
                            emailNotifications: checked,
                          })
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
                          setSettings({
                            ...settings,
                            chatNotifications: checked,
                          })
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
                          setSettings({
                            ...settings,
                            pingNotifications: checked,
                          })
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
                          setSettings({
                            ...settings,
                            voiceChatEnabled: checked,
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </UserLayout>
  );
}
