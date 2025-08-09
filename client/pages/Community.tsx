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
import { Video, Upload, Search, Clock, Users, Plus, Eye, User } from "lucide-react";
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
  createdAt: string;
  tags: string[];
  duration: string;
  slug: string;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("videos");
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

      // Placeholder videos for testing with permanent slugs
      const placeholderVideos: VideoItem[] = [
        {
          id: "1",
          slug: "epic-castle-build-tutorial",
          title: "Epic Castle Build Tutorial",
          description: "Learn how to build an amazing medieval castle in Minecraft! This tutorial covers everything from foundation to towers.",
          thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=320&h=180&fit=crop",
          videoUrl: "#",
          author: "BuildMaster",
          authorId: "user1",
          views: 15420,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          tags: ["tutorial", "building", "castle", "medieval"],
          duration: "24:15",
        },
        {
          id: "2",
          slug: "redstone-computer-build",
          title: "Redstone Computer Build",
          description: "Building a functional computer inside Minecraft using only redstone! First part of a series.",
          thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=320&h=180&fit=crop",
          videoUrl: "#",
          author: "RedstoneWiz",
          authorId: "user2",
          views: 8540,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          tags: ["redstone", "computer", "engineering", "tutorial"],
          duration: "18:42",
        },
        {
          id: "3",
          slug: "modern-house-speed-build",
          title: "Modern House Speed Build",
          description: "Quick modern house build with interior design. Perfect for survival mode!",
          thumbnail: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=320&h=180&fit=crop",
          videoUrl: "#",
          author: "ArchitectPro",
          authorId: "user3",
          views: 23100,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          tags: ["modern", "house", "speedbuild", "survival"],
          duration: "12:08",
        },
        {
          id: "4",
          slug: "pvp-tips-and-tricks",
          title: "PvP Tips and Tricks",
          description: "Improve your PvP skills with these advanced techniques and strategies.",
          thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=320&h=180&fit=crop",
          videoUrl: "#",
          author: "PvPGod",
          authorId: "user4",
          views: 12750,
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          tags: ["pvp", "combat", "tips", "strategy"],
          duration: "16:23",
        },
        {
          id: "5",
          slug: "automatic-farm-tutorial",
          title: "Automatic Farm Tutorial",
          description: "Build this fully automatic farm that works in 1.8! Great for servers.",
          thumbnail: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=320&h=180&fit=crop",
          videoUrl: "#",
          author: "FarmExpert",
          authorId: "user5",
          views: 9890,
          createdAt: new Date(Date.now() - 432000000).toISOString(),
          tags: ["farm", "automatic", "tutorial", "redstone"],
          duration: "21:45",
        },
      ];

      setVideos(placeholderVideos);
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
                  Add
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
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="videos" className="flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </TabsTrigger>
                <TabsTrigger value="bio" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Bio</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="videos">
                {filteredVideos.length > 0 ? (
                  <div className="space-y-4">
                    {filteredVideos.map((video) => (
                      <Card
                        key={video.id}
                        className="group minecraft-panel hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/40 cursor-pointer"
                        onClick={() => navigate(`/video/${video.slug}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex space-x-4">
                            {/* Thumbnail */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-48 h-28 object-cover rounded group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded" />
                              <Badge className="absolute bottom-2 right-2 bg-black/80 text-white border-0 backdrop-blur-sm text-xs">
                                {video.duration}
                              </Badge>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {video.title}
                              </h3>
                              
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {video.description}
                              </p>

                              <div className="flex items-center space-x-3 mb-3">
                                <Link 
                                  to={`/profile/${video.author}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                                    <span className="text-sm font-bold text-primary">
                                      {video.author.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </Link>
                                <div>
                                  <Link
                                    to={`/profile/${video.author}`}
                                    className="text-sm font-medium hover:text-primary transition-colors block"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {video.author}
                                  </Link>
                                  <p className="text-xs text-muted-foreground">
                                    Content Creator
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                <div className="flex items-center space-x-4">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {formatNumber(video.views)} views
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatTimeAgo(video.createdAt)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {video.tags.slice(0, 4).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Video className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3">No videos found</h3>
                      <p className="text-muted-foreground mb-6 text-lg">
                        Try adjusting your search or check back later!
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bio">
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Creator Profiles</h3>
                    <p className="text-muted-foreground mb-6">
                      Browse creator profiles and their content.
                    </p>
                    <Button onClick={() => setActiveTab("videos")} variant="outline">
                      View Videos
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
