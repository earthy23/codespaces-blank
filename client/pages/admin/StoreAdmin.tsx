import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  DollarSign,
  Tag,
  Save,
  Server,
  Settings,
  Crown,
  Zap,
  MessageSquare
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useStore, StoreItem } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function StoreAdmin() {
  const { user, isAdmin } = useAuth();
  const { items, addItem, updateItem, deleteItem } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "rank" as "rank" | "cosmetic" | "feature" | "server",
    features: [""],
    tebexId: "",
    active: true,
    order: 1,
    imageUrl: "",
    serverFeatures: {
      chatFeatures: [] as string[],
      permissions: [] as string[],
      roles: [] as string[],
      channels: [] as string[]
    }
  });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/admin");
    }
  }, [user, isAdmin, navigate]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "rank",
      features: [""],
      tebexId: "",
      active: true,
      order: 1,
      imageUrl: "",
      serverFeatures: {
        chatFeatures: [],
        permissions: [],
        roles: [],
        channels: []
      }
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleEdit = (item: StoreItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      features: item.features,
      tebexId: item.tebexId || "",
      active: item.active,
      order: item.order,
      imageUrl: item.imageUrl || "",
      serverFeatures: (item as any).serverFeatures || {
        chatFeatures: [],
        permissions: [],
        roles: [],
        channels: []
      }
    });
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const itemData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== "")
    };

    if (editingItem) {
      updateItem(editingItem.id, itemData);
      toast({
        title: "Item Updated",
        description: "Store item has been updated successfully.",
      });
    } else {
      addItem(itemData);
      toast({
        title: "Item Added",
        description: "New store item has been added successfully.",
      });
    }
    
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteItem(id);
      toast({
        title: "Item Deleted",
        description: "Store item has been removed.",
      });
    }
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
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
              <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-primary">Store Management</h1>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="minecraft-button bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Tebex Integration Status */}
          <Card className="minecraft-panel mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="w-5 h-5" />
                <span>Tebex Integration</span>
              </CardTitle>
              <CardDescription>
                Configure your Tebex store integration for payment processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="tebexUrl">Tebex Store URL</Label>
                  <Input
                    id="tebexUrl"
                    placeholder="https://yourstore.tebex.io"
                    className="minecraft-input"
                  />
                </div>
                <div>
                  <Label htmlFor="tebexSecret">Tebex Webhook Secret</Label>
                  <Input
                    id="tebexSecret"
                    type="password"
                    placeholder="Your webhook secret"
                    className="minecraft-input"
                  />
                </div>
              </div>
              <Button className="mt-4 minecraft-button bg-primary text-primary-foreground">
                Save Tebex Settings
              </Button>
            </CardContent>
          </Card>

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="minecraft-panel mb-8">
              <CardHeader>
                <CardTitle>
                  {editingItem ? "Edit Store Item" : "Add New Store Item"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Item Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="minecraft-input"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="minecraft-input"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="minecraft-input"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="minecraft-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rank">Rank</SelectItem>
                          <SelectItem value="cosmetic">Cosmetic</SelectItem>
                          <SelectItem value="feature">Feature</SelectItem>
                          <SelectItem value="server">Server Features</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tebexId">Tebex Package ID</Label>
                      <Input
                        id="tebexId"
                        value={formData.tebexId}
                        onChange={(e) => setFormData({ ...formData, tebexId: e.target.value })}
                        className="minecraft-input"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="order">Display Order</Label>
                      <Input
                        id="order"
                        type="number"
                        min="1"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                        className="minecraft-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Features</Label>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            placeholder="Feature description"
                            className="minecraft-input"
                          />
                          {formData.features.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFeature(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addFeature}
                        className="minecraft-border"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Feature
                      </Button>
                    </div>
                  </div>

                  {/* Server Features Configuration */}
                  {formData.category === "server" && (
                    <Card className="minecraft-panel">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Server className="w-5 h-5" />
                          <span>Server Features Configuration</span>
                        </CardTitle>
                        <CardDescription>
                          Configure what server features this package includes
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Chat Features */}
                        <div>
                          <Label className="flex items-center space-x-2 mb-3">
                            <MessageSquare className="w-4 h-4" />
                            <span>Chat Features</span>
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['Private Messages', 'Group Chats', 'Voice Chat Access', 'Priority Speaker', 'Custom Emotes', 'Message History'].map(feature => (
                              <label key={feature} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.serverFeatures.chatFeatures.includes(feature)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        serverFeatures: {
                                          ...formData.serverFeatures,
                                          chatFeatures: [...formData.serverFeatures.chatFeatures, feature]
                                        }
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        serverFeatures: {
                                          ...formData.serverFeatures,
                                          chatFeatures: formData.serverFeatures.chatFeatures.filter(f => f !== feature)
                                        }
                                      });
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{feature}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Permissions */}
                        <div>
                          <Label className="flex items-center space-x-2 mb-3">
                            <Shield className="w-4 h-4" />
                            <span>Permissions</span>
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['Kick Members', 'Ban Members', 'Manage Channels', 'Manage Roles', 'Admin Access', 'Server Settings'].map(permission => (
                              <label key={permission} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.serverFeatures.permissions.includes(permission)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        serverFeatures: {
                                          ...formData.serverFeatures,
                                          permissions: [...formData.serverFeatures.permissions, permission]
                                        }
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        serverFeatures: {
                                          ...formData.serverFeatures,
                                          permissions: formData.serverFeatures.permissions.filter(p => p !== permission)
                                        }
                                      });
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{permission}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Roles */}
                        <div>
                          <Label className="flex items-center space-x-2 mb-3">
                            <Crown className="w-4 h-4" />
                            <span>Special Roles</span>
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['VIP Role', 'Moderator Role', 'Premium Role', 'Supporter Role', 'Beta Tester Role', 'Content Creator Role'].map(role => (
                              <label key={role} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.serverFeatures.roles.includes(role)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        serverFeatures: {
                                          ...formData.serverFeatures,
                                          roles: [...formData.serverFeatures.roles, role]
                                        }
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        serverFeatures: {
                                          ...formData.serverFeatures,
                                          roles: formData.serverFeatures.roles.filter(r => r !== role)
                                        }
                                      });
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Channel Access */}
                        <div>
                          <Label className="flex items-center space-x-2 mb-3">
                            <Zap className="w-4 h-4" />
                            <span>Special Channel Access</span>
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['VIP Channels', 'Staff Channels', 'Premium Voice', 'Beta Channels', 'Event Channels', 'Private Lounges'].map(channel => (
                              <label key={channel} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.serverFeatures.channels.includes(channel)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        serverFeatures: {
                                          ...formData.serverFeatures,
                                          channels: [...formData.serverFeatures.channels, channel]
                                        }
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        serverFeatures: {
                                          ...formData.serverFeatures,
                                          channels: formData.serverFeatures.channels.filter(c => c !== channel)
                                        }
                                      });
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{channel}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label>Active (visible in store)</Label>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button 
                      type="submit"
                      className="minecraft-button bg-primary text-primary-foreground"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingItem ? "Update Item" : "Add Item"}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="minecraft-border"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Store Items List */}
          <Card className="minecraft-panel">
            <CardHeader>
              <CardTitle>Store Items ({items.length})</CardTitle>
              <CardDescription>
                Manage all store items and their settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="minecraft-panel">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{item.name}</h3>
                            <Badge variant={item.active ? "default" : "secondary"}>
                              {item.active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              <Tag className="w-3 h-3 mr-1" />
                              {item.category}
                            </Badge>
                            <Badge variant="outline">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${item.price}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{item.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {item.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          {item.tebexId && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Tebex ID: {item.tebexId}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="minecraft-border"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="minecraft-border"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No store items yet. Add your first item to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
