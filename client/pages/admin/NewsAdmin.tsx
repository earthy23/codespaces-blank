import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MinecraftBackground } from "@/components/ui/minecraft-background";
import { 
  Shield, 
  ArrowLeft,
  Newspaper,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Calendar
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useNews, NewsPost } from "@/lib/news";
import { useLogging } from "@/lib/logging";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function NewsAdmin() {
  const { user, isAdmin } = useAuth();
  const { posts, addPost, updatePost, deletePost, publishPost, unpublishPost } = useNews();
  const { logAction } = useLogging();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    category: "announcement" as NewsPost['category'],
    published: false,
    imageUrl: ""
  });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/admin");
    }
  }, [user, isAdmin, navigate]);

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      summary: "",
      category: "announcement",
      published: false,
      imageUrl: ""
    });
    setEditingPost(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.summary) {
      toast({
        title: "Validation Error",
        description: "Title, content, and summary are required",
        variant: "destructive",
      });
      return;
    }

    const postData = {
      ...formData,
      author: user?.username || "Admin",
      authorId: user?.id || "admin-1",
    };

    if (editingPost) {
      updatePost(editingPost.id, postData);
      logAction('news_post_updated', 'admin', 'admin', {
        postId: editingPost.id,
        title: formData.title
      });
      toast({
        title: "Post Updated",
        description: "News post has been updated successfully",
      });
    } else {
      addPost(postData);
      logAction('news_post_created', 'admin', 'admin', {
        title: formData.title,
        published: formData.published
      });
      toast({
        title: "Post Created",
        description: "News post has been created successfully",
      });
    }

    resetForm();
  };

  const handleEdit = (post: NewsPost) => {
    setFormData({
      title: post.title,
      content: post.content,
      summary: post.summary,
      category: post.category,
      published: post.published,
      imageUrl: post.imageUrl || ""
    });
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = (post: NewsPost) => {
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
      deletePost(post.id);
      logAction('news_post_deleted', 'admin', 'admin', {
        postId: post.id,
        title: post.title
      });
      toast({
        title: "Post Deleted",
        description: "News post has been deleted",
      });
    }
  };

  const handleTogglePublish = (post: NewsPost) => {
    if (post.published) {
      unpublishPost(post.id);
      logAction('news_post_unpublished', 'admin', 'admin', {
        postId: post.id,
        title: post.title
      });
      toast({
        title: "Post Unpublished",
        description: "News post has been unpublished",
      });
    } else {
      publishPost(post.id);
      logAction('news_post_published', 'admin', 'admin', {
        postId: post.id,
        title: post.title
      });
      toast({
        title: "Post Published",
        description: "News post has been published",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement': return 'bg-blue-500';
      case 'update': return 'bg-green-500';
      case 'event': return 'bg-purple-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <MinecraftBackground>
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary">News Management</h1>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="minecraft-button bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{posts.length}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </CardContent>
            </Card>
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-500">
                  {posts.filter(p => p.published).length}
                </div>
                <div className="text-sm text-muted-foreground">Published</div>
              </CardContent>
            </Card>
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-500">
                  {posts.filter(p => !p.published).length}
                </div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </CardContent>
            </Card>
            <Card className="minecraft-panel">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-500">
                  {posts.filter(p => p.category === 'announcement').length}
                </div>
                <div className="text-sm text-muted-foreground">Announcements</div>
              </CardContent>
            </Card>
          </div>

          {/* Create/Edit Form */}
          {showForm && (
            <Card className="minecraft-panel mb-6">
              <CardHeader>
                <CardTitle>
                  {editingPost ? "Edit News Post" : "Create News Post"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="minecraft-input"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value: NewsPost['category']) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="minecraft-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="summary">Summary *</Label>
                    <Input
                      id="summary"
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Brief summary for the news feed"
                      className="minecraft-input"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Full article content..."
                      className="minecraft-input min-h-48"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="minecraft-input"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.published}
                      onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                    />
                    <Label>Publish immediately</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      type="submit"
                      className="minecraft-button bg-primary text-primary-foreground"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingPost ? "Update Post" : "Create Post"}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="minecraft-border"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Posts List */}
          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle>News Posts ({posts.length})</CardTitle>
              <CardDescription>Manage all news posts and announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {post.summary}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getCategoryColor(post.category)} text-white`}>
                          {post.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{post.author}</TableCell>
                      <TableCell>
                        {post.published ? (
                          <Badge className="bg-green-500 text-white">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {post.published 
                          ? formatDate(post.publishedAt)
                          : formatDate(post.updatedAt)
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(post)}
                            className="minecraft-border"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePublish(post)}
                            className={`minecraft-border ${
                              post.published ? 'text-yellow-600' : 'text-green-600'
                            }`}
                          >
                            {post.published ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(post)}
                            className="minecraft-border text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {posts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No news posts yet</p>
                  <p>Create your first news post to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MinecraftBackground>
  );
}
