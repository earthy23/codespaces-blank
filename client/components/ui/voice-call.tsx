import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Headphones,
  HeadphonesIcon,
  Volume2,
  VolumeX,
  Settings,
  Users,
  Crown,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

interface VoiceCallProps {
  channel: any;
  server: any;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onMute: () => void;
  onDeafen: () => void;
  isMuted: boolean;
  isDeafened: boolean;
}

interface VoiceParticipant {
  id: string;
  username: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  roles: string[];
}

export function VoiceCall({
  channel,
  server,
  isConnected,
  onConnect,
  onDisconnect,
  onMute,
  onDeafen,
  isMuted,
  isDeafened
}: VoiceCallProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Mock participants for demonstration
  useEffect(() => {
    if (isConnected) {
      const mockParticipants: VoiceParticipant[] = [
        {
          id: user!.id,
          username: user!.username,
          avatar: user!.avatar,
          isMuted,
          isDeafened,
          isSpeaking: false,
          roles: ['member']
        },
        {
          id: 'user-2',
          username: 'Player1',
          avatar: undefined,
          isMuted: false,
          isDeafened: false,
          isSpeaking: Math.random() > 0.7,
          roles: ['member']
        },
        {
          id: 'user-3',
          username: 'Moderator',
          avatar: undefined,
          isMuted: false,
          isDeafened: false,
          isSpeaking: Math.random() > 0.8,
          roles: ['moderator']
        }
      ];
      setParticipants(mockParticipants);
    } else {
      setParticipants([]);
    }
  }, [isConnected, user, isMuted, isDeafened]);

  // Mock audio level simulation
  useEffect(() => {
    if (isConnected && !isMuted) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isConnected, isMuted]);

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('owner')) return <Crown className="w-3 h-3 text-yellow-500" />;
    if (roles.includes('admin') || roles.includes('moderator')) return <Shield className="w-3 h-3 text-blue-500" />;
    return null;
  };

  const getRoleColor = (roles: string[]) => {
    if (roles.includes('owner')) return 'border-yellow-500';
    if (roles.includes('admin') || roles.includes('moderator')) return 'border-blue-500';
    return 'border-gray-500';
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center mb-8">
          <Volume2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Voice Channel</h2>
          <p className="text-muted-foreground mb-1">
            {channel.name} in {server.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Click connect to join the voice channel
          </p>
        </div>
        
        <Button onClick={onConnect} size="lg" className="bg-green-600 hover:bg-green-700">
          <Phone className="w-5 h-5 mr-2" />
          Connect to Voice
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Voice Channel Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="font-semibold">{channel.name}</h3>
              <p className="text-sm text-muted-foreground">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/20 text-green-500">
            Connected
          </Badge>
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {participants.map((participant) => (
            <Card key={participant.id} className={`transition-all duration-200 ${
              participant.isSpeaking ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className={`w-10 h-10 border-2 ${
                      participant.isSpeaking ? 'border-green-500' : getRoleColor(participant.roles)
                    }`}>
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>
                        {participant.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {participant.isSpeaking && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{participant.username}</span>
                      {getRoleIcon(participant.roles)}
                      {participant.id === user!.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      {participant.isMuted && (
                        <MicOff className="w-3 h-3 text-red-500" />
                      )}
                      {participant.isDeafened && (
                        <HeadphonesIcon className="w-3 h-3 text-red-500" />
                      )}
                      {participant.isSpeaking && !participant.isMuted && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-green-500">Speaking</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voice level indicator */}
                  {participant.id === user!.id && !isMuted && (
                    <div className="w-2 h-8 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="w-full bg-green-500 transition-all duration-100"
                        style={{ height: `${audioLevel}%`, transform: 'translateY(100%)' }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="flex items-center justify-center space-x-3">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            onClick={onMute}
            className="w-12 h-12 rounded-full"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isDeafened ? "destructive" : "outline"}
            size="lg"
            onClick={onDeafen}
            className="w-12 h-12 rounded-full"
          >
            {isDeafened ? <VolumeX className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 rounded-full"
          >
            <Settings className="w-5 h-5" />
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            onClick={onDisconnect}
            className="w-12 h-12 rounded-full"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="text-center mt-3">
          <p className="text-xs text-muted-foreground">
            {isMuted && isDeafened ? 'Muted & Deafened' : 
             isMuted ? 'Muted' : 
             isDeafened ? 'Deafened' : 
             'Connected'}
          </p>
        </div>
      </div>

      {/* Voice Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Settings</DialogTitle>
            <DialogDescription>
              Configure your voice call settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Input Device</h4>
              <select className="w-full p-2 border rounded-md bg-background">
                <option>Default - Built-in Microphone</option>
                <option>USB Headset Microphone</option>
              </select>
            </div>
            <div>
              <h4 className="font-medium mb-2">Output Device</h4>
              <select className="w-full p-2 border rounded-md bg-background">
                <option>Default - Built-in Speakers</option>
                <option>USB Headset</option>
              </select>
            </div>
            <div>
              <h4 className="font-medium mb-2">Voice Activity</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="voiceActivity" defaultChecked />
                  <span>Voice Activity (Automatic)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="voiceActivity" />
                  <span>Push to Talk</span>
                </label>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VoiceCall;
