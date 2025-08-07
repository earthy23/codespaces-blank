import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./auth";
import { cacheManager, CACHE_KEYS } from "./cache-manager";
import { useWebSocket } from "./websocket-manager";

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
  limits: {
    file_upload_size: number;
    group_chat_members: number;
    owned_servers: number;
  };
}

export interface UserSubscription {
  id: number;
  subscription_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface UserTier {
  tier: "free" | "vip" | "vip_plus" | "legend";
  subscription?: UserSubscription;
  limits: {
    file_upload_size: number;
    group_chat_members: number;
    owned_servers: number;
  };
}

export interface Purchase {
  id: number;
  product_id: string;
  product_name: string;
  price: number;
  status: "pending" | "completed" | "failed" | "refunded";
  created_at: string;
  completed_at?: string;
}

export interface UserCustomizations {
  website_color?: string;
  website_background?: string;
  website_tab_title?: string;
  website_favicon?: string;
}

interface StoreContextType {
  products: StoreProduct[];
  currentTier: UserTier | null;
  purchases: Purchase[];
  customizations: UserCustomizations;
  isLoading: boolean;
  purchaseProduct: (
    productId: string,
    paymentMethod?: string,
  ) => Promise<boolean>;
  updateCustomization: (
    settingType: string,
    settingValue: string,
  ) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const { subscribe } = useWebSocket();

  // Fallback products in case API fails
  const fallbackProducts: StoreProduct[] = [
    {
      id: "vip",
      name: "VIP",
      description: "Enhanced features for power users",
      price: 9.99,
      duration_days: 30,
      features: [
        "File uploads up to 50MB",
        "Custom website colors and background",
        "Priority support",
        "VIP badge in chat and forums",
        "Access to VIP-only channels",
      ],
      limits: {
        file_upload_size: 50 * 1024 * 1024,
        group_chat_members: 10,
        owned_servers: 3,
      },
    },
    {
      id: "vip_plus",
      name: "VIP++",
      description: "All VIP features plus premium voice and early access",
      price: 19.99,
      duration_days: 30,
      features: [
        "All VIP features included",
        "Better quality voice calls",
        "Early access to new features",
        "VIP++ exclusive badge",
        "Advanced voice controls",
        "Priority in voice channels",
      ],
      limits: {
        file_upload_size: 50 * 1024 * 1024,
        group_chat_members: 10,
        owned_servers: 3,
      },
    },
    {
      id: "legend",
      name: "Legend",
      description: "Ultimate experience with maximum features",
      price: 39.99,
      duration_days: 30,
      features: [
        "All VIP and VIP++ features",
        "Custom website tab name and favicon",
        "Group chats with up to 30 people",
        "Can own up to 5 servers on server list",
        "Legend exclusive badge and perks",
        "Custom profile themes",
        "Priority in all features",
      ],
      limits: {
        file_upload_size: 50 * 1024 * 1024,
        group_chat_members: 30,
        owned_servers: 5,
      },
    },
  ];

  const [products, setProducts] = useState<StoreProduct[]>(
    () => cacheManager.get(CACHE_KEYS.STORE_PRODUCTS) || fallbackProducts,
  );
  const [currentTier, setCurrentTier] = useState<UserTier | null>(() =>
    user ? cacheManager.get(CACHE_KEYS.STORE_SUBSCRIPTION(user.id)) : null,
  );
  const [purchases, setPurchases] = useState<Purchase[]>(() =>
    user ? cacheManager.get(CACHE_KEYS.STORE_PURCHASES(user.id)) || [] : [],
  );
  const [customizations, setCustomizations] = useState<UserCustomizations>(
    () =>
      user
        ? cacheManager.get(CACHE_KEYS.STORE_CUSTOMIZATIONS(user.id)) || {}
        : {},
  );
  const [isLoading, setIsLoading] = useState(false); // Never show loading - always show data immediately

