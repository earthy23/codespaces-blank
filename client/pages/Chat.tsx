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
  MessageCircle,
  Send,
  Plus,
  Users,
  Hash,
  Server,
  Volume2,
  Wifi,
  WifiOff,
  Loader2,
  MoreVertical,
  Edit3,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import { useFriends } from "@/lib/friends";
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
  } = useChat();
  const { friends } = useFriends();
  const navigate = useNavigate();
  const [messageContent, setMessageContent] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract server and channel from URL params
  const serverId = searchParams.get("server");
  const channelId = searchParams.get("channel");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (chatId) {
      markAsRead(chatId);
    }
  }, [chatId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatId, getChatMessages(chatId || "")]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !chatId) return;

    try {
      await sendMessage(chatId, messageContent);
      setMessageContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!chatId || !newContent.trim()) return;

    try {
      await editMessage(chatId, messageId, newContent);
      setEditingMessageId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!chatId) return;

    try {
      await deleteMessage(chatId, messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleTyping = (content: string) => {
    setMessageContent(content);

    if (!chatId) return;

    if (content.trim()) {
      startTyping(chatId);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(chatId);
      }, 3000);
    } else {
      stopTyping(chatId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const getChatDisplayName = (chat?: any) => {
    if (!chat) return "Chat";

    if (chat.type === "dm") {
      // For DMs, show the other participant's name
      if (chat.participant_usernames) {
        const otherUsername = chat.participant_usernames.find(
          (username: string) => username !== user?.username,
        );
        return otherUsername || "Unknown User";
      }
    }
    return chat.name || "Group Chat";
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (!user) {
    return null;
  }

  const currentChat = chatId ? getChatById(chatId) : null;
  const messages = chatId ? getChatMessages(chatId) : [];
  const currentTypingUsers = chatId ? typingUsers[chatId] || [] : [];

  return (
    <UserLayout>
      <div className="h-[calc(100vh-120px)] flex gap-6">
        {/* Chat List Sidebar */}
        <div className="w-80 h-full">
          <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <MessageCircle className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                  </div>
                  <span>Messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
              </CardTitle>
              <Link to="/friends">
                <Button className="w-full minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full px-4">
                {!isConnected && (
                  <Alert className="mb-4 mx-4">
                    <WifiOff className="h-4 w-4" />
                    <AlertDescription>
                      Connection lost. Attempting to reconnect...
                    </AlertDescription>
                  </Alert>
                )}

                {chats.length > 0 ? (
                  <div className="pb-4">
                    {chats.map((chat) => (
                      <Link
                        key={chat.id}
                        to={`/chat/${chat.id}`}
                        className={`block p-3 rounded-lg mb-2 transition-colors border ${
                          chatId === chat.id
                            ? "bg-primary/20 border-primary/30"
                            : "hover:bg-muted/50 border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium truncate">
                            {getChatDisplayName(chat)}
                          </h3>
                          {chat.unread_count > 0 && (
                            <Badge
                              variant="default"
                              className="bg-primary text-primary-foreground text-xs"
                            >
                              {chat.unread_count}
                            </Badge>
                          )}
                        </div>
                        {chat.last_message && (
                          <div className="text-sm text-muted-foreground">
                            <p className="truncate">
                              {chat.last_message.sender_username}:{" "}
                              {chat.last_message.content}
                            </p>
                            <p className="text-xs">
                              {formatMessageTime(chat.last_message.created_at)}
                            </p>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">No conversations yet</p>
                    <p className="text-sm">Start a chat with your friends!</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 h-full">
          <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg h-full flex flex-col">
            {currentChat ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                      <MessageCircle className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                    </div>
                    <div>
                      <h2 className="text-xl">
                        {getChatDisplayName(currentChat)}
                      </h2>
                      {currentChat.type === "dm" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center space-x-1 mt-1"
                        >
                          <Users className="w-3 h-3" />
                          <span>Direct Message</span>
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full px-4">
                    <div className="space-y-4 pb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg border group relative ${
                              message.sender_id === user.id
                                ? "bg-primary text-primary-foreground border-primary/50"
                                : "bg-muted border-border"
                            }`}
                          >
                            {message.sender_id !== user.id && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {message.sender_username}
                              </p>
                            )}

                            {editingMessageId === message.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editingContent}
                                  onChange={(e) =>
                                    setEditingContent(e.target.value)
                                  }
                                  className="minecraft-input"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleEditMessage(
                                        message.id,
                                        editingContent,
                                      );
                                    } else if (e.key === "Escape") {
                                      setEditingMessageId(null);
                                      setEditingContent("");
                                    }
                                  }}
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleEditMessage(
                                        message.id,
                                        editingContent,
                                      )
                                    }
                                    className="minecraft-button"
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
                                    className="minecraft-button"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}

                            <div className="flex items-center justify-between mt-1">
                              <p
                                className={`text-xs ${
                                  message.sender_id === user.id
                                    ? "opacity-70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {formatMessageTime(message.created_at)}
                                {message.edited_at && (
                                  <span className="ml-1 opacity-60">
                                    (edited)
                                  </span>
                                )}
                              </p>

                              {message.sender_id === user.id &&
                                editingMessageId !== message.id && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 h-auto p-1"
                                      >
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingMessageId(message.id);
                                          setEditingContent(message.content);
                                        }}
                                      >
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDeleteMessage(message.id)
                                        }
                                        className="text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing indicators */}
                      {currentTypingUsers.length > 0 && (
                        <div className="flex justify-start">
                          <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg border bg-muted border-border">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div
                                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                />
                                <div
                                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                />
                                <div
                                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {currentTypingUsers
                                  .map((u) => u.username)
                                  .join(", ")}{" "}
                                typing...
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t border-border p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={messageContent}
                      onChange={(e) => handleTyping(e.target.value)}
                      placeholder={
                        isConnected ? "Type a message..." : "Reconnecting..."
                      }
                      className="minecraft-input"
                      disabled={!isConnected}
                    />
                    <Button
                      type="submit"
                      disabled={!messageContent.trim() || !isConnected}
                      className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <h2 className="text-2xl font-bold mb-2">Select a Chat</h2>
                  <p className="mb-4">
                    Choose a conversation to start messaging
                  </p>
                  <Link to="/friends">
                    <Button className="minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30">
                      <Users className="w-4 h-4 mr-2" />
                      Find Friends to Chat
                    </Button>
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}
