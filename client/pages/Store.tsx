import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShoppingBag,
  Crown,
  Star,
  Check,
  Palette,
  Upload,
  Loader2,
  Globe,
  Calendar,
  Diamond,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/ui/user-layout";

export default function Store() {
  const { user } = useAuth();
  const {
    products,
    currentTier,
    purchases,
    customizations,
    isLoading,
    purchaseProduct,
    updateCustomization,
    refreshData,
  } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customColor, setCustomColor] = useState(
    customizations.website_color || "#8b5cf6",
  );
  const [customBackground, setCustomBackground] = useState(
    customizations.website_background || "",
  );
  const [customTabTitle, setCustomTabTitle] = useState(
    customizations.website_tab_title || "",
  );
  const [customFavicon, setCustomFavicon] = useState(
    customizations.website_favicon || "",
  );
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handlePurchase = async (productId: string) => {
    try {
      setIsPurchasing(productId);
      const success = await purchaseProduct(productId);
      if (success) {
        toast({
          title: "Purchase Successful!",
          description:
            "Your subscription has been activated. Welcome to the VIP experience!",
        });
        // Refresh the page to show updated subscription status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: "Purchase Failed",
          description:
            "There was an error processing your purchase. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process purchase",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(null);
    }
  };

  const handleSaveCustomization = async (type: string, value: string) => {
    try {
      const success = await updateCustomization(type, value);
      if (success) {
        toast({
          title: "Customization Saved",
          description: "Your changes have been applied successfully!",
        });
      } else {
        toast({
          title: "Save Failed",
          description: "You need a VIP subscription to use customizations.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customization",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "background" | "avatar" | "resource",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check rank-based restrictions for resource files
    if (type === 'resource') {
      if (currentTier.tier === 'free') {
        toast({
          title: "VIP+ Required",
          description: "You need a VIP+ subscription to upload personal files",
          variant: "destructive",
        });
        return;
      }

      const maxFileSize = currentTier.tier === 'vip' ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for VIP, 50MB for VIP+/Legend
      const maxFiles = currentTier.tier === 'vip' ? 5 : 20; // 5 files for VIP, 20 for VIP+/Legend
      const currentFileCount = uploadedFiles.filter(f => f.type === 'resource').length;

      if (currentFileCount >= maxFiles) {
        toast({
          title: "File limit reached",
          description: `You can only upload ${maxFiles} files with your ${currentTier.tier.toUpperCase()} subscription`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxFileSize) {
        const maxSizeMB = maxFileSize / (1024 * 1024);
        toast({
          title: "File too large",
          description: `Please select a file smaller than ${maxSizeMB}MB`,
          variant: "destructive",
        });
        return;
      }
    } else {
      // Check file size for background/avatar (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
    }

    // Check file type
    const allowedTypes =
      type === "background"
        ? ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        : [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/zip",
            "application/x-zip-compressed",
          ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `Please select a valid ${type === "background" ? "image" : "file"} file`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/store/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (type === "background") {
          setCustomBackground(data.url);
          handleSaveCustomization("website_background", data.url);
        }

        setUploadedFiles((prev) => [...prev, { ...data, type }]);
        toast({
          title: "Upload Successful",
          description: "Your file has been uploaded successfully!",
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "vip":
        return Crown;
      case "vip_plus":
        return Star;
      case "legend":
        return Diamond;
      default:
        return ShoppingBag;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "vip":
        return "text-yellow-500";
      case "vip_plus":
        return "text-purple-500";
      case "legend":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
    }
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  if (!user) {
    return null;
  }

  // Data shows immediately from cache or fallback - no loading needed

  return (
    <UserLayout>
      <div className="max-w-6xl">
        {/* Store Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            UEC VIP Store
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features and enhance your experience with VIP
            subscriptions
          </p>

          {currentTier &&
            (currentTier.tier !== "free" || currentTier.isStaff) && (
              <div className="mt-4">
                <Badge
                  variant="outline"
                  className={`text-lg px-4 py-2 ${getTierColor(currentTier.tier)}`}
                >
                  {currentTier.isStaff
                    ? `${user?.role?.toUpperCase()} (Legend Features)`
                    : `${currentTier.tier === "vip_plus" ? "VIP++" : currentTier.tier.toUpperCase()} Member`}
                  {currentTier.subscription && !currentTier.isStaff && (
                    <span className="ml-2 text-xs opacity-70">
                      Until{" "}
                      {new Date(
                        currentTier.subscription.end_date,
                      ).toLocaleDateString()}
                    </span>
                  )}
                </Badge>
              </div>
            )}
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">VIP Plans</TabsTrigger>
            <TabsTrigger value="customize">Customization</TabsTrigger>
            <TabsTrigger value="history">Purchase History</TabsTrigger>
          </TabsList>

          {/* VIP Plans */}
          <TabsContent value="plans" className="mt-8">
            {products.length === 0 ? (
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">
                    Store Plans Loading...
                  </h3>
                  <p className="text-muted-foreground">
                    VIP plans will appear here once loaded
                  </p>
                  <Button
                    onClick={refreshData}
                    className="mt-4 minecraft-button"
                  >
                    <Loader2 className="w-4 h-4 mr-2" />
                    Retry Loading
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const TierIcon = getTierIcon(product.id);
                  const isCurrentTier = currentTier?.tier === product.id;
                  const isStaff = currentTier?.isStaff || false;

                  return (
                    <Card
                      key={product.id}
                      className={`minecraft-panel bg-card/50 border-2 shadow-lg hover:shadow-primary/10 relative ${
                        product.id === "vip_plus"
                          ? "ring-2 ring-primary/50"
                          : ""
                      } ${isCurrentTier ? "ring-2 ring-green-500/50" : ""}`}
                    >
                      {product.id === "vip_plus" && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground shadow-lg">
                            <Star className="w-3 h-3 mr-1" />
                            Most Popular
                          </Badge>
                        </div>
                      )}

                      {isCurrentTier && (
                        <div className="absolute -top-3 right-4">
                          <Badge className="bg-green-500 text-white shadow-lg">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="text-center">
                        <div
                          className={`w-16 h-16 rounded-full mx-auto mb-4 border-2 border-border flex items-center justify-center ${getTierColor(product.id)}`}
                        >
                          <TierIcon className="w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl">
                          {product.name}
                        </CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                        <div className="text-3xl font-bold text-primary">
                          ${product.price}
                          <span className="text-sm text-muted-foreground">
                            /month
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="font-semibold text-sm mb-3">
                            Features included:
                          </h4>
                          <ul className="space-y-2">
                            {product.features.map((feature, index) => (
                              <li
                                key={index}
                                className="flex items-start text-sm text-muted-foreground"
                              >
                                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">File Uploads</div>
                            <div className="text-muted-foreground">
                              {formatFileSize(product.limits.file_upload_size)}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Group Chat</div>
                            <div className="text-muted-foreground">
                              {product.limits.group_chat_members} members
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="font-medium">Server Ownership</div>
                            <div className="text-muted-foreground">
                              {product.limits.owned_servers} servers
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => handlePurchase(product.id)}
                          disabled={
                            isCurrentTier ||
                            isStaff ||
                            isPurchasing === product.id
                          }
                          className="w-full minecraft-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
                        >
                          {isPurchasing === product.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : isStaff ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Staff Access
                            </>
                          ) : isCurrentTier ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Current Plan
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4 mr-2" />
                              Upgrade Now
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Customization */}
          <TabsContent value="customize" className="mt-8">
            {currentTier &&
            (["vip", "vip_plus", "legend"].includes(currentTier.tier) ||
              currentTier.isStaff) ? (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Website Colors */}
                <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="w-5 h-5 text-primary" />
                      <span>Website Colors</span>
                    </CardTitle>
                    <CardDescription>
                      Customize the primary color scheme for your personal view
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="color">Primary Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="color"
                          type="color"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          placeholder="#8b5cf6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        handleSaveCustomization("website_color", customColor)
                      }
                      className="w-full minecraft-button"
                    >
                      Apply Color
                    </Button>
                  </CardContent>
                </Card>

                {/* Background Image */}
                <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="w-5 h-5 text-primary" />
                      <span>Background Image</span>
                    </CardTitle>
                    <CardDescription>
                      Upload or set a custom background image for your personal view (only you will see this)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="background-file">
                        Upload Background Image
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4">
                        <input
                          id="background-file"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "background")}
                          className="hidden"
                        />
                        <div
                          className="flex flex-col items-center justify-center cursor-pointer"
                          onClick={() =>
                            document.getElementById("background-file")?.click()
                          }
                        >
                          {uploadingFile ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          ) : (
                            <Upload className="w-8 h-8 text-muted-foreground" />
                          )}
                          <p className="text-sm text-muted-foreground mt-2">
                            {uploadingFile
                              ? "Uploading..."
                              : "Click to upload image (Max 10MB)"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supports: JPG, PNG, GIF, WebP
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center my-4">
                      <div className="flex-grow border-t border-border"></div>
                      <span className="px-3 text-sm text-muted-foreground">
                        or
                      </span>
                      <div className="flex-grow border-t border-border"></div>
                    </div>
                    <div>
                      <Label htmlFor="background">Image URL</Label>
                      <Input
                        id="background"
                        value={customBackground}
                        onChange={(e) => setCustomBackground(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={() =>
                        handleSaveCustomization(
                          "website_background",
                          customBackground,
                        )
                      }
                      className="w-full minecraft-button"
                      disabled={uploadingFile}
                    >
                      Apply Background
                    </Button>
                  </CardContent>
                </Card>

                {/* Personal File Uploads */}
                <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="w-5 h-5 text-primary" />
                      <span>Personal Files</span>
                      {currentTier.tier === 'free' && (
                        <Badge variant="outline" className="text-muted-foreground">
                          VIP+ Required
                        </Badge>
                      )}
                      {currentTier.tier === 'vip' && (
                        <Badge variant="outline" className="text-yellow-500">
                          VIP Access
                        </Badge>
                      )}
                      {(currentTier.tier === 'vip_plus' || currentTier.tier === 'legend') && (
                        <Badge variant="outline" className="text-purple-500">
                          Premium Access
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Upload resource packs, skins, and other personal files
                      {currentTier.tier === 'free' && ' (VIP+ subscription required)'}
                      {currentTier.tier === 'vip' && ' (Up to 5 files, 10MB each)'}
                      {(currentTier.tier === 'vip_plus' || currentTier.tier === 'legend') && ' (Up to 20 files, 50MB each)'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="resource-file">
                        Upload Personal Files
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4">
                        <input
                          id="resource-file"
                          type="file"
                          accept=".zip,.png,.jpg,.jpeg,.mcpack,.mcworld"
                          onChange={(e) => handleFileUpload(e, "resource")}
                          className="hidden"
                          disabled={currentTier.tier === 'free'}
                        />
                        <div
                          className={`flex flex-col items-center justify-center ${
                            currentTier.tier === 'free' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            if (currentTier.tier !== 'free') {
                              document.getElementById("resource-file")?.click()
                            }
                          }}
                        >
                          {uploadingFile ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          ) : (
                            <Upload className="w-8 h-8 text-muted-foreground" />
                          )}
                          <p className="text-sm text-muted-foreground mt-2">
                            {uploadingFile
                              ? "Uploading..."
                              : currentTier.tier === 'free'
                                ? 'VIP+ subscription required'
                                : `Click to upload files (Max ${currentTier.tier === 'vip' ? '10MB' : '50MB'})`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {currentTier.tier === 'free'
                              ? 'Upgrade to VIP+ to upload personal files'
                              : 'Supports: ZIP, PNG, JPG, MCPACK, MCWORLD'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {uploadedFiles.filter((f) => f.type === "resource").length >
                      0 && (
                      <div className="space-y-2">
                        <Label>Your Uploaded Files</Label>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {uploadedFiles
                            .filter((f) => f.type === "resource")
                            .map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                              >
                                <span className="truncate">
                                  {file.filename}
                                </span>
                                <Badge variant="outline">{file.size}</Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Legend-only features */}
                {(currentTier.tier === "legend" || currentTier.isStaff) && (
                  <>
                    {/* Tab Title */}
                    <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Globe className="w-5 h-5 text-orange-500" />
                          <span>Tab Title</span>
                          <Badge variant="outline" className="text-orange-500">
                            {currentTier.isStaff
                              ? "Staff Access"
                              : "Legend Only"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Customize the browser tab title for your personal view
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="tab-title">Custom Tab Title</Label>
                          <Input
                            id="tab-title"
                            value={customTabTitle}
                            onChange={(e) => setCustomTabTitle(e.target.value)}
                            placeholder="My Custom UEC Launcher"
                            className="mt-2"
                          />
                        </div>
                        <Button
                          onClick={() =>
                            handleSaveCustomization(
                              "website_tab_title",
                              customTabTitle,
                            )
                          }
                          className="w-full minecraft-button"
                        >
                          Apply Title
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Favicon */}
                    <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Star className="w-5 h-5 text-orange-500" />
                          <span>Custom Favicon</span>
                          <Badge variant="outline" className="text-orange-500">
                            {currentTier.isStaff
                              ? "Staff Access"
                              : "Legend Only"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Set a custom favicon for your browser tab (personal view only)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="favicon">Favicon URL</Label>
                          <Input
                            id="favicon"
                            value={customFavicon}
                            onChange={(e) => setCustomFavicon(e.target.value)}
                            placeholder="https://example.com/favicon.ico"
                            className="mt-2"
                          />
                        </div>
                        <Button
                          onClick={() =>
                            handleSaveCustomization(
                              "website_favicon",
                              customFavicon,
                            )
                          }
                          className="w-full minecraft-button"
                        >
                          Apply Favicon
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            ) : (
              <Alert>
                <Crown className="h-4 w-4" />
                <AlertDescription>
                  VIP subscription required to access customization features.{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate("/store")}
                  >
                    Upgrade now
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Purchase History */}
          <TabsContent value="history" className="mt-8">
            {purchases.length > 0 ? (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <Card
                    key={purchase.id}
                    className="minecraft-panel bg-card/50 border-2 border-border shadow-lg"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {purchase.product_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(purchase.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            ${purchase.price}
                          </div>
                          <Badge
                            variant={
                              purchase.status === "completed"
                                ? "default"
                                : purchase.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {purchase.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">
                    No Purchases Yet
                  </h3>
                  <p className="text-muted-foreground">
                    Your purchase history will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}