  // Load all store data - cache-first approach
  const loadStoreData = useCallback(async () => {
    if (!user || !token) return;

    // Check cache first and set immediately if available
    const cachedProducts = cacheManager.get(CACHE_KEYS.STORE_PRODUCTS);
    const cachedTier = cacheManager.get(CACHE_KEYS.STORE_SUBSCRIPTION(user.id));
    const cachedPurchases = cacheManager.get(
      CACHE_KEYS.STORE_PURCHASES(user.id),
    );
    const cachedCustomizations = cacheManager.get(
      CACHE_KEYS.STORE_CUSTOMIZATIONS(user.id),
    );

    if (cachedProducts) setProducts(cachedProducts);
    if (cachedTier) setCurrentTier(cachedTier);
    if (cachedPurchases) setPurchases(cachedPurchases);
    if (cachedCustomizations) setCustomizations(cachedCustomizations);

    try {
      // No timeout - let it complete in background
      const controller = new AbortController();

      try {
        const [productsRes, tierRes, purchasesRes, customizationsRes] =
          await Promise.all([
            fetch("/api/store/products", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            }),
            fetch("/api/store/subscription", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            }),
            fetch("/api/store/purchases", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            }),
            fetch("/api/store/customizations", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            }),
          ]);


        if (productsRes.ok) {
          const data = await productsRes.json();
          const products = data.products || fallbackProducts;
          const tier = data.currentTier || null;

          setProducts(products);
          setCurrentTier(tier);

          // Cache the data
          cacheManager.set(CACHE_KEYS.STORE_PRODUCTS, products);
          if (tier)
            cacheManager.set(CACHE_KEYS.STORE_SUBSCRIPTION(user.id), tier);
        } else {
          console.warn("Products API failed, using fallback products");
          if (!cachedProducts) setProducts(fallbackProducts);
        }

        if (tierRes.ok) {
          const data = await tierRes.json();
          setCurrentTier(data);
          cacheManager.set(CACHE_KEYS.STORE_SUBSCRIPTION(user.id), data);
        } else {
          console.warn("Tier API failed, using cached or fallback tier");
          if (!cachedTier) {
            const fallbackTier = {
              tier: "free",
              limits: {
                file_upload_size: 10 * 1024 * 1024,
                group_chat_members: 10,
                owned_servers: 3,
              },
            };
            setCurrentTier(fallbackTier);
          }
        }

        if (purchasesRes.ok) {
          const data = await purchasesRes.json();
          const purchases = data.purchases || [];
          setPurchases(purchases);
          cacheManager.set(CACHE_KEYS.STORE_PURCHASES(user.id), purchases);
        } else {
          console.warn("Purchases API failed");
          if (!cachedPurchases) setPurchases([]);
        }

