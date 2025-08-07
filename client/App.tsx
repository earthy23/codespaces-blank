import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { WebSocketManagerProvider } from "@/lib/websocket-manager";
import { StoreProvider } from "@/lib/store";
import { FriendsProvider } from "@/lib/friends";
import { ChatProvider } from "@/lib/chat";
import { NewsProvider } from "@/lib/news";
import { LoggingProvider } from "@/lib/logging";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import ForcePasswordChange from "./pages/ForcePasswordChange";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Friends from "./pages/Friends";
import Store from "./pages/Store";
import Support from "./pages/Support";
import Downloads from "./pages/Downloads";
import Forums from "./pages/Forums";
import Profile from "./pages/Profile";
import News from "./pages/News";
import Servers from "./pages/Servers";

import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Partners from "./pages/Partners";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersAdmin from "./pages/admin/UsersAdmin";
import LogsAdmin from "./pages/admin/LogsAdmin";
import AnalyticsAdmin from "./pages/admin/AnalyticsAdmin";
import NewsAdmin from "./pages/admin/NewsAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketManagerProvider>
          <FriendsProvider>
            <StoreProvider>
              <ChatProvider>
                <NewsProvider>
                  <LoggingProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <Routes>
                          {/* Landing and Auth Routes */}
                          <Route path="/" element={<Index />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route
                            path="/reset-password"
                            element={<ResetPassword />}
                          />
                          <Route
                            path="/force-password-change"
                            element={<ForcePasswordChange />}
                          />

                          {/* Main App Routes */}
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/chat" element={<Chat />} />
                          <Route path="/chat/:chatId" element={<Chat />} />
                          <Route path="/friends" element={<Friends />} />
                          <Route path="/store" element={<Store />} />
                          <Route path="/support" element={<Support />} />
                          <Route path="/downloads" element={<Downloads />} />
                          <Route path="/forums" element={<Forums />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/news" element={<News />} />
                          <Route path="/servers" element={<Servers />} />

                          {/* Info Pages */}
                          <Route path="/about" element={<About />} />
                          <Route path="/terms" element={<Terms />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/partners" element={<Partners />} />

                          {/* Admin Routes - Essential Pages Only */}
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route path="/admin/users" element={<UsersAdmin />} />
                          <Route path="/admin/logs" element={<LogsAdmin />} />
                          <Route path="/admin/analytics" element={<AnalyticsAdmin />} />
                          <Route path="/admin/news" element={<NewsAdmin />} />
                          <Route path="/admin/settings" element={<SettingsAdmin />} />

                          {/* Catch-all route */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                    </TooltipProvider>
                  </LoggingProvider>
                </NewsProvider>
              </ChatProvider>
            </StoreProvider>
          </FriendsProvider>
        </WebSocketManagerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const container = document.getElementById("root")!;

// Check if root already exists to prevent multiple createRoot calls
if (!(container as any)._reactRoot) {
  const root = createRoot(container);
  (container as any)._reactRoot = root;
  root.render(<App />);
} else {
  (container as any)._reactRoot.render(<App />);
}

export default App;
