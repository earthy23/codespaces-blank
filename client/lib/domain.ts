/**
 * Domain utility for multi-domain support
 * Handles domain detection, WebSocket URLs, and API endpoints
 */

export interface DomainInfo {
  currentDomain: string;
  isAllowed: boolean;
  primaryDomain: string;
  multiDomainEnabled: boolean;
  allowedDomains: string[];
  websocketUrls: {
    development: string;
    production: string;
  };
}

/**
 * Get current domain information
 */
export const getCurrentDomain = (): string => {
  if (typeof window === "undefined") return "";
  return `${window.location.protocol}//${window.location.host}`;
};

/**
 * Check if current domain is localhost
 */
export const isLocalhost = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost")
  );
};

/**
 * Get appropriate WebSocket URL for current environment
 */
export const getWebSocketUrl = (path: string = ""): string => {
  if (typeof window === "undefined") return "";

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;

  // For production, use secure WebSocket
  if (!isLocalhost() && window.location.protocol === "https:") {
    return `wss://${host}${path}`;
  }

  // For development, use regular WebSocket
  return `ws://${host}${path}`;
};

/**
 * Get API base URL for current domain
 */
export const getApiBaseUrl = (): string => {
  if (typeof window === "undefined") return "";
  return `${window.location.protocol}//${window.location.host}/api`;
};

/**
 * Fetch domain information from server
 */
export const fetchDomainInfo = async (): Promise<DomainInfo | null> => {
  try {
    const response = await fetch("/api/domain-info");
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("Failed to fetch domain info:", error);
  }
  return null;
};

/**
 * Generate appropriate URLs for different domains
 */
export const generateDomainUrls = (baseDomain: string) => {
  const protocols = ["http://", "https://"];
  const subdomains = ["", "www.", "play.", "api.", "admin."];

  const urls: string[] = [];

  protocols.forEach((protocol) => {
    subdomains.forEach((subdomain) => {
      urls.push(`${protocol}${subdomain}${baseDomain}`);
    });
  });

  return urls;
};

/**
 * Redirect to primary domain if needed
 */
export const redirectToPrimaryDomain = async (primaryDomain: string) => {
  if (typeof window === "undefined") return;

  const currentHost = window.location.host;

  // Don't redirect localhost or if already on primary domain
  if (isLocalhost() || currentHost === primaryDomain) {
    return;
  }

  // Redirect to primary domain maintaining the current path
  const newUrl = `${window.location.protocol}//${primaryDomain}${window.location.pathname}${window.location.search}`;
  window.location.href = newUrl;
};

/**
 * Initialize domain support
 */
export const initializeDomainSupport = async () => {
  const domainInfo = await fetchDomainInfo();

  if (domainInfo) {
    console.log("🌐 Domain info loaded:", domainInfo);

    // Store domain info globally for debugging
    if (typeof window !== "undefined") {
      (window as any).__DOMAIN_INFO__ = domainInfo;
    }

    return domainInfo;
  }

  return null;
};

/**
 * Get secure WebSocket URL with fallback
 */
export const getSecureWebSocketUrl = (
  path: string = "",
  fallbackPort?: number,
): string => {
  if (typeof window === "undefined") return "";

  const host = window.location.host;
  const isSecure = window.location.protocol === "https:";

  // Always use secure WebSocket for production domains
  if (!isLocalhost() || isSecure) {
    return `wss://${host}${path}`;
  }

  // For localhost development
  const port = fallbackPort || window.location.port || "3000";
  const wsHost = port ? `${window.location.hostname}:${port}` : host;

  return `ws://${wsHost}${path}`;
};

/**
 * Domain-specific configuration
 */
export const getDomainConfig = () => {
  const currentDomain = getCurrentDomain();
  const isLocal = isLocalhost();

  return {
    currentDomain,
    isLocal,
    apiUrl: getApiBaseUrl(),
    wsUrl: getWebSocketUrl(),
    secureWsUrl: getSecureWebSocketUrl(),
    supportsWebRTC: !isLocal, // Assume WebRTC works better on production
    maxFileSize: isLocal ? 100 * 1024 * 1024 : 50 * 1024 * 1024, // 100MB local, 50MB production
  };
};
