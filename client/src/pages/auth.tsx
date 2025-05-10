import { useEffect } from "react";
import { useLocation } from "wouter";
import AuthForm from "@/components/auth-form";

interface AuthProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
    register: (email: string, password: string) => Promise<{ success: boolean; user?: any; error?: any }>;
  };
  mode: "login" | "register";
}

export default function Auth({ auth, mode }: AuthProps) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, login, register } = auth;
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);
  
  return (
    <div>
      <AuthForm 
        mode={mode} 
        onLogin={login} 
        onRegister={register}
      />
    </div>
  );
}
