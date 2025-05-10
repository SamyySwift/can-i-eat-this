import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
  };
}

export default function Navbar({ auth }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = auth;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <nav className="glass sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Utensils className="h-6 w-6 text-primary mr-2" />
              <span className="text-gray-900 font-semibold text-lg">Can I Eat This?</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <Link href="/" className={`${location === '/' ? 'text-primary' : 'text-gray-700'} hover:text-primary px-3 py-2 text-sm font-medium`}>
              Home
            </Link>
            
            {isAuthenticated && (
              <>
                <Link href="/history" className={`${location === '/history' ? 'text-primary' : 'text-gray-700'} hover:text-primary px-3 py-2 text-sm font-medium`}>
                  My History
                </Link>
                <Link href="/profile" className={`${location === '/profile' ? 'text-primary' : 'text-gray-700'} hover:text-primary px-3 py-2 text-sm font-medium`}>
                  Profile
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="glass flex items-center text-gray-700 hover:text-primary px-3 py-2 rounded-full text-sm font-medium">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-primary text-white">
                          {user?.email ? getInitials(user.email) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            
            {!isAuthenticated && (
              <>
                <Link href="/login" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">
                  Login
                </Link>
                <Link href="/register">
                  <Button className="ml-3">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button 
              type="button" 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary focus:outline-none"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden glass">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/"
              className={`${location === '/' ? 'text-primary' : 'text-gray-700'} hover:text-primary block px-3 py-2 rounded-md text-base font-medium`}
              onClick={closeMenu}
            >
              Home
            </Link>
            
            {isAuthenticated && (
              <>
                <Link 
                  href="/history"
                  className={`${location === '/history' ? 'text-primary' : 'text-gray-700'} hover:text-primary block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={closeMenu}
                >
                  My History
                </Link>
                <Link 
                  href="/profile"
                  className={`${location === '/profile' ? 'text-primary' : 'text-gray-700'} hover:text-primary block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={closeMenu}
                >
                  Profile
                </Link>
                <button 
                  className="text-gray-700 hover:text-primary block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                >
                  Logout
                </button>
              </>
            )}
            
            {!isAuthenticated && (
              <>
                <Link 
                  href="/login"
                  className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link 
                  href="/register"
                  className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
