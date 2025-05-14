import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  User,
  Edit,
  Save,
  Shield,
  Phone,
  AtSign,
  UserCircle,
  UserPlus,
  Info as InfoIcon,
  LogOut, // Add this line
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DietaryProfile, ScanLimit } from "@/types";
import { fetchApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ProfileProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
    logout?: () => Promise<void>;
  };
}

const userProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyRelation: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

type UserProfileFormValues = z.infer<typeof userProfileSchema>;

export default function Profile({ auth }: ProfileProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = auth; // Destructure logout here
  const [isEditing, setIsEditing] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string>(
    localStorage.getItem("aiModel") || "meta-llama/llama-4-maverick:free"
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  // Fetch user profile and dietary information
  const { data: userProfile, isLoading: isProfileLoading } =
    useQuery<UserProfileFormValues>({
      queryKey: [`/api/users/${user?.id}/profile`],
      queryFn: () => {
        // Get the auth token from Supabase
        const supabaseAuth = JSON.parse(
          localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
        );
        const accessToken = supabaseAuth?.access_token || "";

        return fetchApi(`/api/users/${user?.id}/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      },
      enabled: isAuthenticated,
    });

  const { data: dietaryProfile, isLoading: isDietaryLoading } =
    useQuery<DietaryProfile>({
      queryKey: [`/api/dietary-profile/${user?.id}`],
      queryFn: () => {
        // Get the auth token from Supabase
        const supabaseAuth = JSON.parse(
          localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
        );
        const accessToken = supabaseAuth?.access_token || "";

        return fetchApi(`/api/dietary-profile/${user?.id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      },
      enabled: isAuthenticated,
    });

  const { data: scanLimit } = useQuery<ScanLimit>({
    queryKey: [`/api/scan-limits/${user?.id}`],
    queryFn: () => {
      // Get the auth token from Supabase
      const supabaseAuth = JSON.parse(
        localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
      );
      const accessToken = supabaseAuth?.access_token || "";

      return fetchApi(`/api/scan-limits/${user?.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },
    enabled: isAuthenticated,
  });

  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: "",
      email: user?.email || "",
      phone: "",
      emergencyName: "",
      emergencyRelation: "",
      emergencyPhone: "",
    },
    values: userProfile,
  });

  useEffect(() => {
    if (userProfile) {
      form.reset(userProfile);
    }
  }, [userProfile, form]);

  const handleEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId === editingSectionId ? null : sectionId);
  };

  const onSubmitProfile = async (values: UserProfileFormValues) => {
    try {
      // Get the auth token from Supabase
      const supabaseAuth = JSON.parse(
        localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
      );
      const accessToken = supabaseAuth?.access_token || "";

      await fetchApi(`/api/users/${user.id}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(values),
      });

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });

      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    if (logout) {
      await logout();
      setLocation("/");
    } else {
      toast({
        title: "Logout Failed",
        description: "Logout function is not available",
        variant: "destructive",
      });
    }
  };

  const updateDietaryProfile = async (
    field: string,
    value: string,
    checked: boolean
  ) => {
    if (!dietaryProfile) return;

    try {
      let updatedValues: string[] = [];

      // Get the auth token from Supabase
      const supabaseAuth = JSON.parse(
        localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
      );
      const accessToken = supabaseAuth?.access_token || "";

      if (field === "allergies") {
        updatedValues = checked
          ? [...dietaryProfile.allergies, value]
          : dietaryProfile.allergies.filter((item) => item !== value);

        await fetchApi(`/api/dietary-profile/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...dietaryProfile,
            allergies: updatedValues,
          }),
        });
      } else if (field === "dietaryPreferences") {
        updatedValues = checked
          ? [...dietaryProfile.dietaryPreferences, value]
          : dietaryProfile.dietaryPreferences.filter((item) => item !== value);

        await fetchApi(`/api/dietary-profile/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...dietaryProfile,
            dietaryPreferences: updatedValues,
          }),
        });
      } else if (field === "healthRestrictions") {
        updatedValues = checked
          ? [...dietaryProfile.healthRestrictions, value]
          : dietaryProfile.healthRestrictions.filter((item) => item !== value);

        await fetchApi(`/api/dietary-profile/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...dietaryProfile,
            healthRestrictions: updatedValues,
          }),
        });
      }

      toast({
        title: "Dietary Profile Updated",
        description: "Your dietary preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isProfileLoading || isDietaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-center mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Define allergy, dietary preference, and health restriction options
  const allergyOptions = [
    {
      id: "peanuts",
      label: "Peanuts",
      description: "No peanuts or peanut-derived ingredients",
    },
    {
      id: "tree-nuts",
      label: "Tree Nuts",
      description: "No almonds, cashews, walnuts, etc.",
    },
    {
      id: "dairy",
      label: "Dairy",
      description: "No milk, cheese, butter, etc.",
    },
    { id: "eggs", label: "Eggs", description: "No eggs or egg products" },
    {
      id: "shellfish",
      label: "Shellfish",
      description: "No shrimp, crab, lobster, etc.",
    },
    {
      id: "wheat",
      label: "Wheat",
      description: "No wheat or wheat-derived ingredients",
    },
    { id: "soy", label: "Soy", description: "No soy or soy derivatives" },
    { id: "fish", label: "Fish", description: "No fish or fish products" },
    {
      id: "sesame",
      label: "Sesame",
      description: "No sesame seeds or sesame oil",
    },
  ];

  const dietaryPreferenceOptions = [
    { id: "vegetarian", label: "Vegetarian", description: "No meat products" },
    { id: "vegan", label: "Vegan", description: "No animal products" },
    { id: "keto", label: "Keto", description: "Low carb, high fat diet" },
    {
      id: "paleo",
      label: "Paleo",
      description: "No processed foods, grains, dairy",
    },
    {
      id: "halal",
      label: "Halal",
      description: "Foods permissible under Islamic law",
    },
    {
      id: "kosher",
      label: "Kosher",
      description: "Foods prepared according to Jewish dietary laws",
    },
    {
      id: "gluten-free",
      label: "Gluten Free",
      description: "No wheat, barley, rye, etc.",
    },
    {
      id: "dairy-free",
      label: "Dairy Free",
      description: "No milk, cheese, butter, etc.",
    },
  ];

  const healthRestrictionOptions = [
    {
      id: "diabetes",
      label: "Diabetes",
      description: "Low sugar, balanced carbohydrates",
    },
    {
      id: "hypertension",
      label: "Hypertension",
      description: "Low sodium, heart-healthy diet",
    },
    {
      id: "heart-disease",
      label: "Heart Disease",
      description: "Low saturated fat, low sodium",
    },
    {
      id: "celiac-disease",
      label: "Celiac Disease",
      description: "Strict gluten-free diet",
    },
    {
      id: "kidney-disease",
      label: "Kidney Disease",
      description: "Limited protein, potassium, phosphorus",
    },
    {
      id: "low-sugar",
      label: "Low Sugar",
      description: "Reduced or no added sugars",
    },
    {
      id: "low-sodium",
      label: "Low Sodium",
      description: "Reduced salt content",
    },
    {
      id: "low-fat",
      label: "Low Fat",
      description: "Reduced total fat content",
    },
  ];

  // Function to handle model selection
  const handleModelChange = async (value: string) => {
    try {
      // Get the auth token from Supabase
      const supabaseAuth = JSON.parse(
        localStorage.getItem("sb-njxfkiparbdkklajlpyp-auth-token") || "{}"
      );
      const accessToken = supabaseAuth?.access_token || "";

      // Update the model in localStorage
      localStorage.setItem("aiModel", value);
      setSelectedModel(value);

      // Call API to update the model on the server
      await fetchApi(`/api/settings/model`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ model: value }),
      });

      toast({
        title: "Model Updated",
        description: "AI model has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mt-20">
      <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="px-6 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                My Profile
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
              {isEditing && (
                <Button
                  className="ml-3 gap-2"
                  onClick={form.handleSubmit(onSubmitProfile)}
                >
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              placeholder="Your name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={true} // Email is always disabled
                              type="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              placeholder="Your phone number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">
                  Your Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </span>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        Free Plan
                      </h4>
                      <p className="text-sm text-gray-500">
                        {scanLimit?.maxScans || 10} scans per month
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">Usage</span>
                      <span className="font-medium text-gray-900">
                        {scanLimit?.scansUsed || 0}/{scanLimit?.maxScans || 10}{" "}
                        scans
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((scanLimit?.scansUsed || 0) /
                              (scanLimit?.maxScans || 10)) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button className="w-full">Upgrade to Pro</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="glass rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Dietary Profile
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Allergies Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-gray-900">
                  Allergies
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEditSection("allergies")}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit allergies</span>
                </Button>
              </CardHeader>
              <CardContent>
                {editingSectionId === "allergies" ? (
                  <div className="space-y-3">
                    {allergyOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Checkbox
                            id={`allergy-${option.id}`}
                            checked={dietaryProfile?.allergies.includes(
                              option.id
                            )}
                            onCheckedChange={(checked) =>
                              updateDietaryProfile(
                                "allergies",
                                option.id,
                                !!checked
                              )
                            }
                          />
                          <label
                            htmlFor={`allergy-${option.id}`}
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            {option.label}
                          </label>
                        </div>
                        {option.id === "peanuts" || option.id === "eggs" ? (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800"
                          >
                            Severe
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dietaryProfile?.allergies &&
                    dietaryProfile.allergies.length > 0 ? (
                      dietaryProfile.allergies.map((allergy) => {
                        const option = allergyOptions.find(
                          (o) => o.id === allergy
                        );
                        return (
                          <div
                            key={allergy}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-gray-700">
                              {option?.label || allergy}
                            </span>
                            {allergy === "peanuts" || allergy === "eggs" ? (
                              <Badge
                                variant="outline"
                                className="bg-red-100 text-red-800"
                              >
                                Severe
                              </Badge>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">
                        No allergies specified
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dietary Preferences */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-gray-900">
                  Dietary Preferences
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEditSection("preferences")}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit preferences</span>
                </Button>
              </CardHeader>
              <CardContent>
                {editingSectionId === "preferences" ? (
                  <div className="space-y-3">
                    {dietaryPreferenceOptions.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <Checkbox
                          id={`diet-${option.id}`}
                          checked={dietaryProfile?.dietaryPreferences.includes(
                            option.id
                          )}
                          onCheckedChange={(checked) =>
                            updateDietaryProfile(
                              "dietaryPreferences",
                              option.id,
                              !!checked
                            )
                          }
                        />
                        <label
                          htmlFor={`diet-${option.id}`}
                          className="ml-3 block text-sm font-medium text-gray-700"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dietaryProfile?.dietaryPreferences &&
                    dietaryProfile.dietaryPreferences.length > 0 ? (
                      dietaryProfile.dietaryPreferences.map((pref) => {
                        const option = dietaryPreferenceOptions.find(
                          (o) => o.id === pref
                        );
                        return (
                          <div key={pref} className="flex items-center">
                            <span className="text-sm text-gray-700">
                              {option?.label || pref}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">
                        No dietary preferences specified
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Restrictions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-gray-900">
                  Health Restrictions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEditSection("health")}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit health restrictions</span>
                </Button>
              </CardHeader>
              <CardContent>
                {editingSectionId === "health" ? (
                  <div className="space-y-3">
                    {healthRestrictionOptions.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <Checkbox
                          id={`health-${option.id}`}
                          checked={dietaryProfile?.healthRestrictions.includes(
                            option.id
                          )}
                          onCheckedChange={(checked) =>
                            updateDietaryProfile(
                              "healthRestrictions",
                              option.id,
                              !!checked
                            )
                          }
                        />
                        <label
                          htmlFor={`health-${option.id}`}
                          className="ml-3 block text-sm font-medium text-gray-700"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dietaryProfile?.healthRestrictions &&
                    dietaryProfile.healthRestrictions.length > 0 ? (
                      dietaryProfile.healthRestrictions.map((restriction) => {
                        const option = healthRestrictionOptions.find(
                          (o) => o.id === restriction
                        );
                        return (
                          <div key={restriction} className="flex items-center">
                            <span className="text-sm text-gray-700">
                              {option?.label || restriction}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">
                        No health restrictions specified
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Account Settings
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* AI Model Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">
                  AI Model Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-select">Select AI Model</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={handleModelChange}
                  >
                    <SelectTrigger id="model-select">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meta-llama/llama-4-maverick:free">
                        Llama 4 Maverick
                      </SelectItem>
                      <SelectItem value="google/gemini-2.0-flash-exp:free">
                        Gemini 2.0 Flash
                      </SelectItem>
                      <SelectItem value="opengvlab/internvl3-14b:free">
                        InternVL3 14B
                      </SelectItem>
                      <SelectItem value="google/gemma-3-27b-it:free">
                        Gemma 3 27B
                      </SelectItem>
                      <SelectItem value="mistralai/mistral-small-3.1-24b-instruct:free">
                        Mistral Small 3.1 24B
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2">
                    Select the AI model used for food analysis and chat
                    responses.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="gap-2 text-primary"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </Button>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <Button variant="outline" className="text-red-700 gap-2">
                    <User className="h-4 w-4" /> Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
