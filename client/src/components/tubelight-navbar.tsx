import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  LucideIcon,
  Home,
  History,
  User,
  LogIn,
  UserPlus,
  Utensils,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

interface TubelightNavbarProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
  };
}

export function NavBar({ items, className }: NavBarProps) {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(items[0].name);
  const [isMobile, setIsMobile] = useState(false);

  // Get active tab based on current location
  const getActiveTabFromLocation = () => {
    if (location === "/") return "Home";
    if (location === "/dashboard") return "Dashboard";
    if (location === "/history") return "History";
    if (location === "/profile") return "Profile";
    if (location === "/login") return "Login";
    if (location === "/register") return "Sign Up";
    return "Home";
  };

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromLocation());
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-10 mb-6 sm:pt-6",
        className
      )}
    >
      <div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors pointer-events-auto",
                "text-foreground/80 hover:text-primary",
                isActive && "bg-muted text-primary"
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function TubelightNavbar({ auth }: TubelightNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = auth;

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
  };

  // Create navigation items based on authentication status
  const getNavItems = () => {
    const items: NavItem[] = [{ name: "Home", url: "/", icon: Home }];

    if (isAuthenticated) {
      items.push(
        { name: "Dashboard", url: "/dashboard", icon: Utensils },
        { name: "History", url: "/history", icon: History },
        { name: "Profile", url: "/profile", icon: User }
      );
    } else {
      items.push(
        { name: "Login", url: "/login", icon: LogIn },
        { name: "Sign Up", url: "/register", icon: UserPlus }
      );
    }

    return items;
  };

  // Moved getActiveTabFromLocation to NavBar component

  return (
    <nav className="sticky top-0 z-10">
      {/* Tubelight Navigation */}
      <NavBar items={getNavItems()} className="sm:w-auto w-[90%] pointer-events-none" />
    </nav>
  );
}
