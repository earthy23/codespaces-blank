import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Globe, Plus, Trash2, CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface Domain {
  id: string;
  domain: string;
  status: 'active' | 'pending' | 'blocked';
  verified: boolean;
  ssl_enabled: boolean;
  added_at: string;
  verified_at?: string;
  notes?: string;
}

interface DomainStats {
  total: number;
  active: number;
  pending: number;
  blocked: number;
}

export default function DomainsAdmin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [stats, setStats] = useState<DomainStats>({
    total: 0,
    active: 0,
    pending: 0,
    blocked: 0
  });
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newDomainNotes, setNewDomainNotes] = useState('');

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/login");
    } else {
      loadDomains();
    }
  }, [user, navigate]);

  const loadDomains = () => {
    // Load from localStorage for demo - in production this would be from API
    const savedDomains = localStorage.getItem('allowed_domains');
    const domainList = savedDomains ? JSON.parse(savedDomains) : [
      {
        id: '1',
        domain: 'localhost',
        status: 'active',
        verified: true,
        ssl_enabled: false,
        added_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        notes: 'Default development domain'
      },
      {
        id: '2',
        domain: '127.0.0.1',
        status: 'active',
        verified: true,
        ssl_enabled: false,
        added_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        notes: 'Local IP address'
      }
    ];

    setDomains(domainList);
    
    // Calculate stats
    const stats = {
      total: domainList.length,
      active: domainList.filter((d: Domain) => d.status === 'active').length,
      pending: domainList.filter((d: Domain) => d.status === 'pending').length,
      blocked: domainList.filter((d: Domain) => d.status === 'blocked').length
    };
    
    setStats(stats);
  };

  const saveDomains = (domainList: Domain[]) => {
    localStorage.setItem('allowed_domains', JSON.stringify(domainList));
    setDomains(domainList);
    
    // Update stats
    const stats = {
      total: domainList.length,
      active: domainList.filter(d => d.status === 'active').length,
      pending: domainList.filter(d => d.status === 'pending').length,
      blocked: domainList.filter(d => d.status === 'blocked').length
    };
    
    setStats(stats);
  };

  const addDomain = () => {
    if (!newDomain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name.",
        variant: "destructive",
      });
      return;
    }

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(newDomain);
    
    if (!domainRegex.test(newDomain) && !isIP) {
      toast({
        title: "Error",
        description: "Please enter a valid domain name or IP address.",
        variant: "destructive",
      });
      return;
    }

    // Check if domain already exists
    const exists = domains.some(d => d.domain.toLowerCase() === newDomain.toLowerCase());
    if (exists) {
      toast({
        title: "Error",
        description: "This domain is already in the list.",
        variant: "destructive",
      });
      return;
    }

    const domain: Domain = {
      id: Date.now().toString(),
      domain: newDomain.toLowerCase(),
      status: 'pending',
      verified: false,
      ssl_enabled: false,
      added_at: new Date().toISOString(),
      notes: newDomainNotes.trim() || undefined
    };

    const updatedDomains = [...domains, domain];
    saveDomains(updatedDomains);

    setNewDomain('');
    setNewDomainNotes('');
    setShowAddDialog(false);

    toast({
      title: "Domain added",
      description: `${newDomain} has been added to the allowed domains list.`,
    });
  };

  const removeDomain = (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    const updatedDomains = domains.filter(d => d.id !== domainId);
    saveDomains(updatedDomains);

    toast({
      title: "Domain removed",
      description: `${domain.domain} has been removed from the allowed domains list.`,
    });
  };

  const toggleDomainStatus = (domainId: string) => {
    const updatedDomains = domains.map(domain => {
      if (domain.id === domainId) {
        const newStatus = domain.status === 'active' ? 'blocked' : 'active';
        return {
          ...domain,
          status: newStatus,
          verified: newStatus === 'active' ? true : domain.verified,
          verified_at: newStatus === 'active' ? new Date().toISOString() : domain.verified_at
        };
      }
      return domain;
    });

    saveDomains(updatedDomains);

    const domain = domains.find(d => d.id === domainId);
    toast({
      title: "Domain status updated",
      description: `${domain?.domain} is now ${updatedDomains.find(d => d.id === domainId)?.status}.`,
    });
  };

  const verifyDomain = (domainId: string) => {
    const updatedDomains = domains.map(domain => {
      if (domain.id === domainId) {
        return {
          ...domain,
          verified: true,
          verified_at: new Date().toISOString(),
          status: 'active' as const
        };
      }
      return domain;
    });

    saveDomains(updatedDomains);

    const domain = domains.find(d => d.id === domainId);
    toast({
      title: "Domain verified",
      description: `${domain?.domain} has been verified and activated.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
      case 'blocked': return 'text-red-600 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-600 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertTriangle className="w-4 h-4" />;
      case 'blocked': return <XCircle className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>
            <h1 className="text-2xl font-bold text-primary">Domain Management</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Domain Management</h1>
              <p className="text-muted-foreground">Manage allowed domains for multi-domain deployment</p>
            </div>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="minecraft-button bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent className="minecraft-panel">
              <DialogHeader>
                <DialogTitle>Add New Domain</DialogTitle>
                <DialogDescription>
                  Add a new domain to the allowed domains list for multi-domain deployment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain Name</Label>
                  <Input
                    id="domain"
                    placeholder="example.com or 192.168.1.100"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="minecraft-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Production server, Testing environment, etc."
                    value={newDomainNotes}
                    onChange={(e) => setNewDomainNotes(e.target.value)}
                    className="minecraft-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="minecraft-button">
                  Cancel
                </Button>
                <Button onClick={addDomain} className="minecraft-button bg-primary text-primary-foreground">
                  Add Domain
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Domain Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="minecraft-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Domains</p>
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                </div>
                <Globe className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="minecraft-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                  <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="minecraft-panel border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-600">Security Notice</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Only add trusted domains to this list. The application will only accept requests from these domains. 
                  This helps prevent unauthorized access and cross-origin attacks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domains List */}
        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>Allowed Domains</CardTitle>
            <CardDescription>
              Domains that are allowed to access this UEC Launcher instance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {domains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No domains configured</p>
                <p className="text-sm">Add your first domain to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {domains.map((domain) => (
                  <div key={domain.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(domain.status)}
                        <div>
                          <h4 className="font-medium">{domain.domain}</h4>
                          {domain.notes && (
                            <p className="text-sm text-muted-foreground">{domain.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Added: {new Date(domain.added_at).toLocaleDateString()}
                            {domain.verified_at && (
                              <> • Verified: {new Date(domain.verified_at).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(domain.status)}>
                        {domain.status}
                      </Badge>
                      
                      {domain.verified && (
                        <Badge className="text-green-600 bg-green-500/10 border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}

                      <div className="flex items-center space-x-2">
                        {domain.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => verifyDomain(domain.id)}
                            className="minecraft-button bg-green-600 text-white hover:bg-green-700"
                          >
                            Verify
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant={domain.status === 'active' ? 'destructive' : 'default'}
                          onClick={() => toggleDomainStatus(domain.id)}
                          className="minecraft-button"
                        >
                          {domain.status === 'active' ? 'Block' : 'Activate'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeDomain(domain.id)}
                          className="minecraft-button text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="minecraft-panel">
          <CardHeader>
            <CardTitle>Deployment Instructions</CardTitle>
            <CardDescription>
              How to deploy UEC Launcher on multiple domains
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Add your production domain</h4>
              <p className="text-sm text-muted-foreground">
                Add your production domain (e.g., yourdomain.com) to the allowed domains list above.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Configure DNS</h4>
              <p className="text-sm text-muted-foreground">
                Point your domain's DNS A record to your VPS IP address.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Set up SSL (Recommended)</h4>
              <p className="text-sm text-muted-foreground">
                Use Certbot or Cloudflare to enable HTTPS for your domain.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">4. Update environment variables</h4>
              <p className="text-sm text-muted-foreground">
                Set the ALLOWED_DOMAINS environment variable on your server to match the domains configured here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
