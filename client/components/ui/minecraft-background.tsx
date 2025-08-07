import { ReactNode } from 'react';

interface MinecraftBackgroundProps {
  children: ReactNode;
  overlay?: boolean;
  className?: string;
}

export function MinecraftBackground({ children, overlay = true, className = "" }: MinecraftBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url('https://cdn.builder.io/api/v1/image/assets%2F1b395d19798c42b290cad33382fe9140%2Fb9138b88b93944a18667da4bd2e42a4f?format=webp&width=1920')`
        }}
      />
      
      {/* Overlay for readability */}
      {overlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-10" />
      )}
      
      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
}

export default MinecraftBackground;
