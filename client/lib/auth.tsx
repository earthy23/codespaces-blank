import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { authApi, tokenManager } from "./api";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  avatar?: string;
  createdAt: string;
  mustChangePassword?: boolean;
  temporaryPassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    username?: string;
    email?: string;
  }) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  isAdmin: () => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for existing valid token and load user
    if (tokenManager.isValid()) {
      refreshUser();
    } else {
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const refreshUser = async () => {
    // Debounce rapid refresh calls (minimum 2 seconds between requests)
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    const minInterval = 2000; // 2 seconds

    if (timeSinceLastRefresh < minInterval) {
      // If a refresh was called recently, schedule a delayed refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        refreshUser();
      }, minInterval - timeSinceLastRefresh);
      return;
    }

    try {
      setLoading(true);
      lastRefreshRef.current = now;

      // Add timeout for auth response (increased for better reliability)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Auth timeout")), 10000),
      );

      const response = await Promise.race([
        authApi.getProfile(),
        timeoutPromise,
      ]);

      setUser(response);
    } catch (error) {
      console.error("Failed to refresh user:", error);

      tokenManager.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("🔐 AuthProvider: Starting login...");
      }
      const response = await authApi.login(username, password);
      if (process.env.NODE_ENV === "development") {
        console.log("🔐 AuthProvider: Login API response:", {
          hasUser: !!response.user,
          username: response.user?.username,
          mustChangePassword: response.user?.mustChangePassword,
        });
      }

      setUser(response.user);
      if (process.env.NODE_ENV === "development") {
        console.log(
          "🔐 AuthProvider: User state set to:",
          response.user?.username,
        );
      }

      // Check if user needs to change password
      if (response.user.mustChangePassword) {
        // Redirect immediately to force password change
        window.location.href = "/force-password-change";
        return true;
      }

      return true;
    } catch (error) {
      console.error("Login error:", error);
      throw error; // Re-throw error so Login component can handle it
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response = await authApi.register(username, email, password);
      setUser(response.user);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear user state immediately
      setUser(null);
      setLoading(false);

      // Attempt to call logout API
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with logout even if API fails
    } finally {
      // Always clear token and user state
      tokenManager.clear();
      setUser(null);
      setLoading(false);

      // Clear any other cached data
      localStorage.removeItem("chat_data");
      localStorage.removeItem("friends_data");

      // Force page reload to clear any remaining state
      window.location.href = "/login";
    }
  };

  const updateProfile = async (updates: {
    username?: string;
    email?: string;
  }): Promise<boolean> => {
    try {
      await authApi.updateProfile(updates);
      // Refresh user data to get updated info
      await refreshUser();
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      return false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    try {
      await authApi.changePassword(currentPassword, newPassword);
      return true;
    } catch (error) {
      console.error("Password change error:", error);
      return false;
    }
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        isAdmin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  try {
    const context = useContext(AuthContext);
    if (context === undefined) {
      // Provide a graceful fallback to prevent crashes during HMR
      console.warn(
        "useAuth called before AuthProvider is initialized - providing fallback",
      );
      return {
        user: null,
        loading: true,
        login: async (username: string, password: string) => {
          console.warn("Login called before AuthProvider is ready");
          return false;
        },
        register: async (username: string, email: string, password: string) => {
          console.warn("Register called before AuthProvider is ready");
          return false;
        },
        logout: async () => {
          console.warn("Logout called before AuthProvider is ready");
        },
        updateProfile: async (updates: {
          username?: string;
          email?: string;
        }) => {
          console.warn("UpdateProfile called before AuthProvider is ready");
          return false;
        },
        changePassword: async (
          currentPassword: string,
          newPassword: string,
        ) => {
          console.warn("ChangePassword called before AuthProvider is ready");
          return false;
        },
        isAdmin: () => {
          console.warn("IsAdmin called before AuthProvider is ready");
          return false;
        },
        refreshUser: async () => {
          console.warn("RefreshUser called before AuthProvider is ready");
        },
        token: null,
      };
    }
    return { ...context, token: tokenManager.get() };
  } catch (error) {
    console.error("useAuth: Critical error accessing AuthContext:", error);
    // Return safe fallback even if useContext fails
    return {
      user: null,
      loading: false,
      login: async () => false,
      register: async () => false,
      logout: async () => {},
      updateProfile: async () => false,
      changePassword: async () => false,
      isAdmin: () => false,
      refreshUser: async () => {},
      token: null,
    };
  }
};
