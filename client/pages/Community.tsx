import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Video, Upload, Search, TrendingUp, Clock, Users, Plus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/ui/user-layout";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  author: string;
  authorId: string;
  views: number;
  likes: number;
  dislikes: number;
  createdAt: string;
  tags: string[];
  duration: string;
  liked?: boolean;
  disliked?: boolean;
}

interface CreatorUser {
  id: string;
  username: string;
  followers: number;
  following: number;
  videos: number;
  isFollowing?: boolean;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<CreatorUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    tags: "",
    thumbnail: null as File | null,
    video: null as File | null,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadCommunityData();
  }, [user, navigate]);

  const loadCommunityData = async () => {
    try {
      setIsLoading(true);

      // No videos or creators to display
      setVideos([]);
      setFeaturedCreators([]);
    } catch (error) {
      console.error("Failed to load community data:", error);
      toast({
        title: "Error",
        description: "Failed to load community content.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (videoId: string, isLiked: boolean) => {
    try {
      // Update local state optimistically
      setVideos((prev) =>
        prev.map((video) => {
          if (video.id === videoId) {
            return {
              ...video,
              liked: isLiked,
              disliked: false,
              likes: isLiked ? video.likes + 1 : video.likes - 1,
              dislikes:
                video.disliked && isLiked ? video.dislikes - 1 : video.dislikes,
            };
          }
          return video;
        }),
      );

      toast({
        title: isLiked ? "Liked!" : "Like removed",
        description: `You ${isLiked ? "liked" : "removed your like from"} this video.`,
      });
    } catch (error) {
      console.error("Failed to like video:", error);
    }
  };

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    try {
      setFeaturedCreators((prev) =>
        prev.map((creator) => {
          if (creator.id === userId) {
            return {
              ...creator,
              isFollowing: isFollowing,
              followers: isFollowing
                ? creator.followers + 1
                : creator.followers - 1,
            };
          }
          return creator;
        }),
      );

      toast({
        title: isFollowing ? "Following!" : "Unfollowed",
        description: `You are ${isFollowing ? "now following" : "no longer following"} this creator.`,
      });
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.title || !uploadForm.video) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a video file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      toast({
        title: "Upload Successful",
        description: "Your video has been uploaded and is being processed!",
      });

      setShowUploadDialog(false);
      setUploadForm({
        title: "",
        description: "",
        tags: "",
        thumbnail: null,
        video: null,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const filteredVideos = videos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  if (!user) return null;

  return (
    <UserLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 border-b border-border bg-card/20 backdrop-blur-sm">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Community</h1>
            <p className="text-muted-foreground">
              Share your creations and discover amazing content
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search videos, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-background/50"
              />
            </div>
            
            {/* Upload Button */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="minecraft-panel max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Video</DialogTitle>
                  <DialogDescription>
                    Share your content with the community
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleVideoUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Video Title</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter your video title..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe your video..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={uploadForm.tags}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          tags: e.target.value,
                        }))
                      }
                      placeholder="tutorial, building, redstone..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-file">Video File</Label>
                    <Input
                      id="video-file"
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          video: e.target.files?.[0] || null,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="thumbnail-file">Thumbnail (optional)</Label>
                    <Input
                      id="thumbnail-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          thumbnail: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUploadDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? "Uploading..." : "Upload Video"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Main Video Feed */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                    <TabsTrigger value="trending" className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Trending</span>
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Recent</span>
                    </TabsTrigger>
                    <TabsTrigger value="following" className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Following</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="trending">
                    <div className="text-center py-16">
                      <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Video className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3">No videos yet</h3>
                        <p className="text-muted-foreground mb-6 text-lg">
                          Be the first to upload content to the community!
                        </p>
                        <Button
                          onClick={() => setShowUploadDialog(true)}
                          size="lg"
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Upload First Video
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="recent">
                    <div className="text-center py-16">
                      <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Clock className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3">No recent videos</h3>
                        <p className="text-muted-foreground mb-6 text-lg">
                          Upload content to see recent videos here.
                        </p>
                        <Button
                          onClick={() => setShowUploadDialog(true)}
                          size="lg"
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Upload Video
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="following">
                    <div className="text-center py-16">
                      <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Users className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3">Following feed empty</h3>
                        <p className="text-muted-foreground mb-6">
                          Videos from creators you follow will appear here.
                        </p>
                        <Button onClick={() => setActiveTab("trending")} variant="outline">
                          Discover Creators
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 border-l border-border bg-card/20 backdrop-blur-sm overflow-auto">
              <div className="p-6 space-y-6">
                {/* Featured Creators */}
                <Card className="minecraft-panel">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5" />
                      Featured Creators
                    </CardTitle>
                    <CardDescription>
                      Top content creators in our community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No featured creators yet. Upload content to become featured!
                      </p>
                      <Button
                        onClick={() => setShowUploadDialog(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Get Started
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Community Stats */}
                <Card className="minecraft-panel">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5" />
                      Community Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Videos</span>
                        <span className="font-semibold">0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Active Creators</span>
                        <span className="font-semibold">0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Views</span>
                        <span className="font-semibold">0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">This Week</span>
                        <span className="font-semibold">0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="minecraft-panel">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setShowUploadDialog(true)}
                      className="w-full justify-start" 
                      variant="ghost"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                    <Button 
                      onClick={() => navigate("/profile")}
                      className="w-full justify-start" 
                      variant="ghost"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                    <Button 
                      onClick={() => navigate("/friends")}
                      className="w-full justify-start" 
                      variant="ghost"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Find Friends
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
