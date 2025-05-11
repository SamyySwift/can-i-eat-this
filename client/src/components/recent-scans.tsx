import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FoodScan } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import CachedImage from "@/components/cached-image";
import { fetchApi } from "../lib/api";
import { preloadImages } from "@/lib/imageCache";

interface RecentScansProps {
  userId: string;
}

export default function RecentScans({ userId }: RecentScansProps) {
  const {
    data: scans,
    isLoading,
    isError,
  } = useQuery<FoodScan[]>({
    queryKey: [`/api/scans/recent/${userId}`],
    queryFn: () => {
      // Get the auth token from Supabase
      const supabaseAuth = JSON.parse(
        localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
      );
      const accessToken = supabaseAuth?.access_token || "";

      return fetchApi(`/api/scans/recent/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },
  });

  // Preload all scan images when data is loaded
  useEffect(() => {
    if (scans && scans.length > 0) {
      // Extract all image URLs from scans
      const imageUrls = scans
        .filter((scan) => scan.imageUrl)
        .map((scan) => scan.imageUrl);

      // Preload all scan images in the background
      if (imageUrls.length > 0) {
        console.log("Preloading scan images:", imageUrls.length);
        preloadImages(imageUrls)
          .then(() => console.log("Successfully preloaded scan images"))
          .catch((err) => console.error("Error preloading scan images:", err));
      }
    }
  }, [scans]);

  if (isLoading) {
    return <RecentScansSkeleton />;
  }

  if (isError || !scans) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-700">
          Failed to load recent scans. Please try again later.
        </p>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="p-6 border border-gray-200 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500">
          You don't have any scans yet. Start by scanning a food item!
        </p>
      </div>
    );
  }

  // Function to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Function to render safety badge
  const renderSafetyBadge = (isSafe: boolean | null) => {
    if (isSafe === true) {
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 hover:bg-green-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" /> Safe
        </Badge>
      );
    } else if (isSafe === false) {
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 hover:bg-red-200"
        >
          <XCircle className="h-3 w-3 mr-1" /> Unsafe
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        >
          <AlertTriangle className="h-3 w-3 mr-1" /> Caution
        </Badge>
      );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scans.map((scan) => (
        <Link key={scan.id} href={`/result/${scan.id}`}>
          <Card className="h-full cursor-pointer hover:shadow-md transition-shadow duration-300">
            <div className="h-48 overflow-hidden">
              <CachedImage
                src={
                  scan.imageUrl
                    ? `${import.meta.env.VITE_API_URL}${scan.imageUrl}`
                    : ""
                }
                alt={scan.foodName || "Food scan"}
                foodName={scan.foodName}
                className="w-full h-full"
                height="12rem"
              />
            </div>
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium text-gray-900">
                  {scan.foodName}
                </CardTitle>
                {renderSafetyBadge(scan.isSafe)}
              </div>
              <p className="text-sm text-gray-500">
                Scanned {formatDate(scan.scannedAt)}
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <div className="flex flex-wrap gap-1 mb-2">
                {scan.ingredients.slice(0, 4).map((ingredient, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {ingredient}
                  </Badge>
                ))}
                {scan.ingredients.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{scan.ingredients.length - 4} more
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <span className="text-primary hover:text-primary-dark text-sm font-medium">
                View Details
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function RecentScansSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="h-full">
          <Skeleton className="h-48 w-full" />
          <CardHeader className="p-4 pb-0">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-24 mt-2" />
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="flex flex-wrap gap-1 mb-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Skeleton className="h-4 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
