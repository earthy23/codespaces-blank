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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import { useFriends } from "@/lib/friends";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { UserLayout } from "@/components/ui/user-layout";

export default function Chat() {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    chats,
    getChatMessages,
    getChatById,
    sendMessage,
    markAsRead,
    isConnected,
    isLoading,
    typingUsers,
    startTyping,
    stopTyping,
    editMessage,
    deleteMessage,
    createDirectMessage,
    createGroupChat,
    refreshChats,
  } = useChat();
  const { friends } = useFriends();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messageContent, setMessageContent] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [activeTab, setActiveTab] = useState(chatId ? "direct" : "general");
  const [generalMessages, setGeneralMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // New states for enhanced features
  const [showCreateChatDialog, setShowCreateChatDialog] = useState(false);
  const [createChatType, setCreateChatType] = useState<"dm" | "group">("dm");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupChatName, setGroupChatName] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [callParticipants, setCallParticipants] = useState<string[]>([]);

  // Mini profile popup state
  const [showMiniProfile, setShowMiniProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (chatId) {
      markAsRead(chatId);
      setActiveTab("direct");
    }
  }, [chatId, markAsRead]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Small delay to ensure content is rendered
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [chatId, getChatMessages(chatId || ""), generalMessages]);

  // Load general chat messages
  useEffect(() => {
    if (activeTab === "general") {
      loadGeneralMessages();
    }
  }, [activeTab]);

  const loadGeneralMessages = async () => {
    try {
      // Load from localStorage if available, otherwise start with welcome message
      const storedMessages = localStorage.getItem("general_chat_messages");
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        setGeneralMessages(parsedMessages);
      } else {
        // Start with welcome message for new users
        const welcomeMessages = [
          {
            id: "welcome",
            content: "Welcome to UEC Launcher community! 🎮",
            senderId: "system",
            senderUsername: "System",
            timestamp: new Date().toISOString(),
            type: "system",
          },
          {
            id: "info",
            content:
              "This is a local community chat. Messages are stored locally and will be visible to you across sessions.",
            senderId: "system",
            senderUsername: "System",
            timestamp: new Date().toISOString(),
            type: "system",
          },
        ];
        setGeneralMessages(welcomeMessages);
        localStorage.setItem(
          "general_chat_messages",
          JSON.stringify(welcomeMessages),
        );
      }
    } catch (error) {
      console.error("Failed to load general messages:", error);
      setGeneralMessages([
        {
          id: "fallback",
          content: "Welcome to UEC Launcher community! 🎮",
          senderId: "system",
          senderUsername: "System",
          timestamp: new Date().toISOString(),
          type: "system",
        },
      ]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    if (activeTab === "general") {
      try {
        // For now, use local general chat functionality
        // This can be replaced with real API integration later
        const newMessage = {
          id: Date.now().toString(),
          content: messageContent.trim(),
          senderId: user?.id || "",
          senderUsername: user?.username || "Unknown",
          timestamp: new Date().toISOString(),
          type: "message",
        };

        const updatedMessages = [...generalMessages, newMessage];
        setGeneralMessages(updatedMessages);

        // Save to localStorage for persistence
        try {
          localStorage.setItem(
            "general_chat_messages",
            JSON.stringify(updatedMessages),
          );
        } catch (storageError) {
          console.warn(
            "Failed to save messages to localStorage:",
            storageError,
          );
        }

        setMessageContent("");
      } catch (error) {
        console.error("Failed to send general message:", error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } else if (chatId) {
      try {
        await sendMessage(chatId, messageContent);
        setMessageContent("");
      } catch (error) {
        console.error("Failed to send message:", error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleTyping = () => {
    if (activeTab === "direct" && chatId) {
      startTyping(chatId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(chatId);
      }, 3000);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (activeTab === "direct" && chatId) {
      try {
        await editMessage(chatId, messageId, newContent);
        setEditingMessageId(null);
        setEditingContent("");
      } catch (error) {
        console.error("Failed to edit message:", error);
        toast({
          title: "Error",
          description: "Failed to edit message.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (activeTab === "direct" && chatId) {
      try {
        await deleteMessage(chatId, messageId);
      } catch (error) {
        console.error("Failed to delete message:", error);
        toast({
          title: "Error",
          description: "Failed to delete message.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateDM = async (friendUsername: string) => {
    try {
      const chatId = await createDirectMessage(friendUsername);
      if (chatId) {
        await refreshChats();
        navigate(`/chat/${chatId}`);
        setShowCreateChatDialog(false);
        toast({
          title: "Success",
          description: "Direct message created successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to create DM:", error);
      toast({
        title: "Error",
        description: "Failed to create direct message.",
        variant: "destructive",
      });
    }
  };

  const handleCreateGroupChat = async () => {
    if (selectedFriends.length === 0 || !groupChatName.trim()) {
      toast({
        title: "Error",
        description: "Please select friends and enter a group name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedUsernames = selectedFriends
        .map((friendId) => friends.find((f) => f.id === friendId)?.username)
        .filter(Boolean) as string[];

      const chatId = await createGroupChat(
        groupChatName.trim(),
        selectedUsernames,
      );
      if (chatId) {
        await refreshChats();
        navigate(`/chat/${chatId}`);
        setShowCreateChatDialog(false);
        setSelectedFriends([]);
        setGroupChatName("");
        toast({
          title: "Success",
          description: `Group chat "${groupChatName}" created with ${selectedFriends.length} friends!`,
        });
      } else {
        throw new Error("Failed to create group chat");
      }
    } catch (error) {
      console.error("Failed to create group chat:", error);
      toast({
        title: "Error",
        description: "Failed to create group chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartCall = () => {
    if (!currentChat) return;

    setIsInCall(true);
    setCallParticipants(currentChat.participant_usernames || []);
    toast({
      title: "Call Started",
      description: "Voice call initiated with chat participants.",
    });
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setCallParticipants([]);
    toast({
      title: "Call Ended",
      description: "Voice call has been ended.",
    });
  };

  const handleLeaveGroup = async () => {
    if (!currentChat || currentChat.type !== "group") return;

    try {
      // This would leave the group via API
      toast({
        title: "Left Group",
        description: `You have left the group chat.`,
      });
      navigate("/chat");
    } catch (error) {
      console.error("Failed to leave group:", error);
      toast({
        title: "Error",
        description: "Failed to leave group chat.",
        variant: "destructive",
      });
    }
  };

  const handlePingUser = (username: string) => {
    if (!chatId) return;

    const pingMessage = `@${username} `;
    setMessageContent((prev) => prev + pingMessage);
  };

  const handleUserClick = (username: string, userId?: string) => {
    // Mock user data for mini profile - in real app this would fetch from API
    const mockUser = {
      id: userId || username,
      username: username,
      bio: `${username} is an active member of the UEC community!`,
      joinedAt: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
      followers: Math.floor(Math.random() * 1000) + 50,
      following: Math.floor(Math.random() * 500) + 20,
      totalVideos: Math.floor(Math.random() * 50) + 1,
      isOnline: Math.random() > 0.5,
      isFriend: false,
      isBlocked: false,
    };

    setSelectedUser(mockUser);
    setShowMiniProfile(true);
  };

  const handleAddFriend = async (username: string) => {
    try {
      // API call would go here
      toast({
        title: "Friend Request Sent",
        description: `Friend request sent to ${username}`,
      });
      setShowMiniProfile(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async (username: string) => {
    try {
      // API call would go here
      toast({
        title: "User Blocked",
        description: `${username} has been blocked`,
      });
      setShowMiniProfile(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - messageDate.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return messageDate.toLocaleDateString();
  };

  const renderMessage = (message: any) => {
    const content = message.content;
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part: string, index: number) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span
            key={index}
            className="bg-primary/20 text-primary px-1 rounded font-semibold"
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const currentChat = chatId ? getChatById(chatId) : null;
  const messages = chatId ? getChatMessages(chatId) : [];

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chat</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            ></div>
            <span className="text-sm font-medium">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            {isInCall && (
              <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  In Call ({callParticipants.length})
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEndCall}
                  className="h-6 px-2"
                >
                  End
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat List Sidebar */}
          <div className="lg:col-span-1">
            <Card className="minecraft-panel">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Chats</CardTitle>
                  <Dialog
                    open={showCreateChatDialog}
                    onOpenChange={setShowCreateChatDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="minecraft-panel">
                      <DialogHeader>
                        <DialogTitle>Create New Chat</DialogTitle>
                        <DialogDescription>
                          Start a direct message or create a group chat with
                          your friends.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <Button
                            variant={
                              createChatType === "dm" ? "default" : "outline"
                            }
                            onClick={() => setCreateChatType("dm")}
                            className="flex-1"
                          >
                            DM Friends
                          </Button>
                          <Button
                            variant={
                              createChatType === "group" ? "default" : "outline"
                            }
                            onClick={() => setCreateChatType("group")}
                            className="flex-1"
                          >
                            Group Chat
                          </Button>
                        </div>

                        {createChatType === "dm" ? (
                          <div className="space-y-3">
                            <h4 className="font-semibold">
                              Select a friend to message:
                            </h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {friends.map((friend) => (
                                <div
                                  key={friend.id}
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/80 transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
                                      <span className="font-semibold text-sm">
                                        {friend.username
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        {friend.username}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {friend.status === "online"
                                          ? "🟢 Online"
                                          : "⚫ Offline"}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleCreateDM(friend.username)
                                    }
                                  >
                                    Message
                                  </Button>
                                </div>
                              ))}
                              {friends.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                  No friends available. Add some friends first!
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label
                                htmlFor="groupName"
                                className="block text-sm font-medium mb-2"
                              >
                                Group Name
                              </label>
                              <Input
                                id="groupName"
                                value={groupChatName}
                                onChange={(e) =>
                                  setGroupChatName(e.target.value)
                                }
                                placeholder="Enter group name..."
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold mb-3">
                                Select friends to add:
                              </h4>
                              <div className="max-h-60 overflow-y-auto space-y-2">
                                {friends.map((friend) => (
                                  <div
                                    key={friend.id}
                                    className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                                  >
                                    <Checkbox
                                      id={friend.id}
                                      checked={selectedFriends.includes(
                                        friend.id,
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedFriends((prev) => [
                                            ...prev,
                                            friend.id,
                                          ]);
                                        } else {
                                          setSelectedFriends((prev) =>
                                            prev.filter(
                                              (id) => id !== friend.id,
                                            ),
                                          );
                                        }
                                      }}
                                    />
                                    <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
                                      <span className="font-semibold text-sm">
                                        {friend.username
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                    <label
                                      htmlFor={friend.id}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <p className="font-medium">
                                        {friend.username}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {friend.status === "online"
                                          ? "🟢 Online"
                                          : "⚫ Offline"}
                                      </p>
                                    </label>
                                  </div>
                                ))}
                                {friends.length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground">
                                    No friends available. Add some friends
                                    first!
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={handleCreateGroupChat}
                              disabled={
                                selectedFriends.length === 0 ||
                                !groupChatName.trim()
                              }
                              className="w-full"
                            >
                              Create Group Chat ({selectedFriends.length}{" "}
                              friends)
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 p-4">
                    {/* General Chat Option */}
                    <button
                      onClick={() => {
                        setActiveTab("general");
                        navigate("/chat");
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        activeTab === "general"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            #
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">General Chat</p>
                          <p className="text-xs opacity-70">Community chat</p>
                        </div>
                      </div>
                    </button>

                    {/* Direct Message Chats */}
                    {chats.map((chat) => (
                      <Link
                        key={chat.id}
                        to={`/chat/${chat.id}`}
                        className={`block p-3 rounded-lg border transition-colors ${
                          chatId === chat.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted border-border hover:bg-muted/80"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
                            <span className="font-semibold text-sm">
                              {chat.type === "group"
                                ? "👥"
                                : chat.participant_usernames
                                    ?.find(
                                      (username) => username !== user.username,
                                    )
                                    ?.charAt(0)
                                    .toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {chat.type === "group"
                                ? chat.name || "Group Chat"
                                : chat.participant_usernames?.find(
                                    (username) => username !== user.username,
                                  )}
                            </p>
                            {chat.last_message && (
                              <p className="text-xs opacity-70 truncate">
                                {chat.last_message.content}
                              </p>
                            )}
                          </div>
                          {chat.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {chat.unread_count}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}

                    {chats.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          No chats yet. Click the + button to start a
                          conversation!
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Messages Area */}
          <div className="lg:col-span-3">
            <Card className="minecraft-panel h-[600px] flex flex-col">
              <CardHeader className="border-b">
                {activeTab === "general" ? (
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="text-2xl">#</span>
                      <span>General Chat</span>
                    </CardTitle>
                  </div>
                ) : currentChat ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>
                          {currentChat.type === "group"
                            ? currentChat.name || "Group Chat"
                            : currentChat.participant_usernames?.find(
                                (username) => username !== user.username,
                              )}
                        </span>
                        {currentChat.type === "group" && (
                          <Badge variant="outline">Group</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {currentChat.type === "group"
                          ? `${currentChat.participant_usernames?.length || 0} members`
                          : "Direct message conversation"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isInCall ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleStartCall}
                        >
                          📞 Call
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleEndCall}
                        >
                          📞 End Call
                        </Button>
                      )}
                      {currentChat.type === "group" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              ⚙️
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={handleLeaveGroup}
                              className="text-red-600"
                            >
                              Leave Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <CardTitle>Select a Chat</CardTitle>
                    <CardDescription>
                      Choose a conversation or start chatting in General
                    </CardDescription>
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {activeTab === "general" ? (
                      generalMessages.map((message) => (
                        <div
                          key={message.id}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold text-sm">
                              {message.senderUsername.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <button
                                onClick={() => handleUserClick(message.senderUsername, message.senderId)}
                                className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
                              >
                                {message.senderUsername}
                              </button>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {message.type === "system" && (
                                <Badge variant="outline" className="text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{renderMessage(message)}</p>
                          </div>
                        </div>
                      ))
                    ) : messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold text-sm">
                              {message.sender_username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <button
                                onClick={() => handleUserClick(message.sender_username, message.sender_id)}
                                className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
                              >
                                {message.sender_username}
                              </button>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.created_at)}
                              </span>
                              {message.edited_at && (
                                <Badge variant="outline" className="text-xs">
                                  Edited
                                </Badge>
                              )}
                              <button
                                onClick={() =>
                                  handlePingUser(message.sender_username)
                                }
                                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                title="Ping this user"
                              >
                                @
                              </button>
                            </div>
                            {editingMessageId === message.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editingContent}
                                  onChange={(e) =>
                                    setEditingContent(e.target.value)
                                  }
                                  className="flex-1"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleEditMessage(
                                      message.id,
                                      editingContent,
                                    )
                                  }
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMessageId(null);
                                    setEditingContent("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between group">
                                <p className="text-sm">
                                  {renderMessage(message)}
                                </p>
                                {message.sender_id === user.id && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        •••
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingMessageId(message.id);
                                          setEditingContent(message.content);
                                        }}
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDeleteMessage(message.id)
                                        }
                                        className="text-red-600"
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : activeTab === "direct" ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : null}

                    {/* Typing Indicators */}
                    {typingUsers[chatId || ""]?.length > 0 &&
                      activeTab === "direct" && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                            <div
                              className="w-1 h-1 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span>
                            {typingUsers[chatId || ""]
                              ?.map((u) => u.username)
                              .join(", ")}{" "}
                            {typingUsers[chatId || ""]?.length === 1
                              ? "is"
                              : "are"}{" "}
                            typing...
                          </span>
                        </div>
                      )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center space-x-2"
                  >
                    <Input
                      value={messageContent}
                      onChange={(e) => {
                        setMessageContent(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder={
                        activeTab === "general"
                          ? "Message the community... (Use @username to ping someone)"
                          : currentChat
                            ? `Message ${currentChat.type === "group" ? "the group" : currentChat.participant_usernames?.find((username) => username !== user.username)}... (Use @username to ping)`
                            : "Select a chat to start messaging..."
                      }
                      disabled={!currentChat && activeTab === "direct"}
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      disabled={
                        !messageContent.trim() ||
                        (!currentChat && activeTab === "direct")
                      }
                      className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[60px]"
                    >
                      Send
                    </Button>
                  </form>
                  {isInCall && (
                    <div className="mt-2 text-xs text-muted-foreground text-center">
                      🎧 Voice call active • {callParticipants.length}{" "}
                      participants
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mini Profile Popup */}
        <Dialog open={showMiniProfile} onOpenChange={setShowMiniProfile}>
          <DialogContent className="minecraft-panel max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                  <span className="font-bold text-primary">
                    {selectedUser?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold">{selectedUser?.username}</p>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${selectedUser?.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span className="text-muted-foreground">
                      {selectedUser?.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4">
                {selectedUser.bio && (
                  <div>
                    <h4 className="font-semibold mb-1">About</h4>
                    <p className="text-sm text-muted-foreground">{selectedUser.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary">{selectedUser.followers}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary">{selectedUser.following}</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary">{selectedUser.totalVideos}</div>
                    <div className="text-xs text-muted-foreground">Videos</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleAddFriend(selectedUser.username)}
                    disabled={selectedUser.isFriend}
                    className="flex-1"
                    variant={selectedUser.isFriend ? "outline" : "default"}
                  >
                    {selectedUser.isFriend ? "✓ Friends" : "➕ Add Friend"}
                  </Button>
                  <Button
                    onClick={() => handleBlockUser(selectedUser.username)}
                    variant="destructive"
                    className="flex-1"
                  >
                    🚫 Block
                  </Button>
                </div>

                <div className="flex items-center justify-center">
                  <Link
                    to={`/profile/user/${selectedUser.username}`}
                    onClick={() => setShowMiniProfile(false)}
                  >
                    <Button variant="outline" size="sm">
                      👤 View Full Profile
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  );
}
