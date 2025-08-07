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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  MapPin,
  Trophy,
  Gamepad2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

interface Event {
  id: string;
  name: string;
  description: string;
  type: "tournament" | "competition" | "community" | "maintenance";
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  currentParticipants: number;
  location?: string;
  serverType: string;
  prizes?: string;
  requirements?: string;
  createdAt: string;
  createdBy: string;
}

export default function EventsAdmin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "tournament" as Event["type"],
    status: "draft" as Event["status"],
    startDate: "",
    endDate: "",
    maxParticipants: "",
    location: "",
    serverType: "",
    prizes: "",
    requirements: "",
  });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/admin/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && isAdmin()) {
      fetchEvents();
    }
  }, [user, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEvent 
        ? `/api/admin/events/${editingEvent.id}`
        : '/api/admin/events';
      const method = editingEvent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingEvent) {
          setEvents(events.map(e => e.id === editingEvent.id ? data.event : e));
        } else {
          setEvents([...events, data.event]);
        }
        resetForm();
        setIsCreateDialogOpen(false);
        setEditingEvent(null);
      }
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId));
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "tournament",
      status: "draft",
      startDate: "",
      endDate: "",
      maxParticipants: "",
      location: "",
      serverType: "",
      prizes: "",
      requirements: "",
    });
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      type: event.type,
      status: event.status,
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate.slice(0, 16),
      maxParticipants: event.maxParticipants?.toString() || "",
      location: event.location || "",
      serverType: event.serverType,
      prizes: event.prizes || "",
      requirements: event.requirements || "",
    });
    setIsCreateDialogOpen(true);
  };

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "published": return "bg-blue-500";
      case "ongoing": return "bg-green-500";
      case "completed": return "bg-purple-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: Event["type"]) => {
    switch (type) {
      case "tournament": return <Trophy className="w-4 h-4" />;
      case "competition": return <Gamepad2 className="w-4 h-4" />;
      case "community": return <Users className="w-4 h-4" />;
      case "maintenance": return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-primary">Events Management</h1>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingEvent ? "Edit Event" : "Create New Event"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingEvent 
                      ? "Update the event details below."
                      : "Create a new event for the community."
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Event Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Event Type</Label>
                      <Select value={formData.type} onValueChange={(value: Event["type"]) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tournament">Tournament</SelectItem>
                          <SelectItem value="competition">Competition</SelectItem>
                          <SelectItem value="community">Community Event</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date & Time</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date & Time</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxParticipants">Max Participants (optional)</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: Event["status"]) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location (optional)</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Server address or location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serverType">Server Type</Label>
                      <Input
                        id="serverType"
                        value={formData.serverType}
                        onChange={(e) => setFormData({ ...formData, serverType: e.target.value })}
                        placeholder="e.g., PvP, Creative, Survival"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="prizes">Prizes (optional)</Label>
                    <Input
                      id="prizes"
                      value={formData.prizes}
                      onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
                      placeholder="Prize description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="requirements">Requirements (optional)</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      rows={2}
                      placeholder="Any special requirements or rules"
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingEvent(null);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingEvent ? "Update Event" : "Create Event"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Events Management</h1>
            <p className="text-muted-foreground">
              Manage tournaments, competitions, and community events
            </p>
          </div>

          {loading ? (
            <Card className="minecraft-panel">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Loading events...</p>
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            <Card className="minecraft-panel">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Events Created Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first event to get started with community engagement.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {events.map((event) => (
                <Card key={event.id} className="minecraft-panel">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(event.type)}
                            <CardTitle className="text-xl">{event.name}</CardTitle>
                          </div>
                          <Badge className={`${getStatusColor(event.status)} text-white`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">
                          {event.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(event)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Start</p>
                          <p>{new Date(event.startDate).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <div>
                          <p className="font-medium">End</p>
                          <p>{new Date(event.endDate).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Participants</p>
                          <p>
                            {event.currentParticipants}
                            {event.maxParticipants && ` / ${event.maxParticipants}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Gamepad2 className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Server Type</p>
                          <p>{event.serverType}</p>
                        </div>
                      </div>
                    </div>
                    
                    {(event.location || event.prizes) && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="grid md:grid-cols-2 gap-4">
                          {event.location && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <div>
                                <p className="font-medium">Location</p>
                                <p>{event.location}</p>
                              </div>
                            </div>
                          )}
                          {event.prizes && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Trophy className="w-4 h-4" />
                              <div>
                                <p className="font-medium">Prizes</p>
                                <p>{event.prizes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
