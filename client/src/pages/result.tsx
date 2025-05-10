import { useEffect } from "react";
import { useLocation } from "wouter";
import ResultDetails from "@/components/result-details";

interface ResultProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
  };
  scanId: string;
}

export default function Result({ auth, scanId }: ResultProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = auth;
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <ResultDetails scanId={scanId} userId={user.id} />;
}
