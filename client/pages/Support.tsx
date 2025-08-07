import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HelpCircle,
  Send,
  MessageSquare,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronRight,
  Search,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/ui/user-layout";

const supportCategories = [
  { value: "technical", label: "Technical Issue" },
  { value: "account", label: "Account Problem" },
  { value: "billing", label: "Billing Question" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "other", label: "Other" },
];

const faqItems = [
  {
    id: "1",
    question: "How do I launch a client?",
    answer:
      "Go to your Dashboard, select a client from the dropdown menu, and click the Launch button. The client will open in a new tab.",
    category: "technical",
  },
  {
    id: "2",
    question: "Can I download clients for offline play?",
    answer:
      "Yes! Visit the Downloads page to download client files for offline use. You'll need to be logged in to access downloads.",
    category: "technical",
  },
  {
    id: "3",
    question: "How do I add friends?",
    answer:
      "Go to the Friends page and use the 'Add Friend' form to send friend requests by username. You can also chat with friends once they accept your request.",
    category: "account",
  },
  {
    id: "4",
    question: "How do I change my password?",
    answer:
      "Visit your Profile page and use the 'Change Password' section. You'll need to enter your current password and confirm your new password.",
    category: "account",
  },
  {
    id: "5",
    question: "What payment methods do you accept?",
    answer:
      "We accept PayPal, credit/debit cards, cryptocurrency, and gift cards through our secure Tebex integration.",
    category: "billing",
  },
  {
    id: "6",
    question: "Why is my client not loading?",
    answer:
      "Common issues include browser compatibility, JavaScript being disabled, or network connectivity. Try refreshing the page, clearing cache, or using a different browser.",
    category: "technical",
  },
  {
    id: "7",
    question: "Can I get a refund?",
    answer:
      "Refunds are available within 30 days of purchase for premium features. Contact support with your purchase details to request a refund.",
    category: "billing",
  },
  {
    id: "8",
    question: "How do I report a bug?",
    answer:
      "Use the 'Contact Support' form below and select 'Bug Report' as the category. Please include detailed steps to reproduce the issue.",
    category: "bug",
  },
];

const quickActions = [
  {
    title: "Common Issues",
    description: "Quick fixes for common problems",
    icon: Zap,
    items: [
      "Client won't load - Clear browser cache",
      "Can't connect to server - Check network",
      "Login issues - Reset password",
      "Performance problems - Update browser",
    ],
  },
  {
    title: "Account Help",
    description: "Manage your account settings",
    icon: HelpCircle,
    items: [
      "Change password in Profile",
      "Update email address",
      "Manage friend requests",
      "Privacy settings",
    ],
  },
  {
    title: "Community",
    description: "Get help from other users",
    icon: MessageSquare,
    items: [
      "Browse community forums",
      "Ask questions in discussions",
      "Share tips and tricks",
      "Connect with other players",
    ],
  },
];

