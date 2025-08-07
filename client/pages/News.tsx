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
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="m18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
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
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-1">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                          </svg>
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
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary drop-shadow-[0_0_4px_currentColor]">
                        <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V7L6 11H4a1 1 0 0 0-1 1z" fill="currentColor"/>
                        <path d="M13.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <path d="M16.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <path d="M18.5 3.5a13 13 0 0 1 0 17" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.6"/>
                      </svg>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-1">
                        <circle cx="12" cy="8" r="5" fill="currentColor"/>
                        <path d="M20 21a8 8 0 1 0-16 0" fill="currentColor" opacity="0.7"/>
                      </svg>
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
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary drop-shadow-[0_0_4px_currentColor]">
                <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V7L6 11H4a1 1 0 0 0-1 1z" fill="currentColor"/>
                <path d="M13.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M16.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M18.5 3.5a13 13 0 0 1 0 17" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.6"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No news yet</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for updates and announcements!
            </p>
            {isAdmin() && (
              <Link to="/admin/news">
                <Button className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/>
                    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
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
