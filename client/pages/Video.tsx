import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Clock, User } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/ui/user-layout";

interface VideoData {
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

export default function Video() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (slug) {
      loadVideo(slug);
    }
  }, [user, navigate, slug]);

  const loadVideo = async (videoSlug: string) => {
    try {
      setIsLoading(true);

      // Mock video data based on slug
      const videoData: VideoData = {
        id: videoSlug,
        slug: videoSlug,
        title: getVideoTitle(videoSlug),
        description: getVideoDescription(videoSlug),
        thumbnail: getVideoThumbnail(videoSlug),
        videoUrl: "#",
        author: getVideoAuthor(videoSlug),
        authorId: getVideoAuthorId(videoSlug),
        views: getVideoViews(videoSlug),
        createdAt: new Date().toISOString(),
        tags: getVideoTags(videoSlug),
        duration: "12:34",
      };

      setVideo(videoData);
    } catch (error) {
      console.error("Failed to load video:", error);
      navigate("/community");
    } finally {
      setIsLoading(false);
    }
  };

  const getVideoTitle = (slug: string) => {
    const titles: { [key: string]: string } = {
      "epic-castle-build-tutorial": "Epic Castle Build Tutorial",
      "redstone-computer-build": "Redstone Computer Build",
      "modern-house-speed-build": "Modern House Speed Build",
      "pvp-tips-and-tricks": "PvP Tips and Tricks",
      "automatic-farm-tutorial": "Automatic Farm Tutorial",
    };
    return titles[slug] || "Video Not Found";
  };

  const getVideoDescription = (slug: string) => {
    const descriptions: { [key: string]: string } = {
      "epic-castle-build-tutorial":
        "Learn how to build an amazing medieval castle in Minecraft! This tutorial covers everything from foundation to towers.",
      "redstone-computer-build":
        "Building a functional computer inside Minecraft using only redstone! First part of a series.",
      "modern-house-speed-build":
        "Quick modern house build with interior design. Perfect for survival mode!",
      "pvp-tips-and-tricks":
        "Improve your PvP skills with these advanced techniques and strategies.",
      "automatic-farm-tutorial":
        "Build this fully automatic farm that works in 1.8! Great for servers.",
    };
    return descriptions[slug] || "Video description not available.";
  };

  const getVideoThumbnail = (slug: string) => {
    const thumbnails: { [key: string]: string } = {
      "epic-castle-build-tutorial":
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop",
      "redstone-computer-build":
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=450&fit=crop",
      "modern-house-speed-build":
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=450&fit=crop",
      "pvp-tips-and-tricks":
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop",
      "automatic-farm-tutorial":
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=450&fit=crop",
    };
    return (
      thumbnails[slug] ||
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop"
    );
  };

  const getVideoAuthor = (slug: string) => {
    const authors: { [key: string]: string } = {
      "epic-castle-build-tutorial": "BuildMaster",
      "redstone-computer-build": "RedstoneWiz",
      "modern-house-speed-build": "ArchitectPro",
      "pvp-tips-and-tricks": "PvPGod",
      "automatic-farm-tutorial": "FarmExpert",
    };
    return authors[slug] || "Unknown";
  };

  const getVideoAuthorId = (slug: string) => {
    const authorIds: { [key: string]: string } = {
      "epic-castle-build-tutorial": "user1",
      "redstone-computer-build": "user2",
      "modern-house-speed-build": "user3",
      "pvp-tips-and-tricks": "user4",
      "automatic-farm-tutorial": "user5",
    };
    return authorIds[slug] || "unknown";
  };

  const getVideoViews = (slug: string) => {
    const views: { [key: string]: number } = {
      "epic-castle-build-tutorial": 15420,
      "redstone-computer-build": 8540,
      "modern-house-speed-build": 23100,
      "pvp-tips-and-tricks": 12750,
      "automatic-farm-tutorial": 9890,
    };
    return views[slug] || 1000;
  };

  const getVideoTags = (slug: string) => {
    const tags: { [key: string]: string[] } = {
      "epic-castle-build-tutorial": [
        "tutorial",
        "building",
        "castle",
        "medieval",
      ],
      "redstone-computer-build": [
        "redstone",
        "computer",
        "engineering",
        "tutorial",
      ],
      "modern-house-speed-build": ["modern", "house", "speedbuild", "survival"],
      "pvp-tips-and-tricks": ["pvp", "combat", "tips", "strategy"],
      "automatic-farm-tutorial": ["farm", "automatic", "tutorial", "redstone"],
    };
    return tags[slug] || ["minecraft"];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <UserLayout>
        <div className="h-[calc(100vh-120px)] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!video) {
    return (
      <UserLayout>
        <div className="h-[calc(100vh-120px)] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
            <Button onClick={() => navigate("/community")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="h-[calc(100vh-120px)] overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/community")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="minecraft-panel overflow-hidden">
                <div className="relative aspect-video bg-black">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-20 h-20 bg-primary/80 rounded-full flex items-center justify-center text-white text-2xl">
                      ▶
                    </div>
                  </div>
                </div>
              </Card>

              {/* Video Info */}
              <Card className="minecraft-panel">
                <CardContent className="p-6">
                  <h1 className="text-2xl font-bold mb-4">{video.title}</h1>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Link to={`/profile/${video.author}`}>
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                          <span className="text-sm font-bold text-primary">
                            {video.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </Link>
                      <div>
                        <Link
                          to={`/profile/${video.author}`}
                          className="font-medium hover:text-primary transition-colors block"
                        >
                          {video.author}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Content Creator
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{formatNumber(video.views)} views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{video.duration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {video.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="minecraft-panel">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">
                    More from {video.author}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex space-x-3">
                      <img
                        src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=120&h=68&fit=crop"
                        alt="Related video"
                        className="w-20 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          Another Great Build
                        </p>
                        <p className="text-xs text-muted-foreground">
                          5.2K views
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="minecraft-panel">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Related Videos</h3>
                  <div className="space-y-3">
                    <div className="flex space-x-3">
                      <img
                        src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=68&fit=crop"
                        alt="Related video"
                        className="w-20 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          Similar Tutorial
                        </p>
                        <p className="text-xs text-muted-foreground">
                          12K views
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
