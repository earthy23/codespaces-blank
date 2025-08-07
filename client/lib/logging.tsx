import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'admin' | 'security';
  category: 'auth' | 'user' | 'chat' | 'store' | 'admin' | 'system' | 'security';
  action: string;
  userId?: string;
  username?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  totalMessages: number;
  totalPurchases: number;
  errorRate: number;
  serverUptime: string;
  memoryUsage: number;
  cpuUsage: number;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  lastTriggered?: string;
}

interface LoggingContextType {
  logs: LogEntry[];
  metrics: SystemMetrics;
  webhooks: WebhookConfig[];
  logAction: (action: string, category: LogEntry['category'], level: LogEntry['level'], details?: Record<string, any>) => void;
  getLogsByCategory: (category: string) => LogEntry[];
  getLogsByLevel: (level: string) => LogEntry[];
  clearLogs: () => void;
  addWebhook: (webhook: Omit<WebhookConfig, 'id'>) => void;
  updateWebhook: (id: string, webhook: Partial<WebhookConfig>) => void;
  deleteWebhook: (id: string) => void;
  triggerWebhook: (webhookId: string, event: string, data: any) => Promise<boolean>;
  getRecentActivity: () => LogEntry[];
}

const LoggingContext = createContext<LoggingContextType | undefined>(undefined);

// Generate realistic system metrics
const generateMetrics = (): SystemMetrics => {
  const users = JSON.parse(localStorage.getItem('uec_users') || '[]');
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Simulate realistic metrics
  return {
    totalUsers: users.length + Math.floor(Math.random() * 1000) + 500,
    activeUsers: Math.floor(users.length * 0.8) + Math.floor(Math.random() * 200),
    onlineUsers: Math.floor(users.length * 0.3) + Math.floor(Math.random() * 50),
    totalMessages: Math.floor(Math.random() * 10000) + 5000,
    totalPurchases: Math.floor(Math.random() * 500) + 100,
    errorRate: Math.random() * 2, // 0-2% error rate
    serverUptime: `${Math.floor(Math.random() * 30) + 1} days`,
    memoryUsage: Math.random() * 40 + 30, // 30-70%
    cpuUsage: Math.random() * 20 + 10, // 10-30%
  };
};

const defaultWebhooks: WebhookConfig[] = [
  {
    id: 'discord-alerts',
    name: 'Discord Alerts',
    url: 'https://discord.com/api/webhooks/your-webhook-url',
    events: ['user.banned', 'purchase.completed', 'security.alert'],
    active: false,
  },
  {
    id: 'slack-notifications',
    name: 'Slack Notifications', 
    url: 'https://hooks.slack.com/services/your-webhook-url',
    events: ['user.registered', 'error.critical', 'admin.action'],
    active: false,
  }
];

export function LoggingProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>(generateMetrics());
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadLoggingData();
    const interval = setInterval(() => {
      setMetrics(generateMetrics());
    }, 30000); // Update metrics every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadLoggingData = () => {
    const storedLogs = JSON.parse(localStorage.getItem('uec_system_logs') || '[]');
    const storedWebhooks = JSON.parse(localStorage.getItem('uec_webhooks') || 'null');
    
    setLogs(storedLogs);
    setWebhooks(storedWebhooks || defaultWebhooks);
  };

  const saveLogs = (newLogs: LogEntry[]) => {
    // Keep only last 1000 logs to prevent storage bloat
    const trimmedLogs = newLogs.slice(-1000);
    setLogs(trimmedLogs);
    localStorage.setItem('uec_system_logs', JSON.stringify(trimmedLogs));
  };

  const saveWebhooks = (newWebhooks: WebhookConfig[]) => {
    setWebhooks(newWebhooks);
    localStorage.setItem('uec_webhooks', JSON.stringify(newWebhooks));
  };

  const logAction = (
    action: string,
    category: LogEntry['category'],
    level: LogEntry['level'] = 'info',
    details: Record<string, any> = {}
  ) => {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      action,
      userId: user?.id,
      username: user?.username,
      details,
      ipAddress: '127.0.0.1', // In real app, this would be actual IP
      userAgent: navigator.userAgent,
    };

    const newLogs = [logEntry, ...logs];
    saveLogs(newLogs);

    // Trigger webhooks for important events
    if (level === 'error' || level === 'security' || category === 'admin') {
      triggerRelevantWebhooks(action, category, level, logEntry);
    }
  };

  const triggerRelevantWebhooks = async (
    action: string,
    category: string,
    level: string,
    logEntry: LogEntry
  ) => {
    const relevantWebhooks = webhooks.filter(webhook => 
      webhook.active && 
      webhook.events.some(event => 
        event.includes(category) || 
        event.includes(level) ||
        event.includes(action.toLowerCase())
      )
    );

    for (const webhook of relevantWebhooks) {
      await triggerWebhook(webhook.id, `${category}.${action}`, logEntry);
    }
  };

  const getLogsByCategory = (category: string): LogEntry[] => {
    return logs.filter(log => log.category === category);
  };

  const getLogsByLevel = (level: string): LogEntry[] => {
    return logs.filter(log => log.level === level);
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('uec_system_logs');
  };

  const addWebhook = (webhookData: Omit<WebhookConfig, 'id'>) => {
    const webhook: WebhookConfig = {
      ...webhookData,
      id: `webhook-${Date.now()}`,
    };
    const newWebhooks = [...webhooks, webhook];
    saveWebhooks(newWebhooks);
  };

  const updateWebhook = (id: string, webhookData: Partial<WebhookConfig>) => {
    const newWebhooks = webhooks.map(webhook =>
      webhook.id === id ? { ...webhook, ...webhookData } : webhook
    );
    saveWebhooks(newWebhooks);
  };

  const deleteWebhook = (id: string) => {
    const newWebhooks = webhooks.filter(webhook => webhook.id !== id);
    saveWebhooks(newWebhooks);
  };

  const triggerWebhook = async (webhookId: string, event: string, data: any): Promise<boolean> => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook || !webhook.active) return false;

    try {
      // In a real app, this would make an actual HTTP request
      console.log(`Webhook ${webhook.name} triggered:`, { event, data });
      
      // Update last triggered timestamp
      updateWebhook(webhookId, { lastTriggered: new Date().toISOString() });
      
      // Log the webhook trigger
      logAction('webhook_triggered', 'system', 'info', {
        webhookId,
        webhookName: webhook.name,
        event,
        url: webhook.url
      });

      return true;
    } catch (error) {
      logAction('webhook_failed', 'system', 'error', {
        webhookId,
        webhookName: webhook.name,
        event,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  };

  const getRecentActivity = (): LogEntry[] => {
    return logs.slice(0, 20); // Most recent 20 entries
  };

  return (
    <LoggingContext.Provider value={{
      logs,
      metrics,
      webhooks,
      logAction,
      getLogsByCategory,
      getLogsByLevel,
      clearLogs,
      addWebhook,
      updateWebhook,
      deleteWebhook,
      triggerWebhook,
      getRecentActivity,
    }}>
      {children}
    </LoggingContext.Provider>
  );
}

export function useLogging() {
  const context = useContext(LoggingContext);
  if (context === undefined) {
    throw new Error('useLogging must be used within a LoggingProvider');
  }
  return context;
}
