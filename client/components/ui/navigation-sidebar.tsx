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
        iconSvg: null,
        label: "Dashboard",
        path: "/dashboard",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: null,
        label: "Servers",
        path: "/servers",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: null,
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
        iconSvg: null,
        label: "Friends",
        path: "/friends",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: null,
        label: "Chat",
        path: "/chat",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: null,
        label: "Community",
        path: "/community",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        iconSvg: null,
        label: "News",
        path: "/news",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: null,
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
        iconSvg: null,
        label: "Profile",
        path: "/profile",
        iconColor: "text-primary",
        glow: "shadow-primary/50",
      },
      {
        iconSvg: null,
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
                    <div className="flex items-center space-x-3 ml-px">
                      <div className={`${item.iconColor} transition-colors duration-200`}>
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${isActive ? "text-primary" : "text-sidebar-foreground"} group-hover:text-primary transition-colors`}
                        >
                          {item.label}
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
          </Button>
        </div>
      </div>
    </aside>
  );
}
