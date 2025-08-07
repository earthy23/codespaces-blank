import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useNews } from "@/lib/news";
import { useEffect } from "react";
import { UserLayout } from "@/components/ui/user-layout";

const categoryColors = {
  announcement: "bg-primary/20 text-primary border-primary/50",
  update: "bg-green-500/20 text-green-600 border-green-500/50",
  event: "bg-purple-500/20 text-purple-600 border-purple-500/50",
  maintenance: "bg-orange-500/20 text-orange-600 border-orange-500/50",
};

const categoryLabels = {
  announcement: "Announcement",
  update: "Update",
  event: "Event",
  maintenance: "Maintenance",
};

export default function News() {
  const { user, isAdmin } = useAuth();
  const { publishedPosts } = useNews();
  const navigate = useNavigate();

  // News is accessible to guests, no redirect needed

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <UserLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Latest News</h1>
            <p className="text-muted-foreground">
              Stay updated with announcements, updates, and events
            </p>
          </div>
          {isAdmin() && (
            <Link to="/admin/news">
              <Button className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30">
                <Edit className="w-4 h-4 mr-2" />
                Manage News
              </Button>
            </Link>
          )}
        </div>

        {publishedPosts.length > 0 ? (
          <div className="space-y-6">
            {publishedPosts.map((post) => (
              <Card
                key={post.id}
                className="minecraft-panel bg-card/50 border-2 border-border shadow-lg hover:shadow-primary/10"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          className={
                            categoryColors[post.category] ||
                            categoryColors.announcement
                          }
                        >
                          {categoryLabels[post.category] || "News"}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(post.publishedAt)}
                        </div>
                      </div>
                      <CardTitle className="text-xl mb-2">
                        {post.title}
                      </CardTitle>
                      {post.summary && (
                        <CardDescription className="text-base">
                          {post.summary}
                        </CardDescription>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20 ml-4">
                      <Newspaper className="w-6 h-6 text-primary drop-shadow-[0_0_4px_currentColor]" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="w-4 h-4 mr-1" />
                      By {post.authorName}
                    </div>
                    {post.imageUrl && (
                      <div className="text-xs text-muted-foreground">
                        📷 Featured image
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-4">
              <Newspaper className="w-8 h-8 text-primary drop-shadow-[0_0_4px_currentColor]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No news yet</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for updates and announcements!
            </p>
            {isAdmin() && (
              <Link to="/admin/news">
                <Button className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Post
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
