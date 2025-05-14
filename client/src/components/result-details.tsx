import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CircleHelp,
  ChevronLeftCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FoodScan, FoodSafetyCheckResponse } from "@/types";
import CachedImage from "@/components/cached-image";
import { fetchApi } from "@/lib/api";
import { Input } from "@/components/ui/input";

interface ResultDetailsProps {
  scanId: string;
  userId: string;
}

export default function ResultDetails({ scanId, userId }: ResultDetailsProps) {
  const { toast } = useToast();
  const [isCorrectFood, setIsCorrectFood] = useState<boolean | null>(null);
  const [newFoodName, setNewFoodName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Move the mutation hook to the top level of the component
  // This ensures it's always called in the same order
  const updateFoodNameMutation = useMutation({
    mutationFn: async (foodName: string) => {
      const accessToken = getAuthToken();
      return fetchApi(`/api/scans/${scanId}/update-food-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ foodName }),
        credentials: "include",
      });
    },
    onSuccess: () => {
      toast({
        title: "Food Updated",
        description: "The food has been reanalyzed with the new name.",
      });
      // Invalidate and refetch the scan data
      queryClient.invalidateQueries({ queryKey: [`scan-${scanId}`] });
      setIsSubmitting(false);
      setIsCorrectFood(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update food name.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Get the auth token from Supabase
  const getAuthToken = () => {
    const supabaseAuth = JSON.parse(
      localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
    );
    return supabaseAuth?.access_token || "";
  };

  // Fetch the scan result - note: API returns an array with one item
  const {
    data: scanData,
    isLoading,
    isError,
  } = useQuery<FoodScan[]>({
    queryKey: [`scan-${scanId}`],
    queryFn: async () => {
      const accessToken = getAuthToken();

      // Make sure we're using the correct API endpoint format
      const response = await fetchApi(`/api/scans/${scanId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      console.log("Scan API response:", response);

      // If the response is empty or not an array, wrap it in an array
      if (!response || !Array.isArray(response)) {
        console.warn("Response is not an array, wrapping:", response);
        return response ? [response] : [];
      }

      return response;
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Extract the first scan from the array
  const scan = scanData && scanData.length > 0 ? scanData[0] : null;

  // Use hooks for side effects instead
  useEffect(() => {
    if (scanData) {
      console.log("Successfully fetched scan data:", scanData);
      if (scan) {
        console.log("Extracted scan:", scan);
        console.log("Scan date:", scan.scannedAt);
        console.log("Scan date type:", typeof scan.scannedAt);
        console.log("Scan ingredients:", scan.ingredients);
      } else {
        console.error("No scan found in response data");
      }
    }
  }, [scanData, scan]);

  const { data: alternatives } = useQuery<
    Array<{
      name: string;
      description: string;
      ingredients: string[];
    }>
  >({
    queryKey: [`/api/food/alternatives/${scanId}`],
    queryFn: async () => {
      const accessToken = getAuthToken();
      return fetchApi(`/api/food/alternatives/${scanId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });
    },
    enabled: !!scan && scan.isSafe === false,
  });

  // Fetch dietary information
  const { data: dietaryInfo } = useQuery<{
    title: string;
    description: string;
    avoidList?: string[];
  }>({
    queryKey: [`/api/food/dietary-info/${scanId}`],
    queryFn: async () => {
      const accessToken = getAuthToken();
      return fetchApi(`/api/food/dietary-info/${scanId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });
    },
    enabled: !!scan,
  });

  const handleSaveToHistory = async () => {
    try {
      const accessToken = getAuthToken();
      // In a real implementation, we might want to save additional metadata
      await fetchApi(`/api/scans/${scanId}/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      toast({
        title: "Saved",
        description: "This food scan has been saved to your history.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save to history.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Food Safety Check: ${scan?.foodName}`,
          text: `Check out my food safety scan for ${scan?.foodName}`,
          url: window.location.href,
        })
        .catch((error) => {
          console.error("Error sharing:", error);
        });
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "The link has been copied to your clipboard.",
      });
    }
  };

  if (isLoading) {
    return <ResultDetailsSkeleton />;
  }

  if (isError || !scan) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center p-8">
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Scan Not Found
              </h2>
              <p className="text-gray-600">
                We couldn't find the food scan you're looking for. It may have
                been deleted or expired.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/">Go Back Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Update renderSafetyBadge to handle null scan
  const renderSafetyBadge = () => {
    if (!scan) return null; // Add null check

    if (scan.isSafe === true) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="mr-2 h-4 w-4" /> Safe for You
        </span>
      );
    } else if (scan.isSafe === false) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="mr-2 h-4 w-4" /> Not Safe for You
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="mr-2 h-4 w-4" /> Use Caution
        </span>
      );
    }
  };

  // Format date
  const formatDate = (dateStr: string | Date) => {
    if (!dateStr) {
      return "Recent";
    }

    try {
      const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateStr);
        return "Recent";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Date parsing error:", error);
      return "Recent";
    }
  };

  const handleFoodNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a food name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    updateFoodNameMutation.mutate(newFoodName);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 mt-32">
      <div className="mb-6">
        <Link href="/">
          <ChevronLeftCircle className="h-8 w-8" />
        </Link>
      </div>

      <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="bg-white rounded-lg overflow-hidden">
                {/* Use CachedImage component for better performance */}
                <CachedImage
                  src={scan?.imageUrl || ""}
                  alt={scan?.foodName || "Food Image"}
                  foodName={scan?.foodName}
                  className="w-full h-full object-cover"
                  // height="40rem"
                />
              </div>
            </div>
            <div>
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {scan?.foodName || "Food Analysis"}
                </h1>
                <p className="text-gray-500">
                  Analyzed on {formatDate(scan?.scannedAt)}
                </p>
              </div>

              <div className="mb-6">{renderSafetyBadge()}</div>

              {scan?.isSafe === false && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Why it's not safe:
                  </h3>
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        {scan.unsafeReasons && scan.unsafeReasons.length > 0 ? (
                          <div>
                            <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                              {scan.unsafeReasons.map((reason, index) => (
                                <li key={index}>{reason}</li>
                              ))}
                            </ul>
                            {scan.description && (
                              <p className="text-sm text-red-700 mt-2">
                                {scan.description}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-red-700">
                            {scan.safetyReason ||
                              "This food may contain ingredients that conflict with your dietary restrictions."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Detected Ingredients:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scan?.ingredients &&
                  Array.isArray(scan.ingredients) &&
                  scan.ingredients.length > 0 ? (
                    scan.ingredients.map((ingredient, index) => {
                      // Check if this ingredient is problematic by looking in the unsafeReasons or safetyReason
                      const isProblematic =
                        scan.isSafe === false &&
                        ((scan.unsafeReasons &&
                          Array.isArray(scan.unsafeReasons) &&
                          scan.unsafeReasons.some(
                            (reason) =>
                              reason &&
                              reason
                                .toLowerCase()
                                .includes(ingredient.toLowerCase())
                          )) ||
                          (scan.safetyReason &&
                            scan.safetyReason
                              .toLowerCase()
                              .includes(ingredient.toLowerCase())));

                      return (
                        <Badge
                          key={index}
                          variant="outline"
                          className={
                            isProblematic
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {isProblematic && (
                            <AlertTriangle className="mr-1 h-3 w-3" />
                          )}
                          {ingredient}
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-gray-500">No ingredients detected</p>
                  )}
                </div>
              </div>
              {/* bottom buttons */}
              {/* <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSaveToHistory} className="flex-1 gap-2">
                  <Bookmark className="h-4 w-4" /> Save to History
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex-1 gap-2"
                >
                  <Share className="h-4 w-4" /> Share
                </Button>
              </div> */}
              {/* Food detection feedback section */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Was the food correctly detected?
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant={isCorrectFood === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsCorrectFood(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={isCorrectFood === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsCorrectFood(false)}
                  >
                    No
                  </Button>
                </div>

                {isCorrectFood === false && (
                  <form onSubmit={handleFoodNameUpdate} className="mt-3">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Please provide the correct food name:
                      </p>
                      <div className="flex space-x-2">
                        <Input
                          value={newFoodName}
                          onChange={(e) => setNewFoodName(e.target.value)}
                          placeholder="Enter food name"
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          disabled={isSubmitting || !newFoodName.trim()}
                        >
                          {isSubmitting ? "Updating..." : "Update"}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safer Alternatives Section (Only shown for unsafe foods) */}
      {/* {scan?.isSafe === false &&
        alternatives &&
        Array.isArray(alternatives) &&
        alternatives.length > 0 && (
          <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Safer Alternatives
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {alternatives.map((alternative, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow overflow-hidden border border-gray-200"
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {alternative?.name || "Alternative Option"}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {alternative?.description ||
                          "An alternative food choice that might be safer for you"}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" /> Safe for you
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )} */}

      {/* Dietary Information Section */}
      {dietaryInfo && (
        <div className="glass rounded-xl overflow-hidden shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Dietary Information
            </h2>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 mb-4">
                {dietaryInfo?.description ||
                  "Information about your dietary restrictions related to this food."}
              </p>

              {dietaryInfo?.avoidList &&
                Array.isArray(dietaryInfo.avoidList) &&
                dietaryInfo.avoidList.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-2">
                      {dietaryInfo?.title || "Common foods to avoid:"}
                    </h3>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                      {dietaryInfo.avoidList.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex justify-end mt-4">
                <Button variant="outline" className="gap-2 text-primary">
                  <CircleHelp className="h-4 w-4" /> Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultDetailsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-36 mb-6" />
              <Skeleton className="h-6 w-32 mb-6" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-24 w-full mb-6" />
              <Skeleton className="h-6 w-full mb-2" />
              <div className="flex flex-wrap gap-2 mb-6">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="flex space-x-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
