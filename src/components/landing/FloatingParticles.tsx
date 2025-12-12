import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: "primary" | "accent" | "secondary";
}

export function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors: ("primary" | "accent" | "secondary")[] = ["primary", "accent", "secondary"];
    const generated: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(generated);
  }, []);

  const getColorClass = (color: "primary" | "accent" | "secondary") => {
    switch (color) {
      case "primary":
        return "bg-primary/30";
      case "accent":
        return "bg-accent/30";
      case "secondary":
        return "bg-secondary/30";
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full ${getColorClass(particle.color)} blur-sm`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `float-particle ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      
      {/* Larger glowing orbs */}
      <div 
        className="absolute w-3 h-3 bg-primary/40 rounded-full blur-md"
        style={{
          left: "15%",
          top: "25%",
          animation: "float-orb 20s ease-in-out infinite",
        }}
      />
      <div 
        className="absolute w-4 h-4 bg-accent/40 rounded-full blur-md"
        style={{
          left: "75%",
          top: "35%",
          animation: "float-orb 25s ease-in-out infinite reverse",
          animationDelay: "2s",
        }}
      />
      <div 
        className="absolute w-2 h-2 bg-secondary/50 rounded-full blur-sm"
        style={{
          left: "50%",
          top: "60%",
          animation: "float-orb 18s ease-in-out infinite",
          animationDelay: "4s",
        }}
      />
      
      {/* Sparkle stars */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `twinkle ${2 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            className="text-primary/40"
          >
            <path
              d="M12 2L13.09 8.26L19 9L13.09 10.74L12 17L10.91 10.74L5 9L10.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