export default function Support() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [supportForm, setSupportForm] = useState({
    category: "",
    subject: "",
    message: "",
    email: user?.email || "",
  });
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      setSupportForm((prev) => ({ ...prev, email: user.email || "" }));
      loadTickets();
    }
  }, [user, navigate]);

  const loadTickets = async () => {
    if (!user) return;

    setLoadingTickets(true);
    try {
      const response = await fetch("/api/support/tickets", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
      } else {
        console.error("Failed to load tickets");
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !supportForm.category ||
      !supportForm.subject.trim() ||
      !supportForm.message.trim()
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmittingTicket(true);
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(supportForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Support Ticket Created",
          description: `Ticket ${data.ticketId} created successfully. We'll respond within 24 hours.`,
        });

        setSupportForm({
          category: "",
          subject: "",
          message: "",
          email: user?.email || "",
        });

        // Reload tickets to show the new one
        loadTickets();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to create support ticket",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingTicket(false);
    }
  };

  const filteredFAQs = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Support Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get help with your account, report issues, or find answers to common
            questions.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card
                key={index}
                className="minecraft-panel bg-card/50 border-2 border-border shadow-lg hover:shadow-primary/10"
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                      <IconComponent className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                    </div>
                    <span>{action.title}</span>
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {action.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-start text-muted-foreground"
                      >
                        <CheckCircle className="w-3 h-3 text-primary mr-2 flex-shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3 minecraft-border">
            <TabsTrigger value="faq">FAQ & Knowledge Base</TabsTrigger>
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
            <TabsTrigger value="tickets">
              My Tickets ({tickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="mt-8">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search frequently asked questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="minecraft-input pl-10"
                />
              </div>
            </div>

            {/* FAQ Items */}
            <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <BookOpen className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                  </div>
                  <span>Frequently Asked Questions</span>
                </CardTitle>
                <CardDescription>
                  Find quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFAQs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredFAQs.map((item) => (
                      <div
                        key={item.id}
                        className="border border-border rounded-lg"
                      >
                        <button
                          onClick={() =>
                            setExpandedFAQ(
                              expandedFAQ === item.id ? null : item.id,
                            )
                          }
                          className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors"
                        >
                          <span className="font-medium">{item.question}</span>
                          {expandedFAQ === item.id ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedFAQ === item.id && (
                          <div className="px-4 pb-4 text-muted-foreground border-t border-border">
                            <p className="pt-3">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No results found</p>
                    <p>
                      Try a different search term or contact support directly.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                      <Send className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                    </div>
                    <span>Submit Support Ticket</span>
                  </CardTitle>
                  <CardDescription>
                    Can't find what you're looking for? Send us a message.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={supportForm.category}
                        onValueChange={(value) =>
                          setSupportForm({ ...supportForm, category: value })
                        }
                        required
                      >
                        <SelectTrigger className="minecraft-border">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={supportForm.email}
                        onChange={(e) =>
                          setSupportForm({
                            ...supportForm,
                            email: e.target.value,
                          })
                        }
                        className="minecraft-input"
                        disabled
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={supportForm.subject}
                        onChange={(e) =>
                          setSupportForm({
                            ...supportForm,
                            subject: e.target.value,
                          })
                        }
                        placeholder="Brief description of your issue"
                        className="minecraft-input"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={supportForm.message}
                        onChange={(e) =>
                          setSupportForm({
                            ...supportForm,
                            message: e.target.value,
                          })
                        }
                        placeholder="Please provide detailed information about your issue..."
                        className="minecraft-input min-h-32"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submittingTicket}
                      className="w-full minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submittingTicket ? "Submitting..." : "Submit Ticket"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Support Info */}
              <div className="space-y-6">
                <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Clock className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                      </div>
                      <span>Response Times</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Technical Issues:
                      </span>
                      <span className="font-medium">4-6 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Account Problems:
                      </span>
                      <span className="font-medium">2-4 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Billing Questions:
                      </span>
                      <span className="font-medium">1-2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        General Inquiries:
                      </span>
                      <span className="font-medium">12-24 hours</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                        <MessageSquare className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                      </div>
                      <span>Other Ways to Get Help</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link to="/forums">
                      <Button
                        variant="outline"
                        className="w-full minecraft-border hover:shadow-primary/20"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Community Forums
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full minecraft-border hover:shadow-primary/20"
                      onClick={() => window.open("mailto:support@ueclub.com")}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Support
                    </Button>
                  </CardContent>
                </Card>

                <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                        <AlertCircle className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                      </div>
                      <span>Before You Contact Us</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Check our FAQ section above</li>
                      <li>• Search the community forums</li>
                      <li>• Try clearing your browser cache</li>
                      <li>• Include detailed error messages</li>
                      <li>• Mention your browser and version</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="mt-8">
            <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                    <MessageSquare className="w-5 h-5 text-primary drop-shadow-[0_0_4px_currentColor]" />
                  </div>
                  <span>My Support Tickets</span>
                </CardTitle>
                <CardDescription>
                  View and track your support requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTickets ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading tickets...</p>
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {ticket.subject}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Category:{" "}
                              {supportCategories.find(
                                (c) => c.value === ticket.category,
                              )?.label || ticket.category}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge
                              variant={
                                ticket.status === "closed"
                                  ? "outline"
                                  : "default"
                              }
                              className={
                                ticket.status === "open"
                                  ? "bg-green-500/20 text-green-600 border-green-500/50"
                                  : ticket.status === "in_progress"
                                    ? "bg-blue-500/20 text-blue-600 border-blue-500/50"
                                    : ticket.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/50"
                                      : "bg-gray-500/20 text-gray-600 border-gray-500/50"
                              }
                            >
                              {ticket.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {ticket.message}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Ticket ID: {ticket.id}</span>
                          <div className="flex items-center space-x-3">
                            {ticket.responseCount > 0 && (
                              <span>
                                {ticket.responseCount} response
                                {ticket.responseCount !== 1 ? "s" : ""}
                              </span>
                            )}
                            {ticket.lastResponse && (
                              <span>
                                Last reply:{" "}
                                {new Date(
                                  ticket.lastResponse.created_at,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      No support tickets yet
                    </p>
                    <p>
                      When you submit a support request, it will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}
