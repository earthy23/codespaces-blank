import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useFriends } from "@/lib/friends";
import { useChat } from "@/lib/chat";

const navigationSections = [
  {
    title: "Main",
    items: [
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13z" fill="currentColor"/>
            <rect x="8" y="15" width="8" height="6" fill="currentColor" opacity="0.7"/>
          </svg>
        ),
        label: "Dashboard",
        path: "/dashboard",
        description: "Your command center",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <rect x="3" y="4" width="18" height="2" rx="1" fill="currentColor"/>
            <rect x="3" y="8" width="18" height="2" rx="1" fill="currentColor"/>
            <rect x="3" y="12" width="18" height="2" rx="1" fill="currentColor"/>
            <circle cx="6" cy="5" r="1" fill="currentColor" opacity="0.8"/>
            <circle cx="6" cy="9" r="1" fill="currentColor" opacity="0.8"/>
            <circle cx="6" cy="13" r="1" fill="currentColor" opacity="0.8"/>
            <rect x="2" y="16" width="20" height="6" rx="2" fill="currentColor" opacity="0.6"/>
          </svg>
        ),
        label: "Servers",
        path: "/servers",
        description: "Browse & join servers",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
            <path d="m2 17 10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="m2 12 10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8"/>
          </svg>
        ),
        label: "Downloads",
        path: "/downloads",
        description: "Get clients & files",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
    ],
  },
  {
    title: "Social",
    items: [
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <circle cx="9" cy="7" r="4" fill="currentColor"/>
            <path d="m3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="16" cy="11" r="3" fill="currentColor" opacity="0.7"/>
            <path d="m22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        ),
        label: "Friends",
        path: "/friends",
        description: "Manage your friends",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
            <circle cx="8" cy="11" r="1" fill="white"/>
            <circle cx="12" cy="11" r="1" fill="white"/>
            <circle cx="16" cy="11" r="1" fill="white"/>
          </svg>
        ),
        label: "Chat",
        path: "/chat",
        description: "Chat with friends",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.6"/>
            <path d="M8 7h8M8 11h8M8 15h6" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="6" cy="8" r="1" fill="currentColor"/>
            <circle cx="6" cy="12" r="1" fill="currentColor"/>
            <circle cx="6" cy="16" r="1" fill="currentColor"/>
          </svg>
        ),
        label: "Forums",
        path: "/forums",
        description: "Community discussions",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.6"/>
            <path d="M7 7h10M7 11h10M7 15h6" stroke="currentColor" strokeWidth="2" fill="none"/>
            <rect x="15" y="14" width="4" height="4" rx="1" fill="currentColor"/>
          </svg>
        ),
        label: "News",
        path: "/news",
        description: "Latest updates",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="currentColor" opacity="0.7"/>
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
            <path d="m16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="14" r="2" fill="currentColor"/>
          </svg>
        ),
        label: "Store",
        path: "/store",
        description: "Premium content",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <circle cx="12" cy="8" r="5" fill="currentColor"/>
            <path d="M20 21a8 8 0 1 0-16 0" fill="currentColor" opacity="0.7"/>
          </svg>
        ),
        label: "Profile",
        path: "/profile",
        description: "Your profile settings",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.6"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="17" r="1" fill="white"/>
          </svg>
        ),
        label: "Support",
        path: "/support",
        description: "Get help & support",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
    ],
  },
];

export function NavigationSidebar() {
  const { user } = useAuth();
  const { onlineFriends } = useFriends();
  const { unreadTotal } = useChat();
  const location = useLocation();

  // If user is not logged in, show limited navigation
  if (!user) {
    return (
      <aside className="w-80 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center py-8">
            <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 mx-auto mb-4 text-sidebar-foreground/30">
              <circle cx="9" cy="7" r="4" fill="currentColor"/>
              <path d="m3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="11" r="3" fill="currentColor" opacity="0.7"/>
              <path d="m22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            <h3 className="font-semibold text-sidebar-foreground mb-2">
              Sign in Required
            </h3>
            <p className="text-sm text-sidebar-foreground/70 mb-4">
              Please sign in to access the full navigation
            </p>
            <Link to="/login">
              <Button className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Navigation Sections */}
        {navigationSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3 px-2">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative block p-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-white/10 backdrop-blur-sm shadow-lg"
                        : "hover:bg-white/5 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 ${isActive ? `shadow-lg ${item.glow}` : `group-hover:${item.glow} group-hover:shadow-primary/20`}`}
                      >
                        <div
                          className={`${item.iconColor} ${isActive ? "drop-shadow-[0_0_4px_currentColor]" : ""}`}
                        >
                          {item.iconSvg}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${isActive ? "text-primary" : "text-sidebar-foreground"} group-hover:text-primary transition-colors`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-sidebar-foreground/70">
                          {item.description}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    {/* Chat notification badge */}
                    {item.path === "/chat" && unreadTotal > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs min-w-[20px] h-5 flex items-center justify-center">
                        {unreadTotal > 99 ? "99+" : unreadTotal}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Online Friends Widget */}
        <div className="border-t border-sidebar-border pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sidebar-foreground flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Online Friends
            </h3>
            <Badge variant="secondary" className="text-xs">
              {onlineFriends.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {onlineFriends.length > 0 ? (
              onlineFriends.slice(0, 4).map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      friend.status === "online"
                        ? "bg-green-500"
                        : friend.status === "playing"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                    } shadow-lg`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {friend.username}
                    </p>
                    <p className="text-xs text-sidebar-foreground/70 truncate">
                      {friend.status === "playing"
                        ? "Playing Eaglercraft"
                        : "Online"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 mx-auto mb-2 text-sidebar-foreground/30">
                  <circle cx="9" cy="7" r="4" fill="currentColor"/>
                  <path d="m3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="16" cy="11" r="3" fill="currentColor" opacity="0.7"/>
                  <path d="m22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <p className="text-xs text-sidebar-foreground/70">
                  No friends online
                </p>
              </div>
            )}
            {onlineFriends.length > 4 && (
              <Link
                to="/friends"
                className="block text-center text-xs text-primary hover:underline pt-2"
              >
                +{onlineFriends.length - 4} more friends
              </Link>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
