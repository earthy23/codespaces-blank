// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
console.log(`🔧 API_BASE_URL configured as: ${API_BASE_URL}`);

// Connection status tracking
let lastSuccessfulRequest = Date.now();
let consecutiveFailures = 0;

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

// Simple network health check
const checkNetworkHealth = async () => {
  try {
    // Try a simple fetch to the same origin to check connectivity
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2000), // 2 second timeout for health check
    });
    return response.ok;
  } catch (error) {
    console.warn("Network health check failed:", error?.message || error);
    return false;
  }
};

// Request interceptor to add auth token with timeout and performance optimizations
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🌐 API Request: ${options.method || "GET"} ${url}`);

  // Create a request key for deduplication (only for GET requests)
  const method = (options.method || "GET").toUpperCase();
  const requestKey = method === "GET" ? `${method}:${url}` : null;

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

  // Shorter timeout for health checks to fail fast
  if (endpoint.includes("/health")) {
    timeoutMs = 3000; // 3 seconds for health checks
  }

  // Longer timeout for authentication operations (bcrypt can be slow)
  if (endpoint.includes("/auth/")) {
    timeoutMs = 10000; // 10 seconds for auth operations
  }

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

  // Add a flag to track if the timeout was triggered by us
  let isOurTimeout = false;
  const timeoutId = setTimeout(() => {
    console.warn(`⏰ Request timeout after ${timeoutMs}ms for ${url}`);
    isOurTimeout = true;
    controller.abort("Request timeout");
  }, timeoutMs);

  // Store timeout info for error handling
  (controller as any)._isOurTimeout = () => isOurTimeout;

  // Use the timeout controller signal (ignore any existing signal to avoid conflicts)
  const config: RequestInit = {
    ...options,
    headers,
    signal: controller.signal,
  };

  // Create the actual request promise
  const requestPromise = (async () => {
    try {
      console.log(`🔗 Making request to: ${url}`, {
        method: config.method || "GET",
        hasAuth: !!authToken,
      });

      // Check if fetch has been modified by third-party scripts
      if (
        typeof window !== "undefined" &&
        window.fetch.toString().includes("fullstory")
      ) {
        console.warn(
          "⚠️ Detected modified fetch API, using alternative approach",
        );
      }

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

        console.error(`❌ API Error for ${url}:`, JSON.stringify(errorData));
        console.error(
          `📊 Response status: ${response.status} ${response.statusText}`,
        );
        console.error(`🗂️ Raw error data:`, JSON.stringify(errorData, null, 2));

        let errorMessage =
          errorData.error ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        // Handle rate limiting errors specifically
        if (response.status === 429) {
          const retryAfter = errorData.retryAfter || "a few minutes";
          errorMessage = `Too many requests. Please wait ${retryAfter} before trying again.`;

          // In development, add shorter retry advice
          if (import.meta.env.DEV) {
            errorMessage = `Rate limited. Please wait a moment before trying again.`;
          }
        }

        // Include validation details if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details
            .map((detail) => detail.msg || detail.message)
            .join(", ");
          errorMessage = `${errorMessage}: ${validationErrors}`;
        }

        console.error(`🔍 Error message:`, errorMessage);
        if (errorData.details) {
          console.error(`��� Validation details:`, errorData.details);
        }

        throw new Error(errorMessage);
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
    console.error(`🔍 Error details:`, JSON.stringify({
      name: error?.name || "Unknown",
      message: error?.message || "No message available",
      timeout: timeoutMs,
      errorType: typeof error,
      hasStack: !!error?.stack,
    }));

    // Clean up pending request on error
    if (requestKey) {
      pendingRequests.delete(requestKey);
    }

    // Handle AbortError (timeout or manual abort)
    if (error.name === "AbortError" || error.message?.includes("aborted")) {
      const isOurTimeout = (controller as any)._isOurTimeout?.() || false;

      if (isOurTimeout) {
        const timeoutSeconds = Math.round(timeoutMs / 1000);
        console.warn(`⚠️ Request timeout for ${url} after ${timeoutSeconds}s`);
        throw new Error(
          `Request timed out after ${timeoutSeconds} seconds. Please try again.`,
        );
      } else {
        console.warn(`⚠️ Request cancelled for ${url} (not due to timeout)`);
        throw new Error("Request was cancelled. Please try again.");
      }
    }

    // Handle network connectivity issues with retry logic
    if (error instanceof TypeError && error.message?.includes("fetch")) {
      console.error("Network error details:");
      console.error(`  URL: ${url}`);
      console.error(`  Error: ${error.message}`);
      console.error(`  Method: ${options.method || "GET"}`);

      // Add retry for critical auth endpoints
      if (endpoint.includes("/auth/profile") && !options._isRetry) {
        console.log("🔄 Retrying profile request once...");
        try {
          // Wait a short moment and retry once
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await makeRequest(endpoint, { ...options, _isRetry: true });
        } catch (retryError) {
          console.error("❌ Retry also failed:", retryError.message);
        }
      }

      throw new Error(
        "Network error - please check your connection and try again",
      );
    }

    // Handle other network errors
    if (error.message?.includes("Failed to fetch")) {
      console.error("Fetch failure details:");
      console.error(`  URL: ${url}`);
      console.error(`  Error message: ${error.message}`);
      console.error(`  Error stack: ${error.stack}`);

      // Check for FullStory or other third-party interference
      if (error.stack?.includes("fullstory.com")) {
        console.warn("⚠️ FullStory interference detected in fetch request");
        throw new Error(
          "Network request blocked by tracking software. Please try refreshing the page.",
        );
      }

      // If fetch failed, suggest refreshing the page to clear any third-party interference
      throw new Error(
        "Network request failed. Please refresh the page and try again.",
      );
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
    console.log("🔐 Starting login request...");
    const startTime = Date.now();

    try {
      const response = await makeRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      console.log(`✅ Login request completed in ${Date.now() - startTime}ms`);

      if (response.token) {
        try {
          localStorage.setItem("auth_token", response.token);
        } catch (error) {
          console.error("❌ Failed to store token:", error);
        }
      }

      return response;
    } catch (error) {
      console.error(
        `❌ Login request failed after ${Date.now() - startTime}ms:`,
        error,
      );
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
      console.log("🔍 Attempting to fetch user profile...");
      const result = await makeRequest("/auth/profile");
      console.log("✅ User profile fetched successfully");
      return result;
    } catch (error) {
      console.error("❌ Failed to fetch user profile:", error);

      // If it's a network error, try to provide more helpful error context
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.error("🌐 Network connectivity issue detected for profile endpoint");

        // Try a simple health check to see if the server is reachable
        try {
          const healthResponse = await fetch("/api/health", {
            method: "GET",
            signal: AbortSignal.timeout(3000)
          });
          if (healthResponse.ok) {
            console.log("✅ Server health check passed - profile endpoint specific issue");
          } else {
            console.error("❌ Server health check failed:", healthResponse.status);
          }
        } catch (healthError) {
          console.error("❌ Server completely unreachable:", healthError.message);
        }
      }

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

// Health check is available but not automatically called to reduce console noise
// Uncomment the following to enable automatic health check on load:
/*
if (typeof window !== "undefined") {
  healthApi.check()
    .then((result) => {
      console.log("🎯 API Health Check:", result);
    })
    .catch((error) => {
      console.error("⚠️ API Health Check Failed:", error);
      console.log("🔍 Check if the backend server is running on port 3000");
    });
}
*/

// Helper function to safely execute server API calls with automatic retry
const safeServerRequest = async (
  requestFn: () => Promise<any>,
  requestName: string,
  maxRetries = 2,
) => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      attempt++;

      const isRetriableError =
        error.message?.includes("timed out") ||
        error.message?.includes("cancelled") ||
        error.message?.includes("aborted") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network error") ||
        error.name === "AbortError";

      if (isRetriableError && attempt <= maxRetries) {
        const delay = attempt * 1000; // Progressive delay: 1s, 2s
        console.log(
          `🔄 Retrying ${requestName} (attempt ${attempt}/${maxRetries}) after ${delay}ms...`,
        );

        // Check network health before retrying
        const isNetworkHealthy = await checkNetworkHealth();
        if (!isNetworkHealthy) {
          console.error(
            `❌ Network health check failed, skipping retry for ${requestName}`,
          );
          throw new Error(
            "Network connectivity issue - please check your connection and try again",
          );
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If not retriable or max retries reached, throw the error
      throw error;
    }
  }
};

// Servers API with enhanced retry logic
export const serversApi = {
  getAll: async () => {
    return safeServerRequest(() => makeRequest("/servers"), "getAll servers");
  },

  getMyServers: async () => {
    return safeServerRequest(
      () => makeRequest("/servers/my-servers"),
      "getMyServers",
    );
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
