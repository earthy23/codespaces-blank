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
import { Avatar } from "@/components/ui/avatar";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/ui/user-layout";

interface Video {
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

interface User {
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

  const [videos, setVideos] = useState<Video[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<User[]>([]);
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

      // Here you would make an API call
      // await fetch(`/api/videos/${videoId}/like`, { method: 'POST' });

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

      // Here you would upload the video
      // const formData = new FormData();
      // formData.append('video', uploadForm.video);
      // formData.append('thumbnail', uploadForm.thumbnail);
      // formData.append('title', uploadForm.title);
      // etc...

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
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Community Hub
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover, share, and connect with amazing content from our
              community
            </p>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                Create Content
              </Button>
            </DialogTrigger>
            <DialogContent className="minecraft-panel max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload a Video</DialogTitle>
                <DialogDescription>
                  Share your creativity with the UEC community!
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
                <div className="flex justify-end space-x-2">
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

        {/* Enhanced Search Section */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Input
              placeholder="Search videos, creators, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 text-lg bg-card/50 border-border/50 focus:border-primary transition-all duration-200 rounded-xl"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                🔍
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-card/50 rounded-xl">
                <TabsTrigger value="trending" className="rounded-lg">
                  🔥 Trending
                </TabsTrigger>
                <TabsTrigger value="recent" className="rounded-lg">
                  🕒 Recent
                </TabsTrigger>
                <TabsTrigger value="following" className="rounded-lg">
                  👥 Following
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trending" className="mt-8">
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Video className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">No videos yet</h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      Be the first to upload content to our community!
                    </p>
                    <Button
                      onClick={() => setShowUploadDialog(true)}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      🎬 Upload First Video
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recent" className="mt-6">
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Video className="w-12 h-12 text-primary" />
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
                      🎬 Upload Video
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="following" className="mt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Videos from creators you follow will appear here.
                  </p>
                  <Button onClick={() => setActiveTab("trending")}>
                    Discover Creators
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="minecraft-panel bg-card/80 backdrop-blur-sm border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  ⭐ Featured Creators
                </CardTitle>
                <CardDescription>
                  Top content creators in our community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No featured creators yet. Upload content to become a featured creator!
                  </p>
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    variant="outline"
                  >
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card className="minecraft-panel bg-card/80 backdrop-blur-sm border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  📊 Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Videos
                    </span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Active Creators
                    </span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Views
                    </span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      This Week
                    </span>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
