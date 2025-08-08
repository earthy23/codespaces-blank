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

      // Mock data for demonstration
      const mockVideos: Video[] = [
        {
          id: "1",
          title: "Epic Minecraft Castle Build Tutorial",
          description:
            "Learn how to build an amazing medieval castle in Minecraft! This tutorial covers everything from foundation to decoration.",
          thumbnail:
            "https://via.placeholder.com/320x180/8b5cf6/ffffff?text=Castle+Build",
          videoUrl: "#",
          author: "BuildMaster",
          authorId: "user1",
          views: 15420,
          likes: 892,
          dislikes: 23,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          tags: ["tutorial", "building", "castle", "medieval"],
          duration: "24:15",
          liked: false,
        },
        {
          id: "2",
          title: "Top 10 Minecraft Mods for 2024",
          description:
            "Check out the best Minecraft mods that will enhance your gameplay experience this year!",
          thumbnail:
            "https://via.placeholder.com/320x180/10b981/ffffff?text=Top+Mods",
          videoUrl: "#",
          author: "ModGuru",
          authorId: "user2",
          views: 8540,
          likes: 456,
          dislikes: 12,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          tags: ["mods", "review", "gameplay"],
          duration: "18:42",
          liked: true,
        },
        {
          id: "3",
          title: "Redstone Computer Build - Part 1",
          description:
            "Building a functional computer inside Minecraft using only redstone! This is the first part of a 5-part series.",
          thumbnail:
            "https://via.placeholder.com/320x180/f59e0b/ffffff?text=Redstone+PC",
          videoUrl: "#",
          author: "RedstoneWiz",
          authorId: "user3",
          views: 23100,
          likes: 1340,
          dislikes: 56,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          tags: ["redstone", "computer", "engineering", "tutorial"],
          duration: "32:08",
          liked: false,
        },
      ];

      const mockCreators: User[] = [
        {
          id: "user1",
          username: "BuildMaster",
          followers: 12500,
          following: 89,
          videos: 45,
          isFollowing: false,
        },
        {
          id: "user2",
          username: "ModGuru",
          followers: 8900,
          following: 124,
          videos: 23,
          isFollowing: true,
        },
        {
          id: "user3",
          username: "RedstoneWiz",
          followers: 15600,
          following: 67,
          videos: 67,
          isFollowing: false,
        },
      ];

      setVideos(mockVideos);
      setFeaturedCreators(mockCreators);
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
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Community</h1>
            <p className="text-muted-foreground">
              Discover amazing videos from the UEC community
            </p>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Upload Video
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

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search videos, creators, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>

              <TabsContent value="trending" className="mt-6">
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredVideos.map((video) => (
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
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {video.author.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <Link
                            to={`/profile/${video.authorId}`}
                            className="text-sm font-medium hover:text-primary transition-colors"
                          >
                            {video.author}
                          </Link>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <span>{formatNumber(video.views)} views</span>
                          <span>{formatTimeAgo(video.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant={video.liked ? "default" : "outline"}
                              onClick={() => handleLike(video.id, !video.liked)}
                              className="text-xs"
                            >
                              Like {formatNumber(video.likes)}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              Dislike {formatNumber(video.dislikes)}
                            </Button>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>Watch Later</DropdownMenuItem>
                              <DropdownMenuItem>Share</DropdownMenuItem>
                              <DropdownMenuItem>Report</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {video.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recent" className="mt-6">
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...filteredVideos]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((video) => (
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
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                            {video.title}
                          </h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-semibold">
                                {video.author.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <Link
                              to={`/profile/${video.authorId}`}
                              className="text-sm font-medium hover:text-primary transition-colors"
                            >
                              {video.author}
                            </Link>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span>{formatNumber(video.views)} views</span>
                            <span>{formatTimeAgo(video.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant={video.liked ? "default" : "outline"}
                                onClick={() =>
                                  handleLike(video.id, !video.liked)
                                }
                                className="text-xs"
                              >
                                Like {formatNumber(video.likes)}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                Dislike {formatNumber(video.dislikes)}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Featured Creators</CardTitle>
                <CardDescription>
                  Popular content creators in the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featuredCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-semibold">
                            {creator.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <Link
                            to={`/profile/${creator.id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {creator.username}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(creator.followers)} followers
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={creator.isFollowing ? "outline" : "default"}
                        onClick={() =>
                          handleFollow(creator.id, !creator.isFollowing)
                        }
                      >
                        {creator.isFollowing ? "Following" : "Follow"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
