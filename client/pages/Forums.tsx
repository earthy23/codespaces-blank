import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Users,
  Clock,
  Pin,
  Plus,
  TrendingUp,
  Search,
  MessageCircle,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/ui/user-layout";

// Forums state will be loaded from API

export default function Forums() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: "",
    content: "",
    category: "general",
  });
  const [forumCategories, setForumCategories] = useState([]);
  const [recentTopics, setRecentTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingTopic, setSubmittingTopic] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      loadForumsData();
    }
  }, [user, navigate]);

  const loadForumsData = async () => {
    try {
      // Load categories
      const categoriesResponse = await fetch("/api/forums/categories");
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setForumCategories(categoriesData.categories);
      }

      // Load recent topics
      const topicsResponse = await fetch("/api/forums/topics?limit=20");
      if (topicsResponse.ok) {
        const topicsData = await topicsResponse.json();
        setRecentTopics(topicsData.topics);
      }
    } catch (error) {
      console.error("Error loading forums data:", error);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setSubmittingTopic(true);
    try {
      const response = await fetch("/api/forums/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(newTopic),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Topic Created",
          description: "Your topic has been posted successfully!",
        });

        setNewTopic({ title: "", content: "", category: "general" });
        setIsNewTopicOpen(false);

        // Reload forums data to show the new topic
        loadForumsData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to create topic",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingTopic(false);
    }
  };

  const filteredTopics = recentTopics.filter((topic) => {
    const matchesSearch = topic.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Community Forums
            </h1>
            <p className="text-muted-foreground">
              Connect with the community, share knowledge, and get support
            </p>
          </div>
          <Button
            onClick={() => setIsNewTopicOpen(true)}
            className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Topic
          </Button>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2 minecraft-border">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="recent">Recent Topics</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-8">
            <div className="grid gap-6">
              {forumCategories.map((category) => (
                <Card
                  key={category.id}
                  className="minecraft-panel bg-card/50 border-2 border-border shadow-lg hover:shadow-primary/10"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                          <MessageSquare className="w-6 h-6 text-primary drop-shadow-[0_0_4px_currentColor]" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {category.name}
                          </CardTitle>
                          <CardDescription>
                            {category.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={category.color}>
                        {category.topic_count} topics
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <span>{category.topic_count} topics</span>
                        <span>{category.post_count} posts</span>
                      </div>
                      <div className="text-right">
                        {category.last_topic_title ? (
                          <>
                            <p className="font-medium">
                              {category.last_topic_title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {category.last_topic_author} •{" "}
                              {new Date(
                                category.last_topic_time,
                              ).toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No topics yet
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-8">
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="minecraft-input pl-10"
                  />
                </div>
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48 minecraft-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {forumCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topics List */}
            <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <TrendingUp className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                  </div>
                  <span>Recent Topics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading topics...</p>
                  </div>
                ) : filteredTopics.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-2">
                            {topic.is_pinned && (
                              <Pin className="w-4 h-4 text-primary" />
                            )}
                            <MessageCircle className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold hover:text-primary cursor-pointer">
                              {topic.title}
                            </h4>
                            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                              <span>by {topic.author_username}</span>
                              <Badge variant="outline" className="text-xs">
                                {topic.category_name ||
                                  forumCategories.find(
                                    (c) => c.id === topic.category_id,
                                  )?.name}
                              </Badge>
                              <span>
                                {new Date(
                                  topic.updated_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="text-center">
                            <p className="font-medium">{topic.reply_count}</p>
                            <p className="text-xs">replies</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{topic.view_count}</p>
                            <p className="text-xs">views</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No topics found</p>
                    <p>Try adjusting your search or create a new topic!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Topic Modal */}
        {isNewTopicOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="minecraft-panel bg-card border-2 border-border shadow-xl w-full max-w-2xl m-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                  </div>
                  <span>Create New Topic</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTopic} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Title
                    </label>
                    <Input
                      value={newTopic.title}
                      onChange={(e) =>
                        setNewTopic({ ...newTopic, title: e.target.value })
                      }
                      placeholder="Enter topic title..."
                      className="minecraft-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Category
                    </label>
                    <Select
                      value={newTopic.category}
                      onValueChange={(value) =>
                        setNewTopic({ ...newTopic, category: value })
                      }
                    >
                      <SelectTrigger className="minecraft-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {forumCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Content
                    </label>
                    <Textarea
                      value={newTopic.content}
                      onChange={(e) =>
                        setNewTopic({ ...newTopic, content: e.target.value })
                      }
                      placeholder="Write your topic content..."
                      className="minecraft-input min-h-32"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewTopicOpen(false)}
                      className="minecraft-border"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submittingTopic}
                      className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
                    >
                      {submittingTopic ? "Creating..." : "Create Topic"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
