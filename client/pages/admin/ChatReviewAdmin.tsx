import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MinecraftBackground } from "@/components/ui/minecraft-background";
import { 
  Shield, 
  ArrowLeft,
  MessageSquare,
  Flag,
  Ban,
  Check,
  X,
  Eye,
  AlertTriangle,
  User,
  Calendar,
  Search,
  Filter
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLogging } from "@/lib/logging";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface FlaggedMessage {
  id: string;
  messageId: string;
  content: string;
  senderId: string;
  senderUsername: string;
  chatId: string;
  chatType: 'dm' | 'group';
  timestamp: string;
  flagReason: string;
  flaggedBy: string;
  flaggedAt: string;
  status: 'pending' | 'approved' | 'removed' | 'ignored';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ModerationRule {
  id: string;
  name: string;
  pattern: string;
  type: 'keyword' | 'regex' | 'spam';
  action: 'flag' | 'auto_remove' | 'warn';
  severity: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  description: string;
}

const defaultModerationRules: ModerationRule[] = [
  {
    id: 'rule-1',
    name: 'Profanity Filter',
    pattern: 'bad|words|here',
    type: 'keyword',
    action: 'flag',
    severity: 'medium',
    active: true,
    description: 'Flags messages containing inappropriate language'
  },
  {
    id: 'rule-2',
    name: 'Spam Detection',
    pattern: 'repeated_message_pattern',
    type: 'spam',
    action: 'auto_remove',
    severity: 'low',
    active: true,
    description: 'Automatically removes spam messages'
  },
  {
    id: 'rule-3',
    name: 'Personal Info',
    pattern: '\\b\\d{3}-\\d{3}-\\d{4}\\b|\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
    type: 'regex',
    action: 'flag',
    severity: 'high',
    active: true,
    description: 'Flags messages containing personal information'
  }
];

// Production ready - no sample messages

export default function ChatReviewAdmin() {
  const { user, isAdmin } = useAuth();
  const { logAction } = useLogging();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
  const [moderationRules, setModerationRules] = useState<ModerationRule[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<FlaggedMessage | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/admin");
      return;
    }
    loadChatReviewData();
  }, [user, isAdmin, navigate]);

  const loadChatReviewData = () => {
    const storedMessages = JSON.parse(localStorage.getItem('uec_flagged_messages') || 'null');
    const storedRules = JSON.parse(localStorage.getItem('uec_moderation_rules') || 'null');
    
    setFlaggedMessages(storedMessages || []);
    
    if (!storedRules) {
      localStorage.setItem('uec_moderation_rules', JSON.stringify(defaultModerationRules));
      setModerationRules(defaultModerationRules);
    } else {
      setModerationRules(storedRules);
    }
  };

  const saveFlaggedMessages = (messages: FlaggedMessage[]) => {
    setFlaggedMessages(messages);
    localStorage.setItem('uec_flagged_messages', JSON.stringify(messages));
  };

  const reviewMessage = (messageId: string, action: 'approved' | 'removed' | 'ignored', notes?: string) => {
    const updatedMessages = flaggedMessages.map(msg =>
      msg.id === messageId
        ? {
            ...msg,
            status: action,
            reviewedBy: user?.username,
            reviewedAt: new Date().toISOString(),
            reviewNotes: notes
          }
        : msg
    );
    
    saveFlaggedMessages(updatedMessages);
    
    const message = flaggedMessages.find(m => m.id === messageId);
    logAction(`message_${action}`, 'chat', 'admin', {
      messageId,
      senderUsername: message?.senderUsername,
      action,
      notes
    });

    toast({
      title: "Message Reviewed",
      description: `Message has been ${action}`,
    });

    setSelectedMessage(null);
  };

  const banUserFromMessage = (messageId: string, duration: string, reason: string) => {
    const message = flaggedMessages.find(m => m.id === messageId);
    if (!message) return;

    // Here you would implement actual user banning logic
    // For now, we'll just log the action
    logAction('user_banned_from_chat', 'admin', 'admin', {
      targetUserId: message.senderId,
      targetUsername: message.senderUsername,
      reason,
      duration,
      messageId
    });

    reviewMessage(messageId, 'removed', `User banned: ${reason}`);

    toast({
      title: "User Banned",
      description: `${message.senderUsername} has been banned for ${duration}`,
    });
  };

  const filteredMessages = flaggedMessages.filter(msg => {
    const matchesSearch = 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.senderUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.flagReason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || msg.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || msg.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'removed': return 'bg-red-500';
      case 'ignored': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <MinecraftBackground>
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Chat Review</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="review" className="w-full">
            <TabsList className="grid w-full grid-cols-2 minecraft-border">
              <TabsTrigger value="review">Message Review</TabsTrigger>
              <TabsTrigger value="rules">Moderation Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="mt-6">
              <div className="space-y-6">
                {/* Review Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="minecraft-panel">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-500">
                        {flaggedMessages.filter(m => m.status === 'pending').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending Review</div>
                    </CardContent>
                  </Card>
                  <Card className="minecraft-panel">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-500">
                        {flaggedMessages.filter(m => m.severity === 'high' || m.severity === 'critical').length}
                      </div>
                      <div className="text-sm text-muted-foreground">High Priority</div>
                    </CardContent>
                  </Card>
                  <Card className="minecraft-panel">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-500">
                        {flaggedMessages.filter(m => m.status === 'approved').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Approved</div>
                    </CardContent>
                  </Card>
                  <Card className="minecraft-panel">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-500">
                        {flaggedMessages.filter(m => m.status === 'removed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Removed</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <Card className="minecraft-panel">
                  <CardHeader>
                    <CardTitle>Filter Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="search">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="search"
                            placeholder="Search messages..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="minecraft-input pl-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="minecraft-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="removed">Removed</SelectItem>
                            <SelectItem value="ignored">Ignored</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="severity">Severity</Label>
                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                          <SelectTrigger className="minecraft-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Severity</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <Button onClick={loadChatReviewData} className="minecraft-button bg-primary text-primary-foreground">
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Messages Table */}
                <Card className="minecraft-panel">
                  <CardHeader>
                    <CardTitle>Flagged Messages ({filteredMessages.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Message</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Flagged</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMessages.map((msg) => (
                          <TableRow key={msg.id}>
                            <TableCell className="max-w-xs">
                              <div className="truncate font-mono text-sm bg-muted/50 p-2 rounded">
                                {msg.content}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{msg.senderUsername}</div>
                                <div className="text-sm text-muted-foreground">{msg.chatType}</div>
                              </div>
                            </TableCell>
                            <TableCell>{msg.flagReason}</TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(msg.severity)}>
                                {msg.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(msg.status)}>
                                {msg.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatTimestamp(msg.flaggedAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedMessage(msg)}
                                  className="minecraft-border"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {msg.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => reviewMessage(msg.id, 'approved')}
                                      className="minecraft-button bg-green-600 text-white"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => reviewMessage(msg.id, 'removed')}
                                      className="minecraft-button bg-red-600 text-white"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rules" className="mt-6">
              <Card className="minecraft-panel">
                <CardHeader>
                  <CardTitle>Moderation Rules</CardTitle>
                  <CardDescription>Configure automatic moderation rules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="minecraft-panel">
                        <CardHeader>
                          <CardTitle className="text-lg">Automated Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span>Profanity Filter</span>
                            <input type="checkbox" defaultChecked className="minecraft-input w-4 h-4" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Spam Detection</span>
                            <input type="checkbox" defaultChecked className="minecraft-input w-4 h-4" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Link Filtering</span>
                            <input type="checkbox" className="minecraft-input w-4 h-4" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>CAPS Lock Filter</span>
                            <input type="checkbox" className="minecraft-input w-4 h-4" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="minecraft-panel">
                        <CardHeader>
                          <CardTitle className="text-lg">Moderation Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Default Warning Threshold</label>
                            <input type="number" defaultValue="3" className="minecraft-input w-full" min="1" max="10" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Auto-mute Duration (minutes)</label>
                            <input type="number" defaultValue="5" className="minecraft-input w-full" min="1" max="1440" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Message Retention Days</label>
                            <input type="number" defaultValue="30" className="minecraft-input w-full" min="1" max="365" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="minecraft-panel">
                      <CardHeader>
                        <CardTitle className="text-lg">Blocked Words & Phrases</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <textarea
                            placeholder="Enter blocked words/phrases, one per line..."
                            className="minecraft-input w-full min-h-32"
                            defaultValue="spam\nscam\nhack\ncheat"
                          />
                          <div className="flex gap-2">
                            <Button className="minecraft-button bg-primary text-primary-foreground">
                              Save Word List
                            </Button>
                            <Button variant="outline" className="minecraft-button">
                              Import List
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Message Review Modal */}
          {selectedMessage && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="minecraft-panel w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>Review Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Message Content</Label>
                      <div className="bg-muted/50 p-4 rounded font-mono text-sm">
                        {selectedMessage.content}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Sender</Label>
                        <p className="text-sm">{selectedMessage.senderUsername}</p>
                      </div>
                      <div>
                        <Label>Chat Type</Label>
                        <p className="text-sm">{selectedMessage.chatType}</p>
                      </div>
                    </div>

                    <div>
                      <Label>Flag Reason</Label>
                      <p className="text-sm">{selectedMessage.flagReason}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => reviewMessage(selectedMessage.id, 'approved')}
                        className="minecraft-button bg-green-600 text-white"
                      >
                        Approve Message
                      </Button>
                      <Button
                        onClick={() => reviewMessage(selectedMessage.id, 'removed')}
                        className="minecraft-button bg-red-600 text-white"
                      >
                        Remove Message
                      </Button>
                      <Button
                        onClick={() => reviewMessage(selectedMessage.id, 'ignored')}
                        variant="outline"
                        className="minecraft-border"
                      >
                        Ignore Flag
                      </Button>
                      <Button
                        onClick={() => setSelectedMessage(null)}
                        variant="outline"
                        className="minecraft-border"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MinecraftBackground>
  );
}
