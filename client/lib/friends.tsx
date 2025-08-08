import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./auth";
import { useWebSocket, useWebSocketEvent } from "./websocket-manager";
import { cacheManager, CACHE_KEYS } from "./cache-manager";

export interface Friend {
  id: string;
  username: string;
  status: "online" | "offline" | "playing";
  lastSeen: string;
  addedAt: string;
  playingServer?: string;
  avatar?: string;
}

export interface FriendRequest {
  id: string;
  from: string;
  fromUsername?: string;
  to: string;
  toUsername?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

interface FriendsContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  onlineFriends: Friend[];
  isLoading: boolean;
  sendFriendRequest: (username: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  updateFriendStatus: (
    status: Friend["status"],
    playingServer?: string,
  ) => Promise<void>;
  searchUsers: (query: string) => Promise<any[]>;
  refreshFriends: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  const { isConnected, getOnlineUsers } = useWebSocket();

  const [friends, setFriends] = useState<Friend[]>(() =>
    user ? cacheManager.get(CACHE_KEYS.USER_FRIENDS(user.id)) || [] : [],
  );
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // FullStory detection utility
  const isFullStoryBlocking = () => {
    try {
      return window.fetch !== fetch ||
             (window.fetch.toString().includes('fullstory') ||
              document.querySelector('script[src*="fullstory"]') !== null);
    } catch {
      return false;
    }
  };

  // XMLHttpRequest fallback for fetch
  const makeRequest = async (url: string, options: any = {}) => {
    if (isFullStoryBlocking()) {
      return new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method || 'GET', url);

        if (options.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value as string);
          });
        }

        xhr.onload = () => {
          const response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            text: () => Promise.resolve(xhr.responseText)
          } as Response;
          resolve(response);
        };

        xhr.onerror = () => reject(new Error('XMLHttpRequest failed'));
        xhr.ontimeout = () => reject(new Error('XMLHttpRequest timeout'));

        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new Error('Request aborted'));
          });
        }

        xhr.send(options.body || null);
      });
    }
    return fetch(url, options);
  };

  // Load all friends data from API
  const loadFriendsData = useCallback(async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      try {
        const [friendsRes, requestsRes, sentRes] = await Promise.allSettled([
          makeRequest("/api/friends", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }),
          makeRequest("/api/friends/requests", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }),
          makeRequest("/api/friends/requests/sent", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }),
        ]);

        clearTimeout(timeoutId);

        // Handle friends response
        if (friendsRes.status === 'fulfilled' && friendsRes.value.ok) {
          try {
            const responseText = await friendsRes.value.text();
            if (responseText.trim()) {
              const friendsData = JSON.parse(responseText);
              setFriends(friendsData.friends || []);

              // Filter online friends
              const online = (friendsData.friends || []).filter(
                (f: Friend) => f.status === "online" || f.status === "playing",
              );
              setOnlineFriends(online);
            } else {
              console.warn("Friends API returned empty response, keeping existing data");
              setFriends([]);
              setOnlineFriends([]);
            }
          } catch (parseError) {
            console.warn("Failed to parse friends response:", parseError);
            setFriends([]);
            setOnlineFriends([]);
          }
        } else {
          console.warn("Failed to load friends, keeping existing data");
        }

        // Handle friend requests response
        if (requestsRes.status === 'fulfilled' && requestsRes.value.ok) {
          try {
            const responseText = await requestsRes.value.text();
            if (responseText.trim()) {
              const requestsData = JSON.parse(responseText);
              setFriendRequests(requestsData.requests || []);
            } else {
              console.warn("Friend requests API returned empty response, keeping existing data");
              setFriendRequests([]);
            }
          } catch (parseError) {
            console.warn("Failed to parse friend requests response:", parseError);
            setFriendRequests([]);
          }
        } else {
          console.warn("Failed to load friend requests, keeping existing data");
        }

        // Handle sent requests response
        if (sentRes.status === 'fulfilled' && sentRes.value.ok) {
          const sentData = await sentRes.value.json();
          setSentRequests(sentData.requests || []);
        } else {
          console.warn("Failed to load sent requests, keeping existing data");
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn("Friends data loading timed out, keeping existing data");
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn("Network issue loading friends data, keeping existing data");
      } else {
        console.error("Error loading friends data:", error);
      }
      // Don't clear existing data on error
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  // Initialize data when user logs in
  useEffect(() => {
    if (user && token) {
      loadFriendsData();

      // Set user as online when they log in
      updateFriendStatus("online");
    } else {
      // Clear data when user logs out
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
      setOnlineFriends([]);
      setIsLoading(false);
    }
  }, [user, token, loadFriendsData]);

  // Refresh friends data periodically to get status updates
  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(() => {
      loadFriendsData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, token, loadFriendsData]);

  // Subscribe to WebSocket friend events for real-time updates
  useWebSocketEvent("friends:status_updated", useCallback((data) => {
    if (!user) return;

    setFriends((prev) =>
      prev.map((friend) =>
        friend.id === data.userId
          ? {
              ...friend,
              status: data.status,
              lastSeen: new Date().toISOString(),
            }
          : friend,
      ),
    );

    // Update online friends list - simplified logic
    setOnlineFriends((prev) => {
      const filtered = prev.filter((f) => f.id !== data.userId);
      if (data.status === "online" || data.status === "playing") {
        // Get updated friend from the state we just set
        const updatedFriend = friends.find((f) => f.id === data.userId);
        if (updatedFriend) {
          return [...filtered, { ...updatedFriend, status: data.status }];
        }
      }
      return filtered;
    });
  }, [user]));

  useWebSocketEvent("friends:request_received", useCallback((data) => {
    if (!user || data.to !== user.id) return;

    setFriendRequests((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        from: data.from,
        fromUsername: data.username,
        to: user.id,
        toUsername: user.username,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [user]));

  useWebSocketEvent("friends:request_accepted", useCallback((data) => {
    if (!user) return;

    // Remove from sent requests and add to friends
    setSentRequests((prev) => prev.filter((req) => req.to !== data.userId));

    // Refresh friends list to get the new friend
    loadFriendsData();
  }, [user, loadFriendsData]));

  // Update friend statuses based on WebSocket online users
  useEffect(() => {
    if (!isConnected || !user) return;

    const onlineUserIds = getOnlineUsers();

    setFriends((prev) => {
      const updated = prev.map((friend) => ({
        ...friend,
        status: onlineUserIds.includes(friend.id) ? "online" : "offline",
        lastSeen: onlineUserIds.includes(friend.id)
          ? new Date().toISOString()
          : friend.lastSeen,
      }));

      // Update online friends based on the updated friends list
      setOnlineFriends(
        updated
          .filter((friend) => onlineUserIds.includes(friend.id))
          .map((friend) => ({ ...friend, status: "online" as const }))
      );

      return updated;
    });
  }, [isConnected, getOnlineUsers, user]);

  const sendFriendRequest = async (username: string): Promise<boolean> => {
    if (!user || !token) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await makeRequest("/api/friends/request", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // Refresh sent requests
          try {
            const sentRes = await makeRequest("/api/friends/requests/sent", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (sentRes.ok) {
              const sentData = await sentRes.json();
              setSentRequests(sentData.requests || []);
            }
          } catch (refreshError) {
            console.warn("Failed to refresh sent requests after sending friend request");
          }

          return true;
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("Friend request error:", errorData.error);
          return false;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn("Friend request timed out");
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn("Network issue sending friend request");
      } else {
        console.error("Error sending friend request:", error);
      }
      return false;
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    if (!user || !token) return;

    try {
      const response = await makeRequest(`/api/friends/request/${requestId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Refresh all friends data
        await loadFriendsData();
      } else {
        throw new Error("Failed to accept friend request");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    if (!user || !token) return;

    try {
      const response = await makeRequest(
        `/api/friends/request/${requestId}/decline`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Remove from local state
        setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        throw new Error("Failed to decline friend request");
      }
    } catch (error) {
      console.error("Error declining friend request:", error);
      throw error;
    }
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    if (!user || !token) return;

    try {
      const response = await makeRequest(`/api/friends/${friendId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Remove from local state
        setFriends((prev) => prev.filter((f) => f.id !== friendId));
        setOnlineFriends((prev) => prev.filter((f) => f.id !== friendId));
      } else {
        throw new Error("Failed to remove friend");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  };

  const updateFriendStatus = async (
    status: Friend["status"],
    playingServer?: string,
  ): Promise<void> => {
    if (!user || !token) return;

    try {
      const response = await makeRequest("/api/friends/status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, playingServer }),
      });

      if (!response.ok) {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const searchUsers = async (query: string): Promise<any[]> => {
    if (!user || !token || query.length < 2) return [];

    try {
      const response = await makeRequest(
        `/api/friends/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data.users || [];
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
    return [];
  };

  const refreshFriends = async (): Promise<void> => {
    await loadFriendsData();
  };

  // Set user status to offline when page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && token) {
        // Use navigator.sendBeacon for reliable offline status update
        const data = JSON.stringify({ status: "offline" });
        const blob = new Blob([data], { type: "application/json" });
        navigator.sendBeacon("/api/friends/status", blob);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also try to set offline status when component unmounts
      if (user && token) {
        updateFriendStatus("offline");
      }
    };
  }, [user, token]);

  return (
    <FriendsContext.Provider
      value={{
        friends,
        friendRequests,
        sentRequests,
        onlineFriends,
        isLoading,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        updateFriendStatus,
        searchUsers,
        refreshFriends,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error("useFriends must be used within a FriendsProvider");
  }
  return context;
};
