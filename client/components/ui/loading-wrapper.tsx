import { ReactNode, useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./card";
import { Button } from "./button";

interface LoadingWrapperProps {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  timeout?: number;
  fallbackData?: any;
  children: ReactNode;
  loadingText?: string;
  className?: string;
}

export function LoadingWrapper({
  isLoading,
  error,
  onRetry,
  timeout = 5000,
  children,
  loadingText = "Loading...",
  className = "",
}: LoadingWrapperProps) {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        if (isLoading) {
          setShowTimeout(true);
        }
      }, timeout);

      return () => {
        clearTimeout(timer);
        setShowTimeout(false);
      };
    } else {
      setShowTimeout(false);
    }
  }, [isLoading, timeout]);

  if (isLoading && !showTimeout) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-muted-foreground">{loadingText}</span>
      </div>
    );
  }

  if (error || showTimeout) {
    return (
      <Card className="minecraft-panel bg-card/50 border-2 border-border shadow-lg">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">
            {showTimeout ? "Loading Timeout" : "Error"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {showTimeout
              ? "Content is taking longer than expected to load"
              : error || "Something went wrong"}
          </p>
          {onRetry && (
            <Button onClick={onRetry} className="minecraft-button">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
