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

  const handleAcceptRequest = async (requestId: string, requesterUsername: string) => {
    try {
      const success = await acceptFriendRequest(requestId);
      if (success) {
        toast({
          title: "Friend Added",
          description: `You are now friends with ${requesterUsername}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const success = await declineFriendRequest(requestId);
      if (success) {
        toast({
          title: "Request Declined",
          description: "Friend request declined",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendUsername: string) => {
    try {
      const success = await removeFriend(friendshipId);
      if (success) {
        toast({
          title: "Friend Removed",
          description: `Removed ${friendUsername} from your friends list`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  const handleStartChat = async (friendId: string, friendUsername: string) => {
    try {
      const chatId = await createDirectMessage(friendId);
      if (chatId) {
        navigate(`/chat/${chatId}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  const handleAddFriendFromSearch = async (username: string) => {
    try {
      const success = await sendFriendRequest(username);
      if (success) {
        toast({
          title: "Friend Request Sent",
          description: `Friend request sent to ${username}`,
        });
        setSearchQuery("");
        setSearchResults([]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "playing":
        return "bg-yellow-500";
      case "away":
        return "bg-orange-500";
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
      case "away":
        return "Away";
      default:
        return "Offline";
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diff = now.getTime() - lastSeenDate.getTime();

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
              <div className="w-3 h-3 bg-primary rounded-full"></div>
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
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({friendRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="add">
              Add Friends
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
                              <span className="font-semibold text-lg">{friend.username.charAt(0).toUpperCase()}</span>
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
                                {getStatusText(friend.status)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {friend.status === "offline"
                                  ? `Last seen ${formatLastSeen(friend.lastSeen)}`
                                  : "Active now"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleStartChat(friend.id, friend.username)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Message
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFriend(friend.friendshipId, friend.username)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="minecraft-panel">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 opacity-50 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your friend network by adding some friends!
                  </p>
                  <Button
                    onClick={() => setActiveTab("add")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
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
                            <span className="font-semibold text-lg">{request.requesterUsername.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.requesterUsername}</h3>
                            <p className="text-sm text-muted-foreground">
                              Sent {formatLastSeen(request.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id, request.requesterUsername)}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineRequest(request.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="minecraft-panel">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 opacity-50 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📨</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No friend requests</h3>
                  <p className="text-muted-foreground">
                    You don't have any pending friend requests.
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
                            <span className="font-semibold text-lg">{request.recipientUsername.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.recipientUsername}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">Pending</Badge>
                              <span className="text-xs text-muted-foreground">
                                Sent {formatLastSeen(request.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="minecraft-panel">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 opacity-50 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📤</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No sent requests</h3>
                  <p className="text-muted-foreground">
                    You haven't sent any friend requests yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Add Friends */}
          <TabsContent value="add" className="space-y-6">
            <Card className="minecraft-panel bg-card border-2 border-primary/20 shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <span className="text-xl">Add Friend</span>
                    <p className="text-sm font-normal text-muted-foreground">
                      Send a friend request by username
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddFriend} className="flex gap-4">
                  <Input
                    type="text"
                    placeholder="Enter username..."
                    value={addFriendUsername}
                    onChange={(e) => setAddFriendUsername(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!addFriendUsername.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Send Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="minecraft-panel bg-card border-2 border-primary/20 shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-xl">🔍</span>
                  </div>
                  <span>Search Users</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin">
                      <div className="w-full h-full border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
                            <span className="font-semibold text-sm">{user.username.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.status || "Offline"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddFriendFromSearch(user.username)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Add Friend
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      No users found matching "{searchQuery}". Try a different search term.
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
