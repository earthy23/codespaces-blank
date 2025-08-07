import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  Trophy,
  Plus
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { MinecraftBackground } from "@/components/ui/minecraft-background";



const eventTypeColors = {
  tournament: "bg-red-500 text-white",
  contest: "bg-blue-500 text-white",
  community: "bg-green-500 text-white",
  special: "bg-purple-500 text-white"
};

const eventTypeLabels = {
  tournament: "Tournament",
  contest: "Contest",
  community: "Community",
  special: "Special Event"
};

export default function Events() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString; // Simple format for now
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-green-500 text-white">Upcoming</Badge>;
      case 'ongoing':
        return <Badge className="bg-yellow-500 text-white">Live Now</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // In production, these would come from API/context
  const upcomingEvents: any[] = [];
  const completedEvents: any[] = [];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Events</h1>
            </div>
            {isAdmin() && (
              <Link to="/admin/events">
                <Button className="minecraft-button bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Events
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Events Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-foreground">Community Events</h1>
            <p className="text-lg text-muted-foreground">
              Join tournaments, contests, and community activities. Meet players and win amazing prizes!
            </p>
          </div>

          {/* Upcoming Events */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>

            {upcomingEvents.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="minecraft-panel">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge className={eventTypeColors[event.type as keyof typeof eventTypeColors]}>
                              {eventTypeLabels[event.type as keyof typeof eventTypeLabels]}
                            </Badge>
                            {getStatusBadge(event.status)}
                          </div>
                          <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                          <CardDescription>{event.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-primary" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-primary" />
                          <span>{formatTime(event.time)}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-primary" />
                          <span>{event.server}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-primary" />
                          <span>{event.participants}/{event.maxParticipants}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center">
                          <Trophy className="w-4 h-4 mr-2" />
                          Prizes
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {event.prizes.map((prize, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {prize}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        className="w-full minecraft-button bg-primary text-primary-foreground"
                        disabled={event.participants >= event.maxParticipants}
                      >
                        {event.participants >= event.maxParticipants ? 'Event Full' : 'Join Event'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="minecraft-panel">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
                  <p className="text-muted-foreground">
                    Check back soon for new tournaments and community events!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Events */}
          {completedEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Recent Events</h2>
              <div className="space-y-4">
                {completedEvents.map((event) => (
                  <Card key={event.id} className="minecraft-panel opacity-75">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge className={eventTypeColors[event.type as keyof typeof eventTypeColors]}>
                              {eventTypeLabels[event.type as keyof typeof eventTypeLabels]}
                            </Badge>
                            {getStatusBadge(event.status)}
                          </div>
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.date)} • {event.participants} participants
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="minecraft-border">
                          View Results
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Event Info */}
          <Card className="minecraft-panel mt-8">
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
              <CardDescription>
                How to participate in UEC events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">How to Join</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Click "Join Event" on any upcoming event</li>
                    <li>• Be online 15 minutes before event starts</li>
                    <li>• Follow event rules and guidelines</li>
                    <li>• Have fun and play fair!</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Event Types</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <strong>Tournaments:</strong> Competitive PvP battles</li>
                    <li>• <strong>Contests:</strong> Building and creative challenges</li>
                    <li>• <strong>Community:</strong> Social events and mini-games</li>
                    <li>• <strong>Special:</strong> Seasonal and holiday events</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
