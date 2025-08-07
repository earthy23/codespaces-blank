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
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <rect x="3" y="3" width="18" height="6" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="3" y="10" width="18" height="6" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="3" y="17" width="18" height="4" rx="1" fill="currentColor" opacity="0.8"/>
            <circle cx="6" cy="6" r="1" fill="white"/>
            <circle cx="9" cy="6" r="1" fill="white"/>
            <circle cx="6" cy="13" r="1" fill="white"/>
            <circle cx="9" cy="13" r="1" fill="white"/>
            <circle cx="6" cy="19" r="1" fill="white"/>
            <circle cx="9" cy="19" r="1" fill="white"/>
            <rect x="16" y="5" width="3" height="2" rx="0.5" fill="white" opacity="0.7"/>
            <rect x="16" y="12" width="3" height="2" rx="0.5" fill="white" opacity="0.7"/>
            <rect x="16" y="18" width="3" height="2" rx="0.5" fill="white" opacity="0.7"/>
          </svg>
        ),
        label: "Servers",
        path: "/servers",
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
            <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V7L6 11H4a1 1 0 0 0-1 1z" fill="currentColor"/>
            <path d="M13.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M16.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M18.5 3.5a13 13 0 0 1 0 17" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.6"/>
          </svg>
        ),
        label: "News",
        path: "/news",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <text x="12" y="16" textAnchor="middle" fontSize="16" fontWeight="bold" fill="currentColor">$</text>
          </svg>
        ),
        label: "Store",
        path: "/store",
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
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="17" r="1" fill="currentColor"/>
          </svg>
        ),
        label: "Support",
        path: "/support",
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
                      <div className={`${item.iconColor} transition-colors duration-200`}>
                        {item.iconSvg}
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

        {/* Sidebar Toggle Button */}
        <div className="border-t border-sidebar-border p-4">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center hover:bg-white/10"
            onClick={() => {
              // Toggle sidebar functionality can be implemented here
              console.log("Toggle sidebar");
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-sidebar-foreground">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 3v18" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M14 8l-2 2 2 2" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </Button>
        </div>
      </div>
    </aside>
  );
}
