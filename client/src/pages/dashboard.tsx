import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Camera,
  History,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FoodScanner from "@/components/food-scanner";
import RecentScans from "@/components/recent-scans";
import ScanUsage from "@/components/scan-usage";
import { DietaryProfile, ScanLimit } from "@/types";
import { fetchApi } from "@/lib/api"; // Import the fetchApi function

interface HomeProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
  };
}

export default function Dashboard({ auth }: HomeProps) {
  const { isAuthenticated, user } = auth;

  // Get the auth token from Supabase
  const getAuthToken = () => {
    const supabaseAuth = JSON.parse(
      localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
    );
    return supabaseAuth?.access_token || "";
  };

  // Fetch dietary profile if user is authenticated
  const { data: dietaryProfile } = useQuery<DietaryProfile>({
    queryKey: [`/api/dietary-profile/${user?.id}`],
    queryFn: () => fetchApi(`/api/dietary-profile/${user?.id}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    }),
    enabled: isAuthenticated,
  });

  // Fetch scan limits if user is authenticated
  const { data: scanLimit } = useQuery<ScanLimit>({
    queryKey: [`/api/scan-limits/${user?.id}`],
    queryFn: () => fetchApi(`/api/scan-limits/${user?.id}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    }),
    enabled: isAuthenticated,
  });

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="glass rounded-xl overflow-hidden shadow-lg mb-8 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="px-6 py-10 md:px-10 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                <span className="text-primary">Safe Food</span> Choices Made
                Simple
              </h1>
              <p className="mt-6 text-gray-600 text-lg leading-relaxed">
                Take a photo of your food and our AI will instantly tell you if
                it matches your dietary profile and is safe for you to eat.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="#scan-section">
                  <Button
                    size="lg"
                    className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Camera className="h-5 w-5" /> Scan Food Now
                  </Button>
                </Link>
                {isAuthenticated && (
                  <Link href="/history">
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2 border-2 hover:bg-gray-50"
                    >
                      <History className="h-5 w-5" /> View History
                    </Button>
                  </Link>
                )}
                {!isAuthenticated && (
                  <Link href="/register">
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2 border-2 hover:bg-gray-50"
                    >
                      <Sparkles className="h-5 w-5" /> Create Free Account
                    </Button>
                  </Link>
                )}
              </div>

              <div className="mt-8 flex items-center gap-4 flex-wrap">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-green-${
                        i * 100
                      } to-blue-${i * 100}`}
                    ></div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Join 2,000+ users making safer food choices
                </p>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-200 rounded-full opacity-50 blur-xl"></div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-200 rounded-full opacity-50 blur-xl"></div>
              <img
                src="https://images.unsplash.com/photo-1530554764233-e79e16c91d08?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                alt="Person scanning food with phone"
                className="rounded-xl shadow-xl transform hover:scale-105 transition-transform duration-500 relative z-10"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Safe to eat!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dietary Profile Missing Alert (for authenticated users) */}
      {isAuthenticated && !dietaryProfile && (
        <div className="glass rounded-xl overflow-hidden shadow-md mb-8 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-yellow-400 transform hover:scale-[1.01] transition-all">
          <div className="p-5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-yellow-400"
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
                <p className="text-sm font-medium text-yellow-800">
                  Complete your dietary profile for personalized results.
                  <Link
                    href="/dietary-profile"
                    className="font-bold underline text-yellow-700 hover:text-yellow-600 ml-1 inline-flex items-center"
                  >
                    Complete it now <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Food Section */}
      <div
        id="scan-section"
        className="glass rounded-xl overflow-hidden shadow-lg mb-8 bg-gradient-to-br from-white to-gray-50"
      >
        <div className="px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <Camera className="h-6 w-6 text-primary mr-2" /> Scan Your Food
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {isAuthenticated ? (
              <FoodScanner
                userId={user.id}
                maxScans={scanLimit?.maxScans || 10}
                scansUsed={scanLimit?.scansUsed || 0}
              />
            ) : (
              <div className="lg:col-span-3 flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-b from-gray-50 to-white hover:shadow-md transition-all">
                <Camera className="h-16 w-16 text-gray-400 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  Sign In to Start Scanning
                </h3>
                <p className="text-gray-500 text-center mb-8 max-w-md">
                  Create an account or sign in to scan food and check if it's
                  safe for your specific dietary needs.
                </p>
                <div className="flex gap-6">
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="border-2">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90"
                    >
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="lg:col-span-2">
              {/* Tips Area */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-xl font-medium text-primary mb-6 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" /> Tips for Better Results
                </h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <span>Take photos in good lighting</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <span>Center the dish in the frame</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <span>Take photos from above for best recognition</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
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
        <div className="glass rounded-xl overflow-hidden shadow-lg mb-8 bg-gradient-to-br from-white to-blue-50">
          <div className="px-6 py-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                <History className="h-6 w-6 text-primary mr-2" /> Recent Scans
              </h2>
              <Link
                href="/history"
                className="text-primary hover:text-primary-dark text-sm font-medium flex items-center bg-white py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all"
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <RecentScans userId={user.id} />
          </div>
        </div>
      )}

      {/* Usage Stats - Only shown for authenticated users */}
      {isAuthenticated && (
        <div className="glass rounded-xl overflow-hidden shadow-lg mb-8 bg-gradient-to-br from-white to-green-50">
          <div className="px-6 py-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 flex items-center">
              <Sparkles className="h-6 w-6 text-primary mr-2" /> Your Usage
            </h2>
            <ScanUsage userId={user.id} />
          </div>
        </div>
      )}
    </div>
  );
}
