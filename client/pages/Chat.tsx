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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState(chatId ? "direct" : "general");
  const [generalMessages, setGeneralMessages] = useState<any[]>([]);
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
      setActiveTab("direct");
    }
  }, [chatId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatId, getChatMessages(chatId || ""), generalMessages]);

  // Load general chat messages
  useEffect(() => {
    if (activeTab === "general") {
      loadGeneralMessages();
    }
  }, [activeTab]);

  const loadGeneralMessages = async () => {
    try {
      // This would typically fetch from an API endpoint
      // For now, we'll simulate general chat messages
      const mockMessages = [
        {
          id: "1",
          content: "Welcome to UEC Launcher general chat!",
          senderId: "system",
          senderUsername: "System",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: "system"
        },
        {
          id: "2", 
          content: "Hey everyone! How's everyone doing today?",
          senderId: "user1",
          senderUsername: "GameMaster",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: "message"
        },
        {
          id: "3",
          content: "Pretty good! Just got done setting up my server.",
          senderId: "user2", 
          senderUsername: "Builder123",
          timestamp: new Date(Date.now() - 900000).toISOString(),
          type: "message"
        }
      ];
      setGeneralMessages(mockMessages);
    } catch (error) {
      console.error("Failed to load general messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    if (activeTab === "general") {
      // Handle general chat message
      const newMessage = {
        id: Date.now().toString(),
        content: messageContent,
        senderId: user?.id || "",
        senderUsername: user?.username || "Unknown",
        timestamp: new Date().toISOString(),
        type: "message"
      };
      setGeneralMessages(prev => [...prev, newMessage]);
      setMessageContent("");
    } else if (chatId) {
      // Handle direct message
      try {
        await sendMessage(chatId, messageContent);
        setMessageContent("");
      } catch (error) {
        console.error("Failed to send message:", error);
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
        await editMessage(messageId, newContent);
        setEditingMessageId(null);
        setEditingContent("");
      } catch (error) {
        console.error("Failed to edit message:", error);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (activeTab === "direct" && chatId) {
      try {
        await deleteMessage(messageId);
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
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

  const currentChat = chatId ? getChatById(chatId) : null;
  const messages = chatId ? getChatMessages(chatId) : [];

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chat</h1>
            <p className="text-muted-foreground">
              Connect with friends and the community
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat List Sidebar */}
          <div className="lg:col-span-1">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Chats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* General Chat Option */}
                  <button
                    onClick={() => {
                      setActiveTab("general");
                      navigate("/chat");
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      activeTab === "general" 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-muted border-border hover:bg-muted/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">#</span>
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
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-muted border-border hover:bg-muted/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
                          <span className="font-semibold text-sm">
                            {chat.participants.find(p => p.id !== user.id)?.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {chat.participants.find(p => p.id !== user.id)?.username}
                          </p>
                          {chat.lastMessage && (
                            <p className="text-xs opacity-70 truncate">
                              {chat.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}

                  {chats.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        No direct messages yet. Start a conversation with a friend!
                      </p>
                    </div>
                  )}
                </div>
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
                    <CardDescription>
                      Community chat for all UEC Launcher users
                    </CardDescription>
                  </div>
                ) : currentChat ? (
                  <div>
                    <CardTitle>
                      {currentChat.participants.find(p => p.id !== user.id)?.username}
                    </CardTitle>
                    <CardDescription>
                      Direct message conversation
                    </CardDescription>
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
                        <div key={message.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold text-sm">
                              {message.senderUsername.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-sm">
                                {message.senderUsername}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {message.type === "system" && (
                                <Badge variant="outline" className="text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))
                    ) : messages.length > 0 ? (
                      messages.map((message) => (
                        <div key={message.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold text-sm">
                              {message.senderUsername.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-sm">
                                {message.senderUsername}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {message.edited && (
                                <Badge variant="outline" className="text-xs">
                                  Edited
                                </Badge>
                              )}
                            </div>
                            {editingMessageId === message.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="flex-1"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleEditMessage(message.id, editingContent)}
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
                                <p className="text-sm">{message.content}</p>
                                {message.senderId === user.id && (
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
                                        onClick={() => handleDeleteMessage(message.id)}
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
                    {typingUsers.length > 0 && activeTab === "direct" && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span>
                          {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <Input
                      value={messageContent}
                      onChange={(e) => {
                        setMessageContent(e.target.value);
                        handleTyping();
                      }}
                      placeholder={
                        activeTab === "general" 
                          ? "Message the community..." 
                          : currentChat 
                            ? `Message ${currentChat.participants.find(p => p.id !== user.id)?.username}...`
                            : "Select a chat to start messaging..."
                      }
                      disabled={!currentChat && activeTab === "direct"}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={!messageContent.trim() || (!currentChat && activeTab === "direct")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Send
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
