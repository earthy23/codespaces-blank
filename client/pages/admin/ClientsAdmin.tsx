import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Eye,
  Power,
  Play,
} from "lucide-react";
import { clientsApi } from "@/lib/api";

interface Client {
  id: string;
  name: string;
  version: string;
  description: string;
  type: "eaglercraft" | "modded" | "vanilla";
  enabled: boolean;
  downloadCount: number;
  fileSize: string;
  uploadedAt: string;
  uploader: string;
  features: string[];
  requirements: string;
  thumbnail?: string;
}

export default function ClientsAdmin() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    version: "",
    description: "",
    type: "eaglercraft" as const,
    enabled: true,
    features: "",
    requirements: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getAll(true); // admin=true to get all clients
      setClients(response.clients || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    }
  };

  const handleAddClient = async () => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a client file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const formDataObj = new FormData();
      formDataObj.append("file", uploadFile);
      formDataObj.append("name", formData.name);
      formDataObj.append("version", formData.version);
      formDataObj.append("description", formData.description);
      formDataObj.append("type", formData.type);
      formDataObj.append("enabled", formData.enabled.toString());
      formDataObj.append("features", formData.features);
      formDataObj.append("requirements", formData.requirements);

      await clientsApi.upload(formDataObj);

      toast({
        title: "Success",
        description: "Client uploaded successfully",
      });

      setShowAddDialog(false);
      resetForm();
      fetchClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload client",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async () => {
    if (!editingClient) return;

    try {
      await clientsApi.update(editingClient.id, {
        name: formData.name,
        version: formData.version,
        description: formData.description,
        type: formData.type,
        enabled: formData.enabled,
        features: formData.features.split(",").map((f) => f.trim()),
        requirements: formData.requirements,
      });

      toast({
        title: "Success",
        description: "Client updated successfully",
      });

      setEditingClient(null);
      resetForm();
      fetchClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await clientsApi.delete(clientId);

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });

      fetchClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const handleToggleClient = async (clientId: string) => {
    try {
      await clientsApi.toggle(clientId);

      toast({
        title: "Success",
        description: "Client status updated",
      });

      fetchClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle client status",
        variant: "destructive",
      });
    }
  };

  const handlePreviewClient = (clientId: string) => {
    const previewUrl = `/api/clients/${clientId}/play`;
    window.open(previewUrl, "_blank");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      version: "",
      description: "",
      type: "eaglercraft",
      enabled: true,
      features: "",
      requirements: "",
    });
    setUploadFile(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      version: client.version,
      description: client.description,
      type: client.type,
      enabled: client.enabled,
      features: client.features.join(", "),
      requirements: client.requirements,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">
            Manage Eaglercraft clients and downloads
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Upload a new Eaglercraft client for users to download
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Eaglercraft 1.8.8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      version: e.target.value,
                    }))
                  }
                  placeholder="e.g., 1.8.8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Client Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eaglercraft">Eaglercraft</SelectItem>
                    <SelectItem value="modded">Modded</SelectItem>
                    <SelectItem value="vanilla">Vanilla</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe this client and its features..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Input
                  id="features"
                  value={formData.features}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      features: e.target.value,
                    }))
                  }
                  placeholder="e.g., Multiplayer, Singleplayer, Texture Packs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">System Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requirements: e.target.value,
                    }))
                  }
                  placeholder="Browser compatibility, Java version, etc."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">
                  Client File (ZIP with folder containing index.html)
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept=".zip"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadFile.name} (
                    {formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, enabled: checked }))
                  }
                />
                <Label htmlFor="enabled">Enable client immediately</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddClient}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>
            Manage all available clients for download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading clients...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No clients uploaded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell>{client.version}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.type === "eaglercraft"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {client.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={client.enabled ? "default" : "secondary"}
                        >
                          {client.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.downloadCount}</TableCell>
                      <TableCell>{client.fileSize}</TableCell>
                      <TableCell>
                        {new Date(client.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(client)}
                            title="Edit Client"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewClient(client.id)}
                            title="Preview Client"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleClient(client.id)}
                            title="Toggle Status"
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Client
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{client.name}
                                  "? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteClient(client.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      {editingClient && (
        <Dialog
          open={!!editingClient}
          onOpenChange={() => setEditingClient(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update client information and settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Client Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-version">Version</Label>
                <Input
                  id="edit-version"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      version: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Client Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eaglercraft">Eaglercraft</SelectItem>
                    <SelectItem value="modded">Modded</SelectItem>
                    <SelectItem value="vanilla">Vanilla</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-features">
                  Features (comma-separated)
                </Label>
                <Input
                  id="edit-features"
                  value={formData.features}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      features: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-requirements">System Requirements</Label>
                <Textarea
                  id="edit-requirements"
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requirements: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, enabled: checked }))
                  }
                />
                <Label htmlFor="edit-enabled">Client enabled</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingClient(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditClient}>Update Client</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
