// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Request deduplication to prevent identical simultaneous requests
const pendingRequests = new Map<string, Promise<any>>();

// Token management - always read from localStorage to ensure consistency
const getAuthToken = () => {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return null;
    }
    const token = localStorage.getItem("auth_token");
    return token;
  } catch (error) {
    console.error("🔧 getAuthToken: Error accessing localStorage:", error);
    return null;
  }
};

// Request interceptor to add auth token with timeout and performance optimizations
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Create a request key for deduplication (only for GET requests)
  const method = (options.method || 'GET').toUpperCase();
  const requestKey = method === 'GET' ? `${method}:${url}` : null;

  // Check if there's already a pending identical GET request
  if (requestKey && pendingRequests.has(requestKey)) {
    console.log(`🔄 Reusing pending request for ${url}`);
    return pendingRequests.get(requestKey);
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData, let browser handle it
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const authToken = getAuthToken();

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  // Dynamic timeout based on endpoint type
  let timeoutMs = 5000; // Default 5 seconds

  // Longer timeout for server operations that may involve connectivity tests
  if (endpoint.includes("/servers")) {
    timeoutMs = 20000; // 20 seconds for server operations (increased)
  }

  // Longer timeout for file uploads
  if (options.method === "POST" && options.body instanceof FormData) {
    timeoutMs = 30000; // 30 seconds for file uploads
  }

  // Add timeout to requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`⏰ Request timeout after ${timeoutMs}ms for ${url}`);
    controller.abort("Request timeout");
  }, timeoutMs);

  // Use the timeout controller signal (ignore any existing signal to avoid conflicts)
  const config: RequestInit = {
    ...options,
    headers,
    signal: controller.signal,
  };

  // Create the actual request promise
  const requestPromise = (async () => {
    try {
      console.log(`🔗 Making request to: ${url}`, { method: config.method || 'GET', hasAuth: !!authToken });
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      console.log(`📊 Response status: ${response.status} for ${url}`);

      // Handle authentication errors (but not for login/register endpoints)
      if (
        response.status === 401 &&
        !endpoint.includes("/auth/login") &&
        !endpoint.includes("/auth/register")
      ) {
        // Clear token and redirect for any 401 on protected endpoints
        localStorage.removeItem("auth_token");
        localStorage.removeItem("chat_data");
        localStorage.removeItem("friends_data");

        // Use setTimeout to avoid issues with multiple simultaneous requests
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);

        throw new Error("Authentication required");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `Request failed with status ${response.status}`,
        }));

        console.error(`❌ API Error for ${url}:`, errorData);
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log(`✅ Success for ${url}`);
      return data;
    } finally {
      // Always clean up the pending request
      if (requestKey) {
        pendingRequests.delete(requestKey);
      }
    }
  })();

  // Store the promise for deduplication (only for GET requests)
  if (requestKey) {
    pendingRequests.set(requestKey, requestPromise);
  }

  try {
    return await requestPromise;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`💥 Request failed for ${url}:`, error);
    console.error(`🔍 Error details:`, {
      name: error.name,
      message: error.message,
      timeout: timeoutMs
    });

    // Clean up pending request on error
    if (requestKey) {
      pendingRequests.delete(requestKey);
    }

    // Handle AbortError (timeout or manual abort)
    if (error.name === "AbortError" || error.message?.includes("aborted")) {
      const timeoutSeconds = Math.round(timeoutMs / 1000);
      console.warn(`⚠️ Request aborted for ${url} after ${timeoutSeconds}s timeout`);
      throw new Error(`Request timed out after ${timeoutSeconds} seconds. Please try again.`);
    }

    // Handle network connectivity issues
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("Network error details:", { url, error: error.message });
      throw new Error("Network error - please check your connection and try again");
    }

    // Handle other network errors
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Unable to connect to server - please check your internet connection");
    }

    // Re-throw the original error if it's already a proper Error object
    throw error;
  }
};

// No mock users - production ready

