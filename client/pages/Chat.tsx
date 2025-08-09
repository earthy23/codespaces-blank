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
import {
  Send,
  Phone,
  PhoneOff,
  Settings,
  Plus,
  Hash,
  Users,
  MessageCircle,
} from "lucide-react";

export default function Chat() {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    chats,
    getChatMessages,
    getChatById,
    sendMessage,
    createDirectMessage,
    createGroupChat,
    editMessage,
    deleteMessage,
    markAsRead,
    refreshChats,
    generalMessages,
    sendGeneralMessage,
    startTyping,
    stopTyping,
    typingUsers,
    isConnected,
  } = useChat();
  const { friends } = useFriends();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [messageContent, setMessageContent] = useState("");
  const [activeTab, setActiveTab] = useState(
    chatId ? "direct" : searchParams.get("tab") || "general",
  );
  const [showCreateChatDialog, setShowCreateChatDialog] = useState(false);
  const [createChatType, setCreateChatType] = useState<"dm" | "group">("dm");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupChatName, setGroupChatName] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [callParticipants, setCallParticipants] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentChat = chatId ? getChatById(chatId) : null;
  const currentMessages = chatId ? getChatMessages(chatId) : [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, generalMessages]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Update active tab based on URL
  useEffect(() => {
    if (chatId) {
      setActiveTab("direct");
    } else {
      setActiveTab("general");
    }
  }, [chatId]);

  // Mark messages as read when opening a chat
  useEffect(() => {
    if (chatId && currentChat?.unread_count > 0) {
      const timeoutId = setTimeout(() => {
        markAsRead(chatId);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [chatId, currentChat?.unread_count, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    if (activeTab === "general") {
      try {
        await sendGeneralMessage(messageContent);
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
      const response = await createGroupChat(groupChatName, selectedFriends);
      if (response) {
        await refreshChats();
        navigate(`/chat/${response.chatId}`);
        setShowCreateChatDialog(false);
        setSelectedFriends([]);
        setGroupChatName("");
        toast({
          title: "Success",
          description: "Group chat created successfully!",
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Please log in</h2>
            <p className="text-muted-foreground">
              You need to be logged in to access chat.
            </p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/30 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground">Chat</h1>
            {isInCall && (
              <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-400">
                  In Call ({callParticipants.length})
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEndCall}
                  className="h-6 px-2 hover:bg-red-500/10 hover:text-red-400"
                >
                  End
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Chat List */}
          <div className="w-80 border-r border-border bg-card/20 backdrop-blur-sm">
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">
                    Conversations
                  </h2>
                  <Dialog
                    open={showCreateChatDialog}
                    onOpenChange={setShowCreateChatDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="minecraft-panel">
                      <DialogHeader>
                        <DialogTitle>New Chat</DialogTitle>
                        <DialogDescription>
                          Start a direct message or create a group chat
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
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Direct Message
                          </Button>
                          <Button
                            variant={
                              createChatType === "group" ? "default" : "outline"
                            }
                            onClick={() => setCreateChatType("group")}
                            className="flex-1"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Group Chat
                          </Button>
                        </div>

                        {createChatType === "dm" ? (
                          <div className="space-y-3">
                            <h4 className="font-medium">Select a friend:</h4>
                            <ScrollArea className="max-h-60">
                              <div className="space-y-2">
                                {(friends || []).map((friend) => (
                                  <div
                                    key={friend.id}
                                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="text-sm font-semibold">
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
                                {(friends || []).length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground">
                                    No friends available. Add some friends
                                    first!
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Group Name
                              </label>
                              <Input
                                value={groupChatName}
                                onChange={(e) =>
                                  setGroupChatName(e.target.value)
                                }
                                placeholder="Enter group name..."
                              />
                            </div>
                            <div>
                              <h4 className="font-medium mb-3">
                                Select friends:
                              </h4>
                              <ScrollArea className="max-h-60">
                                <div className="space-y-2">
                                  {(friends || []).map((friend) => (
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
                                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="text-sm font-semibold">
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
                                  {(friends || []).length === 0 && (
                                    <div className="text-center py-4 text-muted-foreground">
                                      No friends available.
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </div>
                            <Button
                              onClick={handleCreateGroupChat}
                              disabled={
                                selectedFriends.length === 0 ||
                                !groupChatName.trim()
                              }
                              className="w-full"
                            >
                              Create Group ({selectedFriends.length} friends)
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Chat List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {/* General Chat */}
                  <button
                    onClick={() => {
                      setActiveTab("general");
                      navigate("/chat");
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeTab === "general"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">General</p>
                        <p className="text-xs opacity-70 truncate">
                          Community chat
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Direct Message Chats */}
                  {(chats || []).map((chat) => (
                    <Link
                      key={chat.id}
                      to={`/chat/${chat.id}`}
                      className={`block p-3 rounded-lg transition-colors ${
                        chatId === chat.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                          {chat.type === "group" ? (
                            <Users className="w-5 h-5" />
                          ) : (
                            <span className="font-semibold text-sm">
                              {chat.participant_usernames
                                ?.find((username) => username !== user.username)
                                ?.charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {chat.type === "group"
                                ? chat.name || "Group Chat"
                                : chat.participant_usernames?.find(
                                    (username) => username !== user.username,
                                  )}
                            </p>
                            {chat.unread_count > 0 && (
                              <Badge
                                variant="destructive"
                                className="text-xs h-5 px-1.5"
                              >
                                {chat.unread_count}
                              </Badge>
                            )}
                          </div>
                          {chat.last_message && (
                            <p className="text-xs opacity-70 truncate">
                              {chat.last_message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {(chats || []).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No chats yet. Click the + button to start!
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-background">
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card/20 backdrop-blur-sm">
              {activeTab === "general" ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">General Chat</h3>
                      <p className="text-sm text-muted-foreground">
                        Community discussion
                      </p>
                    </div>
                  </div>
                </div>
              ) : currentChat ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                      {currentChat.type === "group" ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        <span className="font-semibold text-sm">
                          {currentChat.participant_usernames
                            ?.find((username) => username !== user.username)
                            ?.charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">
                          {currentChat.type === "group"
                            ? currentChat.name || "Group Chat"
                            : currentChat.participant_usernames?.find(
                                (username) => username !== user.username,
                              )}
                        </h3>
                        {currentChat.type === "group" && (
                          <Badge variant="outline" className="text-xs">
                            Group
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentChat.type === "group"
                          ? `${currentChat.participant_usernames?.length || 0} members - Testing: File sharing & Voice calls available`
                          : "Direct message - Testing: File upload & Voice calls ready"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isInCall ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleStartCall}
                        className="hover:bg-green-500/10 hover:text-green-400"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEndCall}
                        className="hover:bg-red-500/10 hover:text-red-400"
                      >
                        <PhoneOff className="w-4 h-4" />
                      </Button>
                    )}
                    {currentChat.type === "group" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Settings className="w-4 h-4" />
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
                <div className="text-center">
                  <h3 className="font-semibold">Select a Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation or start chatting in General
                  </p>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {activeTab === "general"
                  ? (generalMessages || []).map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold">
                            {message.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">
                              {message.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))
                  : (currentMessages || []).map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold">
                            {message.sender_username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">
                              {message.sender_username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.sender_username === user.username && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                  >
                                    ⋯
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
                          {editingMessageId === message.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleEditMessage(message.id, editingContent);
                              }}
                              className="space-y-2"
                            >
                              <Input
                                value={editingContent}
                                onChange={(e) =>
                                  setEditingContent(e.target.value)
                                }
                                className="text-sm"
                              />
                              <div className="flex space-x-2">
                                <Button type="submit" size="sm">
                                  Save
                                </Button>
                                <Button
                                  type="button"
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
                            </form>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Typing Indicator */}
            {activeTab === "direct" &&
              chatId &&
              (typingUsers[chatId] || []).length > 0 && (
                <div className="px-4 py-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {(typingUsers[chatId] || []).join(", ")}{" "}
                    {(typingUsers[chatId] || []).length === 1 ? "is" : "are"}{" "}
                    typing...
                  </p>
                </div>
              )}

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card/20 backdrop-blur-sm">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                {/* File Upload Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Placeholder for file upload
                    toast({
                      title: "File Upload",
                      description: "File upload feature - Coming Soon!",
                    });
                  }}
                  disabled={!activeTab || (activeTab === "direct" && !chatId)}
                  className="px-2"
                >
                  📎
                </Button>

                {/* Voice Call Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Placeholder for voice call
                    toast({
                      title: "Voice Call",
                      description: "Voice call feature - Coming Soon!",
                    });
                  }}
                  disabled={!activeTab || (activeTab === "direct" && !chatId)}
                  className="px-2"
                >
                  🎤
                </Button>

                <Input
                  value={messageContent}
                  onChange={(e) => {
                    setMessageContent(e.target.value);
                    handleTyping();
                  }}
                  placeholder={
                    activeTab === "general"
                      ? "Message #general..."
                      : currentChat
                        ? `Message ${
                            currentChat.type === "group"
                              ? currentChat.name || "group"
                              : currentChat.participant_usernames?.find(
                                  (username) => username !== user.username,
                                )
                          }...`
                        : "Select a chat to start messaging..."
                  }
                  disabled={!activeTab || (activeTab === "direct" && !chatId)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={
                    !messageContent.trim() ||
                    !activeTab ||
                    (activeTab === "direct" && !chatId)
                  }
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
