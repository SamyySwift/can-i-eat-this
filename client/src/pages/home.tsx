import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Camera, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import FoodScanner from "@/components/food-scanner";
import RecentScans from "@/components/recent-scans";
import ScanUsage from "@/components/scan-usage";
import { DietaryProfile, ScanLimit } from "@/types";

interface HomeProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
  };
}

export default function Home({ auth }: HomeProps) {
  const { isAuthenticated, user } = auth;

  // Fetch dietary profile if user is authenticated
  const { data: dietaryProfile } = useQuery<DietaryProfile>({
    queryKey: [`/api/dietary-profile/${user?.id}`],
    enabled: isAuthenticated,
  });

  // Fetch scan limits if user is authenticated
  const { data: scanLimit } = useQuery<ScanLimit>({
    queryKey: [`/api/scan-limits/${user?.id}`],
    enabled: isAuthenticated,
  });

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="px-6 py-8 md:px-10 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                Check If Your Food Is Safe to Eat
              </h1>
              <p className="mt-4 text-gray-600 text-lg">
                Take a photo of your food and our AI will tell you if it matches
                your dietary profile.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="#scan-section">
                  <Button className="gap-2">
                    <Camera className="h-4 w-4" /> Scan Food
                  </Button>
                </Link>
                {isAuthenticated && (
                  <Link href="/history">
                    <Button variant="outline" className="gap-2">
                      <History className="h-4 w-4" /> View History
                    </Button>
                  </Link>
                )}
                {!isAuthenticated && (
                  <Link href="/register">
                    <Button variant="outline">Create Account</Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1530554764233-e79e16c91d08?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                alt="Person scanning food with phone"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dietary Profile Missing Alert (for authenticated users) */}
      {isAuthenticated && !dietaryProfile && (
        <div className="glass rounded-xl overflow-hidden shadow-lg mb-8 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You haven't completed your dietary profile yet.
                  <Link
                    href="/dietary-profile"
                    className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                  >
                    {" "}
                    Complete it now
                  </Link>
                  to get accurate food safety results.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Food Section */}
      <div
        id="scan-section"
        className="glass rounded-xl overflow-hidden shadow-lg mb-8"
      >
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Scan Your Food
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {isAuthenticated ? (
              <FoodScanner
                userId={user.id}
                maxScans={scanLimit?.maxScans || 10}
                scansUsed={scanLimit?.scansUsed || 0}
              />
            ) : (
              <div className="lg:col-span-3 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Camera className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Sign In to Start Scanning
                </h3>
                <p className="text-gray-500 text-center mb-6">
                  Create an account or sign in to scan food and check if it's
                  safe for you.
                </p>
                <div className="flex gap-4">
                  <Link href="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Create Account</Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="lg:col-span-2">
              {/* Tips Area */}
              <div className="bg-primary bg-opacity-10 rounded-lg p-6">
                <h3 className="text-lg font-medium text-primary mb-4">
                  Tips for Better Results
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mt-0.5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Take photos in good lighting</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mt-0.5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Center the dish in the frame</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mt-0.5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Take photos from above for best recognition</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mt-0.5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Include the entire dish in the photo</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Section - Only shown for authenticated users */}
      {isAuthenticated && (
        <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Scans</h2>
              <Link
                href="/history"
                className="text-primary hover:text-primary-dark text-sm font-medium flex items-center"
              >
                View All
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <RecentScans userId={user.id} />
          </div>
        </div>
      )}

      {/* Usage Stats - Only shown for authenticated users */}
      {isAuthenticated && (
        <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Usage
            </h2>
            <ScanUsage userId={user.id} />
          </div>
        </div>
      )}
    </div>
  );
}