        if (customizationsRes.ok) {
          const data = await customizationsRes.json();
          const customizations = data.customizations || {};
          setCustomizations(customizations);
          cacheManager.set(
            CACHE_KEYS.STORE_CUSTOMIZATIONS(user.id),
            customizations,
          );
        } else {
          console.warn("Customizations API failed");
          if (!cachedCustomizations) setCustomizations({});
        }
      } catch (fetchError) {
        console.warn("Store API calls failed:", fetchError.message);
        // Data already set from cache or fallback - no need to set again
      }
    } catch (error) {
      console.error("Error loading store data:", error);
      // Data already set from cache or fallback - no error state needed
    }
  }, [user, token]);

  // Initialize data when user logs in
  useEffect(() => {
    if (user && token) {
      // Set fallback data immediately if no cached data
      const cachedProducts = cacheManager.get(CACHE_KEYS.STORE_PRODUCTS);
      const cachedTier = cacheManager.get(CACHE_KEYS.STORE_SUBSCRIPTION(user.id));

      if (!cachedProducts) setProducts(fallbackProducts);
      if (!cachedTier) {
        setCurrentTier({
          tier: "free",
          limits: {
            file_upload_size: 10 * 1024 * 1024,
            group_chat_members: 10,
            owned_servers: 3,
          },
        });
      }

      // Load fresh data in background
      loadStoreData();
    } else {
      // Clear data when user logs out
      setProducts([]);
      setCurrentTier(null);
      setPurchases([]);
      setCustomizations({});
    }
  }, [user, token, loadStoreData]);

  // Subscribe to WebSocket store updates
  useEffect(() => {
    if (!user) return;

    const unsubscribers = [
      // Subscription updates
      subscribe("store:subscription_updated", (data) => {
        if (data.userId === user.id) {
          setCurrentTier(data.subscription);
          cacheManager.set(
            CACHE_KEYS.STORE_SUBSCRIPTION(user.id),
            data.subscription,
          );
        }
      }),

      // Purchase completed
      subscribe("store:purchase_completed", (data) => {
        if (data.userId === user.id) {
          loadStoreData(); // Refresh all store data
        }
      }),

      // Customization updates
      subscribe("store:customization_updated", (data) => {
        if (data.userId === user.id) {
          setCustomizations((prev) => ({
            ...prev,
            [data.settingType]: data.settingValue,
          }));

          // Update cache
          const newCustomizations = {
            ...customizations,
            [data.settingType]: data.settingValue,
          };
          cacheManager.set(
            CACHE_KEYS.STORE_CUSTOMIZATIONS(user.id),
            newCustomizations,
          );
        }
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [user, subscribe, customizations]);

  const purchaseProduct = async (
    productId: string,
    paymentMethod = "mock",
  ): Promise<boolean> => {
    if (!user || !token) return false;

    try {
      const response = await fetch("/api/store/purchase", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, paymentMethod }),
      });

      if (response.ok) {
        // Wait a moment for the purchase to process, then refresh data
        setTimeout(() => {
          loadStoreData();
        }, 2000);
        return true;
      } else {
        const errorData = await response.json();
        console.error("Purchase error:", errorData.error);
        return false;
      }
    } catch (error) {
      console.error("Error purchasing product:", error);
      return false;
    }
  };

  const updateCustomization = async (
    settingType: string,
    settingValue: string,
  ): Promise<boolean> => {
    if (!user || !token) return false;

    try {
      const response = await fetch("/api/store/customizations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settingType, settingValue }),
      });

      if (response.ok) {
        // Update local state
        setCustomizations((prev) => ({
          ...prev,
          [settingType]: settingValue,
        }));
        return true;
      } else {
        const errorData = await response.json();
        console.error("Customization error:", errorData.error);
        return false;
      }
    } catch (error) {
      console.error("Error updating customization:", error);
      return false;
    }
  };

  const refreshData = async (): Promise<void> => {
    await loadStoreData();
  };

  // Apply customizations to the document (user-specific only)
  useEffect(() => {
    if (!user) return;

    // Only apply customizations for the current user (they are user-specific)
    if (customizations.website_color) {
      document.documentElement.style.setProperty(
        "--primary",
        customizations.website_color,
      );
    }

    if (customizations.website_background) {
      document.body.style.backgroundImage = `url(${customizations.website_background})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    }

    // Tab title and favicon are user-specific - only the user who set them sees them
    if (customizations.website_tab_title) {
      document.title = customizations.website_tab_title;
    }

    if (customizations.website_favicon) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = customizations.website_favicon;
    }

    // Cleanup function to restore defaults when user logs out
    return () => {
      if (!user) {
        document.documentElement.style.removeProperty("--primary");
        document.body.style.backgroundImage = "";
        document.title = "UEC Launcher"; // Reset to default title

        // Reset favicon to default
        let link = document.querySelector(
          "link[rel*='icon']",
        ) as HTMLLinkElement;
        if (link) {
          link.href = "/favicon.svg"; // Default favicon
        }
      }
    };
  }, [customizations, user]);

  return (
    <StoreContext.Provider
      value={{
        products,
        currentTier,
        purchases,
        customizations,
        isLoading,
        purchaseProduct,
        updateCustomization,
        refreshData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