// Development mode check
const isDevelopment = import.meta.env.DEV;

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    try {
      const response = await makeRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (response.token) {
        try {
          localStorage.setItem("auth_token", response.token);
        } catch (error) {
          console.error("❌ Failed to store token:", error);
        }
      }

      return response;
    } catch (error) {
      // Re-throw the original error to preserve the actual error message
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      const response = await makeRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

      if (response.token) {
        localStorage.setItem("auth_token", response.token);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await makeRequest("/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("auth_token");
    }
  },

  getProfile: async () => {
    try {
      return await makeRequest("/auth/profile");
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (updates: { username?: string; email?: string }) => {
    return await makeRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return await makeRequest("/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  forcePasswordChange: async (newPassword: string, confirmPassword: string) => {
    return await makeRequest("/auth/force-password-change", {
      method: "PUT",
      body: JSON.stringify({ newPassword, confirmPassword }),
    });
  },
};

// Production ready - no mock users data

// Users API (for admin)
export const usersApi = {
  getAll: async (page = 1, limit = 50) => {
    return await makeRequest(`/users?page=${page}&limit=${limit}`);
  },

  getById: async (userId: string) => {
    return await makeRequest(`/users/${userId}`);
  },

  update: async (userId: string, updates: any) => {
    return await makeRequest(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (userId: string) => {
    return await makeRequest(`/users/${userId}`, {
      method: "DELETE",
    });
  },

  ban: async (userId: string, reason: string, duration?: string) => {
    return await makeRequest(`/users/${userId}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason, duration }),
    });
  },

  unban: async (userId: string) => {
    return await makeRequest(`/users/${userId}/unban`, {
      method: "POST",
    });
  },

  search: async (query: string, page = 1, limit = 50) => {
    return await makeRequest(
      `/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
  },

  getStats: async () => {
    return await makeRequest("/users/stats");
  },
};

// Production ready - no mock clients data

// Clients API
export const clientsApi = {
  getAll: async (admin = false) => {
    const params = admin ? "?admin=true" : "";
    return await makeRequest(`/clients${params}`);
  },

  getById: async (clientId: string) => {
    return await makeRequest(`/clients/${clientId}`);
  },

  upload: async (formData: FormData) => {
    return await makeRequest("/clients/upload", {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  },

  update: async (clientId: string, updates: any) => {
    return await makeRequest(`/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (clientId: string) => {
    return await makeRequest(`/clients/${clientId}`, {
      method: "DELETE",
    });
  },

  download: async (clientId: string) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/clients/${clientId}/download`;

    const link = document.createElement("a");
    link.href = `${url}?token=${token}`;
    link.download = `${clientId}-client.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  launch: async (clientId: string) => {
    return await makeRequest(`/clients/${clientId}/launch`, {
      method: "POST",
    });
  },

  getStats: async () => {
    return await makeRequest("/clients/admin/stats");
  },

  toggle: async (clientId: string) => {
    return await makeRequest(`/clients/${clientId}/toggle`, {
      method: "PUT",
    });
  },
};

// Settings API
export const settingsApi = {
  get: async () => {
    return await makeRequest("/settings");
  },

  update: async (settings: any) => {
    return await makeRequest("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },

  reset: async () => {
    return await makeRequest("/settings/reset", {
      method: "POST",
    });
  },

  getCategory: async (category: string) => {
    return await makeRequest(`/settings/${category}`);
  },

  updateCategory: async (category: string, settings: any) => {
    return await makeRequest(`/settings/${category}`, {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },
};

// Production ready - no mock admin data

// Admin API
export const adminApi = {
  getLogs: async (filters?: any) => {
    const params = new URLSearchParams(filters);
    return await makeRequest(`/admin/logs?${params}`);
  },

  clearLogs: async () => {
    return await makeRequest("/admin/logs", {
      method: "DELETE",
    });
  },

  getAnalytics: async () => {
    return await makeRequest("/admin/analytics");
  },

  getWebhooks: async () => {
    return await makeRequest("/admin/webhooks");
  },

  createWebhook: async (webhook: any) => {
    return await makeRequest("/admin/webhooks", {
      method: "POST",
      body: JSON.stringify(webhook),
    });
  },

  updateWebhook: async (webhookId: string, updates: any) => {
    return await makeRequest(`/admin/webhooks/${webhookId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  deleteWebhook: async (webhookId: string) => {
    return await makeRequest(`/admin/webhooks/${webhookId}`, {
      method: "DELETE",
    });
  },

  testWebhook: async (webhookId: string) => {
    return await makeRequest(`/admin/webhooks/${webhookId}/test`, {
      method: "POST",
    });
  },
};

// Health check
export const healthApi = {
  check: async () => {
    return await makeRequest("/health");
  },
};

// Test API connectivity on load
if (typeof window !== "undefined") {
  // Test the connection in development
  healthApi.check()
    .then((result) => {
      console.log("🎯 API Health Check:", result);
    })
    .catch((error) => {
      console.error("⚠️ API Health Check Failed:", error);
      console.log("🔍 Check if the backend server is running on port 3000");
    });
}

// Servers API
export const serversApi = {
  getAll: async () => {
    return await makeRequest("/servers");
  },

  getMyServers: async () => {
    return await makeRequest("/servers/my-servers");
  },

  getById: async (serverId: string) => {
    return await makeRequest(`/servers/${serverId}`);
  },

  add: async (formData: FormData) => {
    return await makeRequest("/servers", {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  },

  update: async (serverId: string, formData: FormData) => {
    return await makeRequest(`/servers/${serverId}`, {
      method: "PUT",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  },

  delete: async (serverId: string) => {
    return await makeRequest(`/servers/${serverId}`, {
      method: "DELETE",
    });
  },

  like: async (serverId: string) => {
    return await makeRequest(`/servers/${serverId}/like`, {
      method: "POST",
    });
  },

  updateStatus: async (serverId: string) => {
    return await makeRequest(`/servers/${serverId}/status`, {
      method: "PUT",
    });
  },
};

// Export token management
export const tokenManager = {
  get: () => getAuthToken(),
  set: (token: string) => {
    localStorage.setItem("auth_token", token);
  },
  clear: () => {
    localStorage.removeItem("auth_token");
  },
  isValid: () => {
    const authToken = getAuthToken();
    if (!authToken) return false;

    try {
      const payload = JSON.parse(atob(authToken.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  getToken: () => getAuthToken(),
};

export default {
  authApi,
  usersApi,
  clientsApi,
  serversApi,
  settingsApi,
  adminApi,
  healthApi,
  tokenManager,
};
