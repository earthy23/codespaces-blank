import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useFriends } from "@/lib/friends";
import { useChat } from "@/lib/chat";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/ui/user-layout";

export default function Friends() {
  const { user } = useAuth();
  const {
    friends,
    friendRequests,
    sentRequests,
    onlineFriends,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    searchUsers,
  } = useFriends();
  const { createDirectMessage } = useChat();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [addFriendUsername, setAddFriendUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Handle user search
  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsersDebounced, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendUsername.trim()) return;

    try {
      const success = await sendFriendRequest(addFriendUsername.trim());
      if (success) {
        toast({
          title: "Friend Request Sent",
          description: `Friend request sent to ${addFriendUsername}`,
        });
        setAddFriendUsername("");
      } else {
        toast({
          title: "Failed to Send Request",
          description: "User not found or request already exists",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string, username: string) => {
    try {
      await acceptFriendRequest(requestId);
      toast({
        title: "Friend Request Accepted",
        description: `You are now friends with ${username}!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string, username: string) => {
    try {
      await declineFriendRequest(requestId);
      toast({
        title: "Friend Request Declined",
        description: `Request from ${username} has been declined`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async (friendId: string, username: string) => {
    if (confirm(`Remove ${username} from your friends list?`)) {
      try {
        await removeFriend(friendId);
        toast({
          title: "Friend Removed",
          description: `${username} has been removed from your friends list`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove friend",
          variant: "destructive",
        });
      }
    }
  };

  const handleStartChat = async (username: string) => {
    try {
      const chatId = await createDirectMessage(username);
      if (chatId) {
        navigate(`/chat/${chatId}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to create chat",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "playing":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "playing":
        return "Playing";
      default:
        return "Offline";
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Friends</h1>
            <p className="text-muted-foreground">
              Manage your friends and connect with other players
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">
                {onlineFriends.length} Online
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <img src="https://images.pexels.com/photos/9069288/pexels-photo-9069288.jpeg" alt="Friends" className="w-5 h-5 rounded object-cover" />
              <span className="text-sm font-medium">
                {friends.length} Friends
              </span>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="friends"
              className="flex items-center space-x-2"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <circle cx="9" cy="7" r="4" fill="currentColor"/>
                <path d="m3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="11" r="3" fill="currentColor" opacity="0.7"/>
              </svg>
              <span>Friends ({friends.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="flex items-center space-x-2"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span>Requests ({friendRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center space-x-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2"/>
                <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Sent ({sentRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center space-x-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Add Friends</span>
            </TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends" className="space-y-4">
            {friends.length > 0 ? (
              <div className="grid gap-4">
                {friends.map((friend) => (
                  <Card
                    key={friend.id}
                    className="minecraft-panel bg-card/50 border-2 border-border shadow-lg hover:shadow-primary/10"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-muted-foreground">
                                <circle cx="9" cy="7" r="4" fill="currentColor"/>
                                <path d="m3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                                <circle cx="16" cy="11" r="3" fill="currentColor" opacity="0.7"/>
                              </svg>
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(friend.status)}`}
                            ></div>
                          </div>
                          <div>
                            <h3 className="font-semibold">{friend.username}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  friend.status === "online"
                                    ? "default"
                                    : friend.status === "playing"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {friend.status === "playing" && (
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 mr-1">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="currentColor"/>
                                    <circle cx="8" cy="12" r="1" fill="white"/>
                                    <circle cx="16" cy="12" r="1" fill="white"/>
                                  </svg>
                                )}
                                {getStatusText(friend.status)}
                              </Badge>
                              {friend.status === "playing" &&
                                friend.playingServer && (
                                  <span className="text-xs text-muted-foreground">
                                    on {friend.playingServer}
                                  </span>
                                )}
                              {friend.status === "offline" && (
                                <span className="text-xs text-muted-foreground">
                                  Last seen {formatLastSeen(friend.lastSeen)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleStartChat(friend.username)}
                            className="minecraft-button bg-primary/20 text-primary hover:bg-primary/30"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
                              <circle cx="8" cy="11" r="1" fill="white"/>
                              <circle cx="12" cy="11" r="1" fill="white"/>
                              <circle cx="16" cy="11" r="1" fill="white"/>
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRemoveFriend(friend.id, friend.username)
                            }
                            className="minecraft-button border-red-500/50 text-red-500 hover:bg-red-500/20"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                              <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardContent className="p-8 text-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 mx-auto mb-4 opacity-50">
                    <circle cx="9" cy="7" r="4" fill="currentColor"/>
                    <path d="m3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="16" cy="11" r="3" fill="currentColor" opacity="0.7"/>
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">No Friends Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your network by adding friends!
                  </p>
                  <Button
                    onClick={() => setActiveTab("add")}
                    className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2"/>
                      <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Add Friends
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Friend Requests */}
          <TabsContent value="requests" className="space-y-4">
            {friendRequests.length > 0 ? (
              <div className="grid gap-4">
                {friendRequests.map((request) => (
                  <Card
                    key={request.id}
                    className="minecraft-panel bg-card/50 border-2 border-border shadow-lg"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-muted-foreground">
                              <circle cx="9" cy="7" r="4" fill="currentColor"/>
                              <path d="m3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                              <circle cx="16" cy="11" r="3" fill="currentColor" opacity="0.7"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {request.fromUsername}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Sent {formatLastSeen(request.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAcceptRequest(
                                request.id,
                                request.fromUsername || "Unknown",
                              )
                            }
                            className="minecraft-button bg-green-500/20 text-green-500 hover:bg-green-500/30"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                              <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" fill="none"/>
                            </svg>
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDeclineRequest(
                                request.id,
                                request.fromUsername || "Unknown",
                              )
                            }
                            className="minecraft-button border-red-500/50 text-red-500 hover:bg-red-500/20"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-2">
                              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardContent className="p-8 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">
                    No Pending Requests
                  </h3>
                  <p className="text-muted-foreground">
                    You don't have any incoming friend requests
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sent Requests */}
          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length > 0 ? (
              <div className="grid gap-4">
                {sentRequests.map((request) => (
                  <Card
                    key={request.id}
                    className="minecraft-panel bg-card/50 border-2 border-border shadow-lg"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center">
                            <Users className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {request.toUsername}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Sent {formatLastSeen(request.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="flex items-center space-x-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardContent className="p-8 text-center">
                  <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">
                    No Sent Requests
                  </h3>
                  <p className="text-muted-foreground">
                    You haven't sent any friend requests yet
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Add Friends */}
          <TabsContent value="add" className="space-y-6">
            {/* Direct Username Add */}
            <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <UserPlus className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                  </div>
                  <span>Add Friend by Username</span>
                </CardTitle>
                <CardDescription>
                  Send a friend request by entering their exact username
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddFriend} className="flex gap-4">
                  <Input
                    value={addFriendUsername}
                    onChange={(e) => setAddFriendUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="minecraft-input"
                  />
                  <Button
                    type="submit"
                    disabled={!addFriendUsername.trim()}
                    className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Search Users */}
            <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Search className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                  </div>
                  <span>Search Users</span>
                </CardTitle>
                <CardDescription>
                  Search for users to add as friends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search usernames..."
                    className="minecraft-input pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{user.username}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => sendFriendRequest(user.username)}
                          className="minecraft-button bg-primary/20 text-primary hover:bg-primary/30"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 &&
                  !isSearching &&
                  searchResults.length === 0 && (
                    <Alert>
                      <Search className="h-4 w-4" />
                      <AlertDescription>
                        No users found matching "{searchQuery}"
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}
