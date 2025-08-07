import { ReactNode } from "react";
import { MinecraftBackground } from "@/components/ui/minecraft-background";
import { TopNavigation } from "@/components/ui/top-navigation";
import { NavigationSidebar } from "@/components/ui/navigation-sidebar";

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <MinecraftBackground>
      <TopNavigation />
      <div className="flex h-screen">
        <NavigationSidebar />
        <main className="flex-1 h-full overflow-y-auto p-6">{children}</main>
      </div>
    </MinecraftBackground>
  );
}
