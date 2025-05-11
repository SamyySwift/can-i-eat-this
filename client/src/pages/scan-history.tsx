import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  ArrowLeft,
  Search,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FoodScan } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CachedImage from "@/components/cached-image";
import { preloadImages } from "@/lib/imageCache";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface ScanHistoryProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
  };
}

export default function ScanHistory({ auth }: ScanHistoryProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = auth;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  // Fetch scan history
  const {
    data: scans,
    isLoading,
    isError,
  } = useQuery<FoodScan[]>({
    queryKey: [`scans-${user?.id}`],
    queryFn: () => api.get(`/api/scans/user/${user?.id}`),
    enabled: isAuthenticated,
    onSuccess: (data: FoodScan[]) => {
      // Preload all scan images for better performance
      if (data && data.length > 0) {
        const imagePaths = data.map((scan: FoodScan) => scan.imageUrl || "");
        preloadImages(imagePaths).catch((err) =>
          console.error("Error preloading images:", err)
        );
      }
    },
  } as any);

  // Delete all scans mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      // Get the auth token from Supabase
      const supabaseAuth = JSON.parse(
        localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
      );
      const accessToken = supabaseAuth?.access_token || "";

      const response = await fetch(`/api/scans/user/${user?.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete all scans");
        } catch (parseError) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }

      try {
        // Try to parse as JSON first
        const text = await response.text();
        return text.trim() ? JSON.parse(text) : { success: true };
      } catch (e) {
        // If parsing fails, still consider it a success if the status was OK
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "All scans deleted",
        description: "All your scan history has been successfully deleted",
        variant: "default",
      });

      // Invalidate query to reload the data
      queryClient.invalidateQueries({
        queryKey: [`/api/scans/user/${user?.id}`],
      });
      setIsDeleteAlertOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete all scans",
        variant: "destructive",
      });
      setIsDeleteAlertOpen(false);
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ScanHistorySkeleton />
      </div>
    );
  }

  if (isError || !scans) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="glass rounded-xl overflow-hidden shadow-lg p-6">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Failed to Load History
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't load your scan history. Please try again later.
            </p>
            <Button asChild>
              <Link href="/">Go Back Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter scans
  const filteredScans = scans.filter((scan) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === "" ||
      scan.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.ingredients.some((ingredient) =>
        ingredient.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Filter by safety status
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "safe" && scan.isSafe === true) ||
      (filterStatus === "unsafe" && scan.isSafe === false) ||
      (filterStatus === "caution" && scan.isSafe === null);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Scan History
            </h1>

            {scans && scans.length > 0 && (
              <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your scan history and
                      images. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAllMutation.mutate()}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {deleteAllMutation.isPending
                        ? "Deleting..."
                        : "Delete All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by food name or ingredient"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="safe">Safe Only</SelectItem>
                  <SelectItem value="unsafe">Unsafe Only</SelectItem>
                  <SelectItem value="caution">Caution Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {filteredScans.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                {filterStatus === "all" ? (
                  <Calendar className="h-12 w-12 text-gray-400" />
                ) : (
                  <Filter className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No matching scans found
              </h3>
              <p className="text-gray-500">
                {filterStatus === "all"
                  ? "You haven't scanned any food items yet."
                  : "Try changing your filters or search term."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScans.map((scan) => (
                <Link key={scan.id} href={`/result/${scan.id}`}>
                  <Card className="h-full cursor-pointer hover:shadow-md transition-shadow duration-300">
                    <div className="h-48 overflow-hidden">
                      <CachedImage
                        src={scan.imageUrl || ""}
                        alt={scan.foodName || "Food image"}
                        foodName={scan.foodName}
                        className="w-full h-full object-cover"
                        height="12rem"
                        showSkeleton
                      />
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-medium text-gray-900">
                          {scan.foodName}
                        </CardTitle>
                        {scan.isSafe === true ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Safe
                          </Badge>
                        ) : scan.isSafe === false ? (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800"
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Unsafe
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-800"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" /> Caution
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Scanned on {formatDate(scan.scannedAt)}
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {scan.ingredients
                          .slice(0, 4)
                          .map((ingredient, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {ingredient}
                            </Badge>
                          ))}
                        {scan.ingredients.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{scan.ingredients.length - 4} more
                          </Badge>
                        )}
                      </div>
                      <div className="text-primary hover:text-primary-dark text-sm font-medium mt-2">
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
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScanHistorySkeleton() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="px-6 py-8">
          <Skeleton className="h-10 w-48 mb-6" />

          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[150px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-full">
                <Skeleton className="h-48 w-full" />
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-5 w-24 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
