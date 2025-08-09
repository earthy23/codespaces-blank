import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from "@/components/ui/admin-layout";
import { useAuth } from "@/lib/auth";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  tags: string[];
}

export default function NewsAdmin() {
  const { token, user } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(
    null,
  );
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    tags: "",
  });

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      // Generate mock articles data
      const mockArticles: NewsArticle[] = [
        {
          id: "1",
          title: "Server Maintenance Complete",
          content:
            "We have successfully completed the scheduled maintenance on all game servers. All systems are now running optimally with improved performance and stability.",
          summary: "Scheduled maintenance completed, servers running optimally",
          author: "admin",
          status: "published",
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 2,
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 2,
          ).toISOString(),
          publishedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 2,
          ).toISOString(),
          tags: ["maintenance", "servers", "performance"],
        },
        {
          id: "2",
          title: "New VIP Features Released",
          content:
            "We're excited to announce new VIP features including exclusive chat commands, priority server access, and custom profile badges.",
          summary: "New VIP features now available for subscribers",
          author: "admin",
          status: "published",
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 5,
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 5,
          ).toISOString(),
          publishedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 5,
          ).toISOString(),
          tags: ["vip", "features", "announcement"],
        },
        {
          id: "3",
          title: "Community Event Planning",
          content:
            "Draft article about upcoming community events and tournaments.",
          summary: "Planning upcoming community events",
          author: user?.username || "admin",
          status: "draft",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          tags: ["community", "events", "tournaments"],
        },
        // Add more mock articles...
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 4}`,
          title: `Sample Article ${i + 4}`,
          content: `This is the content for sample article ${i + 4}. It contains detailed information about various topics.`,
          summary: `Summary for article ${i + 4}`,
          author: user?.username || "admin",
          status:
            Math.random() > 0.3
              ? "published"
              : Math.random() > 0.5
                ? "draft"
                : ("archived" as const),
          createdAt: new Date(
            Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30,
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30,
          ).toISOString(),
          publishedAt:
            Math.random() > 0.3
              ? new Date(
                  Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30,
                ).toISOString()
              : undefined,
          tags: ["sample", "article"],
        })),
      ].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      setArticles(mockArticles);

      // Calculate stats
      const newStats = {
        total: mockArticles.length,
        published: mockArticles.filter((a) => a.status === "published").length,
        drafts: mockArticles.filter((a) => a.status === "draft").length,
        archived: mockArticles.filter((a) => a.status === "archived").length,
      };
      setStats(newStats);
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const articleData = {
      title: formData.title,
      content: formData.content,
      summary: formData.summary,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      author: user?.username || "admin",
      status: "draft" as const,
    };

    if (editingArticle) {
      // Update existing article
      setArticles((prev) =>
        prev.map((article) =>
          article.id === editingArticle.id
            ? {
                ...article,
                ...articleData,
                updatedAt: new Date().toISOString(),
              }
            : article,
        ),
      );
    } else {
      // Create new article
      const newArticle: NewsArticle = {
        id: Date.now().toString(),
        ...articleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setArticles((prev) => [newArticle, ...prev]);
    }

    // Reset form and close dialog
    setFormData({ title: "", content: "", summary: "", tags: "" });
    setEditingArticle(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      summary: article.summary,
      tags: article.tags.join(", "),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (articleId: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      setArticles((prev) => prev.filter((article) => article.id !== articleId));
    }
  };

  const updateStatus = (
    articleId: string,
    newStatus: "draft" | "published" | "archived",
  ) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === articleId
          ? {
              ...article,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              publishedAt:
                newStatus === "published"
                  ? new Date().toISOString()
                  : article.publishedAt,
            }
          : article,
      ),
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-600 text-white";
      case "draft":
        return "bg-yellow-600 text-white";
      case "archived":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">News Management</h1>
            <p className="text-gray-400">
              Create and manage news articles and announcements
            </p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-white text-black hover:bg-gray-200"
                  onClick={() => {
                    setEditingArticle(null);
                    setFormData({
                      title: "",
                      content: "",
                      summary: "",
                      tags: "",
                    });
                  }}
                >
                  <span className="mr-2">+</span>
                  New Article
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingArticle ? "Edit Article" : "Create New Article"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {editingArticle
                      ? "Update the article details"
                      : "Create a new news article or announcement"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Title
                    </label>
                    <Input
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Article title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Summary
                    </label>
                    <Input
                      required
                      value={formData.summary}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          summary: e.target.value,
                        }))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Brief summary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Content
                    </label>
                    <Textarea
                      required
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      className="bg-gray-800 border-gray-600 text-white min-h-[200px]"
                      placeholder="Article content"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Tags (comma-separated)
                    </label>
                    <Input
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tags: e.target.value,
                        }))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="news, announcement, update"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      {editingArticle ? "Update Article" : "Create Article"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              onClick={loadArticles}
              className="bg-gray-700 text-white hover:bg-gray-600"
              disabled={isLoading}
            >
              <span className={`mr-2 ${isLoading ? "animate-spin" : ""}`}>
                {isLoading ? "↻" : "↻"}
              </span>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.published}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Drafts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.drafts}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Archived
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.archived}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Articles Table */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Articles ({articles.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage news articles and announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Title</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Author</TableHead>
                    <TableHead className="text-gray-300">Updated</TableHead>
                    <TableHead className="text-gray-300">Tags</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id} className="border-gray-700">
                      <TableCell className="text-white">
                        <div>
                          <div className="font-medium">{article.title}</div>
                          <div className="text-sm text-gray-400 truncate max-w-xs">
                            {article.summary}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(article.status)}>
                          {article.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex items-center space-x-1">
                          <span>{article.author}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatDate(article.updatedAt)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              className="bg-gray-700 text-white text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 2 && (
                            <Badge className="bg-gray-700 text-white text-xs">
                              +{article.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(article)}
                            className="text-gray-300 hover:bg-gray-800"
                          >
                            <span>✎</span>
                          </Button>

                          {article.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateStatus(article.id, "published")
                              }
                              className="text-green-400 hover:bg-gray-800"
                            >
                              Publish
                            </Button>
                          )}

                          {article.status === "published" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateStatus(article.id, "archived")
                              }
                              className="text-yellow-400 hover:bg-gray-800"
                            >
                              Archive
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(article.id)}
                            className="text-red-400 hover:bg-gray-800"
                          >
                            <span>🗑</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
