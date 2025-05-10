import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DietaryProfileForm from "@/components/dietary-profile-form";
import DietaryRestrictionExplainer from "@/components/dietary-restriction-explainer";
import { DietaryProfile } from "@/types";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DietaryProfilePageProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
  };
}

export default function DietaryProfilePage({ auth }: DietaryProfilePageProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = auth;
  const [showExplainer, setShowExplainer] = useState(true);

  // Fetch existing dietary profile if user is authenticated
  const { data: existingProfile, isLoading } = useQuery<DietaryProfile>({
    queryKey: [`/api/dietary-profile/${user?.id}`],
    enabled: isAuthenticated,
    staleTime: 30000, // 30 seconds
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const handleComplete = () => {
    setLocation("/");
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-center mt-4">Loading your dietary profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {/* <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Your Dietary Profile
          </h1> */}
          {/* <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowExplainer(!showExplainer)}
            className="flex items-center"
          >
            {showExplainer ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
            {showExplainer ? "Hide Guide" : "Show Guide"}
          </Button> */}
        </div>

        {/* {showExplainer && (
          <div className="mt-6 mb-8 animate-in fade-in-50 duration-300">
            <Alert
              variant="default"
              className="mb-6 bg-amber-50 border-amber-200"
            >
              <Info className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">
                Understanding your dietary profile
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                Your dietary profile helps us determine if foods are safe for
                you to eat. Explore the guide below to understand different
                dietary restrictions.
              </AlertDescription>
            </Alert>
            <DietaryRestrictionExplainer
              userAllergies={existingProfile?.allergies || []}
              userDietaryPreferences={existingProfile?.dietaryPreferences || []}
              userHealthRestrictions={existingProfile?.healthRestrictions || []}
            />
          </div>
        )} */}
      </div>

      <Tabs defaultValue="edit" className="w-full">
        {/* <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="edit" className="flex-1">
            Edit Your Profile
          </TabsTrigger>
          <TabsTrigger value="view" className="flex-1">
            View Active Restrictions
          </TabsTrigger>
        </TabsList> */}

        <TabsContent value="edit" className="pt-2">
          <DietaryProfileForm
            userId={user.id}
            existingProfile={existingProfile}
            onComplete={handleComplete}
          />
        </TabsContent>

        <TabsContent value="view" className="pt-2">
          <div className="glass rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-8">
              <h2 className="text-xl font-bold mb-6">
                Your Active Dietary Restrictions
              </h2>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <h3 className="font-medium text-red-800 mb-3 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Allergies
                  </h3>
                  {existingProfile?.allergies &&
                  existingProfile.allergies.length > 0 ? (
                    <ul className="space-y-2">
                      {existingProfile.allergies.map((allergy: string) => (
                        <li
                          key={allergy}
                          className="flex items-center text-red-700"
                        >
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span className="capitalize">
                            {allergy.replace("-", " ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      No allergies specified
                    </p>
                  )}
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <h3 className="font-medium text-green-800 mb-3 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Dietary Preferences
                  </h3>
                  {existingProfile?.dietaryPreferences &&
                  existingProfile.dietaryPreferences.length > 0 ? (
                    <ul className="space-y-2">
                      {existingProfile.dietaryPreferences.map(
                        (preference: string) => (
                          <li
                            key={preference}
                            className="flex items-center text-green-700"
                          >
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="capitalize">
                              {preference.replace("-", " ")}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      No dietary preferences specified
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Health Restrictions
                  </h3>
                  {existingProfile?.healthRestrictions &&
                  existingProfile.healthRestrictions.length > 0 ? (
                    <ul className="space-y-2">
                      {existingProfile.healthRestrictions.map(
                        (restriction: string) => (
                          <li
                            key={restriction}
                            className="flex items-center text-blue-700"
                          >
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            <span className="capitalize">
                              {restriction.replace("-", " ")}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      No health restrictions specified
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
