import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Camera, Crown } from "lucide-react";
import { ScanLimit } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "../lib/api";

interface ScanUsageProps {
  userId: string;
}

export default function ScanUsage({ userId }: ScanUsageProps) {
  // console.log("Scan Usage - User ID:", userId);
  const {
    data: scanLimit,
    isLoading,
    isError,
  } = useQuery<ScanLimit>({
    queryKey: [`/api/scan-limits/${userId}`],
    queryFn: () => fetchApi(`/api/scan-limits/${userId}`),
  });

  const { data: safetyCounts, isLoading: isCountsLoading } = useQuery<{
    safe: number;
    caution: number;
    unsafe: number;
  }>({
    queryKey: [`/api/scan-stats/${userId}`],
    queryFn: () => fetchApi(`/api/scan-stats/${userId}`),
  });

  if (isLoading || isCountsLoading) {
    return <ScanUsageSkeleton />;
  }

  if (isError || !scanLimit) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-700">
          Failed to load usage information. Please try again later.
        </p>
      </div>
    );
  }

  const { scansUsed, maxScans, resetDate } = scanLimit;
  const resetDateObj = new Date(resetDate);
  const daysRemaining = Math.ceil(
    (resetDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Scans This Month */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Scans This Month
            </h3>
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900">
                {scansUsed}
              </p>
              <p className="ml-1 text-gray-500">/ {maxScans} free</p>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{
                  width: `${Math.min(100, (scansUsed / maxScans) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {maxScans - scansUsed > 0
                ? `${maxScans - scansUsed} scans remaining on free plan`
                : "No scans remaining this month"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Resets in {daysRemaining} days
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Food Safety */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900">Food Safety</h3>
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-3xl font-semibold text-green-500">
                  {safetyCounts?.safe || 0}
                </p>
                <p className="text-xs text-gray-500">Safe</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-yellow-500">
                  {safetyCounts?.caution || 0}
                </p>
                <p className="text-xs text-gray-500">Caution</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-red-500">
                  {safetyCounts?.unsafe || 0}
                </p>
                <p className="text-xs text-gray-500">Unsafe</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade to Pro */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Upgrade to Pro
            </h3>
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500 mb-4">
              Get unlimited scans, detailed nutrition info, and menu scanner.
            </p>
            <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScanUsageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-10 w-24 mb-4" />
            <Skeleton className="h-2.5 w-full rounded-full mb-4" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
