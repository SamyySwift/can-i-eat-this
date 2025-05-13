import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HomeProps {
  auth?: {
    user: any;
    isAuthenticated: boolean;
  };
}

export default function Home({ auth }: HomeProps) {
  const [, setLocation] = useLocation();
  const isAuthenticated = auth?.isAuthenticated || false;

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  // Welcome screen for non-authenticated users
  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative flex-grow flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/images/bg.jpg"
            alt="Mountain background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Introducing
            <br />
            <span className="text-6xl md:text-8xl">Can I Eat This?</span>
          </h1>
          <p className="text-xl text-white/90 mb-10 max-w-lg mx-auto ">
            Your AI-Powered Food Companion. Eat Confidently, Live Healthier.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-transparent border border-white hover:text-black text-white rounded-full hover:bg-gray-100 px-8 py-6 text-lg"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                className="bg-border bg-green-600 border-white hover:text-black text-white rounded-full hover:bg-gray-100 px-8 py-6 text-lg"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
