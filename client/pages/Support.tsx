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
import { Badge } from "@/components/ui/badge";
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Support Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get help with your account, report issues, or find answers to common questions.
          </p>
        </div>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="faq">Help Center</TabsTrigger>
            <TabsTrigger value="contact">Submit Ticket</TabsTrigger>
            <TabsTrigger value="tickets">
              My Tickets ({tickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-6">
            {/* Search */}
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Search Help Articles</CardTitle>
                <CardDescription>
                  Find quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="What can we help you with?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg p-6"
                />
              </CardContent>
            </Card>

            {/* Quick Help Categories */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="minecraft-panel hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-blue-600">Technical Support</CardTitle>
                  <CardDescription>
                    Client issues, loading problems, connectivity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Client won't load</p>
                    <p>• Connection issues</p>
                    <p>• Performance problems</p>
                    <p>• Browser compatibility</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="minecraft-panel hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-green-600">Account Help</CardTitle>
                  <CardDescription>
                    Password, settings, friends, profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Reset password</p>
                    <p>• Update profile</p>
                    <p>• Manage friends</p>
                    <p>• Privacy settings</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="minecraft-panel hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-purple-600">Community</CardTitle>
                  <CardDescription>
                    Forums, chat, reporting, guidelines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Community rules</p>
                    <p>• Report content</p>
                    <p>• Forum help</p>
                    <p>• Chat features</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Items */}
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  {filteredFAQs.length} {filteredFAQs.length === 1 ? "article" : "articles"} found
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
                          <span className="text-muted-foreground text-sm">
                            {expandedFAQ === item.id ? "−" : "+"}
                          </span>
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
                    <p className="text-lg font-medium mb-2">No results found</p>
                    <p>Try a different search term or contact support directly.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card className="minecraft-panel">
                <CardHeader>
                  <CardTitle>Submit Support Ticket</CardTitle>
                  <CardDescription>
                    Describe your issue and we'll help you resolve it
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                      <Label htmlFor="category">Issue Category</Label>
                      <Select
                        value={supportForm.category}
                        onValueChange={(value) =>
                          setSupportForm({ ...supportForm, category: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
                        disabled
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
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
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Detailed Description</Label>
                      <Textarea
                        id="message"
                        value={supportForm.message}
                        onChange={(e) =>
                          setSupportForm({
                            ...supportForm,
                            message: e.target.value,
                          })
                        }
                        placeholder="Please provide as much detail as possible about your issue..."
                        className="min-h-32"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submittingTicket}
                      className="w-full"
                    >
                      {submittingTicket ? "Submitting..." : "Submit Ticket"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Support Info */}
              <div className="space-y-6">
                <Card className="minecraft-panel">
                  <CardHeader>
                    <CardTitle>Response Times</CardTitle>
                    <CardDescription>
                      Expected response times by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Technical Issues</span>
                      <span className="font-medium">4-6 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Problems</span>
                      <span className="font-medium">2-4 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billing Questions</span>
                      <span className="font-medium">1-2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>General Inquiries</span>
                      <span className="font-medium">12-24 hours</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="minecraft-panel">
                  <CardHeader>
                    <CardTitle>Other Contact Methods</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link to="/forums">
                      <Button variant="outline" className="w-full">
                        Community Forums
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open("mailto:support@ueclub.com")}
                    >
                      Email Support
                    </Button>
                  </CardContent>
                </Card>

                <Card className="minecraft-panel">
                  <CardHeader>
                    <CardTitle>Before Contacting Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Check the FAQ section</li>
                      <li>• Search community forums</li>
                      <li>• Try clearing browser cache</li>
                      <li>• Include error messages</li>
                      <li>• Mention your browser version</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            <Card className="minecraft-panel">
              <CardHeader>
                <CardTitle>My Support Tickets</CardTitle>
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
                              Category: {supportCategories.find(
                                (c) => c.value === ticket.category,
                              )?.label || ticket.category}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge
                              variant={
                                ticket.status === "closed" ? "outline" : "default"
                              }
                              className={
                                ticket.status === "open"
                                  ? "bg-green-500/20 text-green-600"
                                  : ticket.status === "in_progress"
                                    ? "bg-blue-500/20 text-blue-600"
                                    : ticket.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-600"
                                      : "bg-gray-500/20 text-gray-600"
                              }
                            >
                              {ticket.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {ticket.message}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Ticket ID: {ticket.id}</span>
                          {ticket.responseCount > 0 && (
                            <span>
                              {ticket.responseCount} response{ticket.responseCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
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
