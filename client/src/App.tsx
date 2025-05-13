import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentUser,
  signIn,
  signUp,
  signOut,
  onAuthStateChanged,
  type AuthUser,
} from "@/lib/auth";

import TubelightNavbar from "./components/tubelight-navbar";

import PatternBackground from "@/components/pattern-background";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import DietaryProfile from "@/pages/dietary-profile";
import Profile from "@/pages/profile";
import Result from "@/pages/result";
import ScanHistory from "@/pages/scan-history";

type User = AuthUser;

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function initAuth() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    // Set up auth state change listener
    let cleanup: (() => void) | undefined;

    async function setupAuthListener() {
      try {
        const subscription = await onAuthStateChanged((authUser) => {
          setUser(authUser);
          setIsLoading(false);
        });

        if (subscription && typeof subscription.unsubscribe === "function") {
          cleanup = () => subscription.unsubscribe();
        }
      } catch (err) {
        console.error("Error setting up auth listener:", err);
      }
    }

    initAuth();
    setupAuthListener();

    return () => {
      // Clean up subscription when component unmounts
      if (cleanup) cleanup();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn(email, password);

      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }

      if (result.user) {
        setUser(result.user);
      }

      return { success: true };
    } catch (error) {
      toast({
        title: "Login Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const result = await signUp(email, password);

      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      if (result.user) {
        setUser(result.user);
        toast({
          title: "Registration Successful!",
          description: "Please check your email to confirm your account",
        });
      }

      return { success: true, user: result.user };
    } catch (error) {
      toast({
        title: "Registration Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      const result = await signOut();

      if (result.success) {
        setUser(null);
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
        });
      } else {
        throw new Error(result.error || "Logout failed");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const authContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pattern-bg">
      <TubelightNavbar auth={authContextValue} />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={() => <Home auth={authContextValue} />} />
          <Route
            path="/dashboard"
            component={() => <Dashboard auth={authContextValue} />}
          />
          <Route
            path="/login"
            component={() => <Auth auth={authContextValue} mode="login" />}
          />
          <Route
            path="/register"
            component={() => <Auth auth={authContextValue} mode="register" />}
          />
          <Route
            path="/dietary-profile"
            component={() => {
              return authContextValue.isAuthenticated ? (
                <DietaryProfile auth={authContextValue} />
              ) : (
                <Auth auth={authContextValue} mode="login" />
              );
            }}
          />
          <Route
            path="/profile"
            component={() => {
              return authContextValue.isAuthenticated ? (
                <Profile auth={authContextValue} />
              ) : (
                <Auth auth={authContextValue} mode="login" />
              );
            }}
          />
          <Route
            path="/result/:id"
            component={(props) => {
              const scanId = props.params.id || "";
              return authContextValue.isAuthenticated ? (
                <Result auth={authContextValue} scanId={scanId} />
              ) : (
                <Auth auth={authContextValue} mode="login" />
              );
            }}
          />
          <Route
            path="/history"
            component={() => {
              return authContextValue.isAuthenticated ? (
                <ScanHistory auth={authContextValue} />
              ) : (
                <Auth auth={authContextValue} mode="login" />
              );
            }}
          />
          <Route component={NotFound} />
        </Switch>
      </div>
      {/* <Footer />  */}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PatternBackground>
          <Toaster />
          <Router />
        </PatternBackground>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
