import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

const dietaryProfileSchema = z.object({
  allergies: z.array(z.string()).optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  healthRestrictions: z.array(z.string()).optional(),
});

type DietaryProfileFormValues = z.infer<typeof dietaryProfileSchema>;

interface DietaryProfileFormProps {
  userId: number;
  existingProfile?: DietaryProfileFormValues;
  onComplete: () => void;
}

export default function DietaryProfileForm({ userId, existingProfile, onComplete }: DietaryProfileFormProps) {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DietaryProfileFormValues>({
    resolver: zodResolver(dietaryProfileSchema),
    defaultValues: {
      allergies: existingProfile?.allergies || [],
      dietaryPreferences: existingProfile?.dietaryPreferences || [],
      healthRestrictions: existingProfile?.healthRestrictions || [],
    },
  });

  const allergyOptions = [
    { id: "peanuts", label: "Peanuts", description: "No peanuts or peanut-derived ingredients" },
    { id: "tree-nuts", label: "Tree Nuts", description: "No almonds, cashews, walnuts, etc." },
    { id: "dairy", label: "Dairy", description: "No milk, cheese, butter, etc." },
    { id: "eggs", label: "Eggs", description: "No eggs or egg products" },
    { id: "shellfish", label: "Shellfish", description: "No shrimp, crab, lobster, etc." },
    { id: "wheat", label: "Wheat", description: "No wheat or wheat-derived ingredients" },
    { id: "soy", label: "Soy", description: "No soy or soy derivatives" },
    { id: "fish", label: "Fish", description: "No fish or fish products" },
    { id: "sesame", label: "Sesame", description: "No sesame seeds or sesame oil" },
  ];

  const dietaryPreferenceOptions = [
    { id: "vegetarian", label: "Vegetarian", description: "No meat products" },
    { id: "vegan", label: "Vegan", description: "No animal products" },
    { id: "keto", label: "Keto", description: "Low carb, high fat diet" },
    { id: "paleo", label: "Paleo", description: "No processed foods, grains, dairy" },
    { id: "halal", label: "Halal", description: "Foods permissible under Islamic law" },
    { id: "kosher", label: "Kosher", description: "Foods prepared according to Jewish dietary laws" },
    { id: "gluten-free", label: "Gluten Free", description: "No wheat, barley, rye, etc." },
    { id: "dairy-free", label: "Dairy Free", description: "No milk, cheese, butter, etc." },
  ];

  const healthRestrictionOptions = [
    { id: "diabetes", label: "Diabetes", description: "Low sugar, balanced carbohydrates" },
    { id: "hypertension", label: "Hypertension", description: "Low sodium, heart-healthy diet" },
    { id: "heart-disease", label: "Heart Disease", description: "Low saturated fat, low sodium" },
    { id: "celiac-disease", label: "Celiac Disease", description: "Strict gluten-free diet" },
    { id: "kidney-disease", label: "Kidney Disease", description: "Limited protein, potassium, phosphorus" },
    { id: "low-sugar", label: "Low Sugar", description: "Reduced or no added sugars" },
    { id: "low-sodium", label: "Low Sodium", description: "Reduced salt content" },
    { id: "low-fat", label: "Low Fat", description: "Reduced total fat content" },
  ];

  const onSubmit = async (values: DietaryProfileFormValues) => {
    setIsSubmitting(true);
    
    // Prepare request body
    const requestBody = {
      allergies: values.allergies || [],
      dietaryPreferences: values.dietaryPreferences || [],
      healthRestrictions: values.healthRestrictions || [],
    };
    
    console.log("Submitting dietary profile:", requestBody);
    
    // Optimistically update the cache before sending the request
    const queryKey = [`/api/dietary-profile/${userId}`];
    
    // Get the previous data to use for rollback if needed
    const previousData = queryClient.getQueryData<DietaryProfileFormValues>(queryKey);
    
    // Optimistically update the cached data
    queryClient.setQueryData(queryKey, {
      ...previousData,
      ...requestBody
    });
    
    // Show a quick success toast
    toast({
      title: "Profile Updated",
      description: "Your dietary profile has been updated.",
      duration: 3000
    });
    
    try {  
      // Use the apiRequest function from queryClient to send the actual update
      await apiRequest("POST", "/api/dietary-profile", requestBody);
      
      // Invalidate the query to refresh data in the background
      queryClient.invalidateQueries({ queryKey });
      
      console.log("Profile saved successfully");
      
      // Complete the form submission process
      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
      
      // Revert optimistic update on error
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData);
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Complete Your Dietary Profile</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Tell us about your dietary preferences so we can keep you safe.</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-8">
              {/* Allergies Section */}
              <div>
                <h4 className="text-md font-medium text-gray-900">Allergies</h4>
                <p className="text-sm text-gray-500">Select all that apply</p>
                <div className="mt-4 grid grid-cols-2 gap-y-4 gap-x-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={() => (
                      <>
                        {allergyOptions.map((option) => (
                          <FormItem
                            key={option.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={form.watch("allergies")?.includes(option.id)}
                                onCheckedChange={(checked) => {
                                  const currentValues = form.getValues("allergies") || [];
                                  const newValues = checked
                                    ? [...currentValues, option.id]
                                    : currentValues.filter((value) => value !== option.id);
                                  form.setValue("allergies", newValues, {
                                    shouldValidate: true,
                                  });
                                }}
                              />
                            </FormControl>
                            <div className="flex items-center">
                              <FormLabel className="font-normal mr-1">
                                {option.label}
                              </FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <InfoIcon className="h-4 w-4 text-gray-400" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{option.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </FormItem>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <h4 className="text-md font-medium text-gray-900">Dietary Preferences</h4>
                <p className="text-sm text-gray-500">Select all that apply</p>
                <div className="mt-4 grid grid-cols-2 gap-y-4 gap-x-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="dietaryPreferences"
                    render={() => (
                      <>
                        {dietaryPreferenceOptions.map((option) => (
                          <FormItem
                            key={option.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={form.watch("dietaryPreferences")?.includes(option.id)}
                                onCheckedChange={(checked) => {
                                  const currentValues = form.getValues("dietaryPreferences") || [];
                                  const newValues = checked
                                    ? [...currentValues, option.id]
                                    : currentValues.filter((value) => value !== option.id);
                                  form.setValue("dietaryPreferences", newValues, {
                                    shouldValidate: true,
                                  });
                                }}
                              />
                            </FormControl>
                            <div className="flex items-center">
                              <FormLabel className="font-normal mr-1">
                                {option.label}
                              </FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <InfoIcon className="h-4 w-4 text-gray-400" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{option.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </FormItem>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>

              {/* Health Restrictions */}
              <div>
                <h4 className="text-md font-medium text-gray-900">Health Restrictions</h4>
                <p className="text-sm text-gray-500">Select all that apply</p>
                <div className="mt-4 grid grid-cols-2 gap-y-4 gap-x-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="healthRestrictions"
                    render={() => (
                      <>
                        {healthRestrictionOptions.map((option) => (
                          <FormItem
                            key={option.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={form.watch("healthRestrictions")?.includes(option.id)}
                                onCheckedChange={(checked) => {
                                  const currentValues = form.getValues("healthRestrictions") || [];
                                  const newValues = checked
                                    ? [...currentValues, option.id]
                                    : currentValues.filter((value) => value !== option.id);
                                  form.setValue("healthRestrictions", newValues, {
                                    shouldValidate: true,
                                  });
                                }}
                              />
                            </FormControl>
                            <div className="flex items-center">
                              <FormLabel className="font-normal mr-1">
                                {option.label}
                              </FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <InfoIcon className="h-4 w-4 text-gray-400" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{option.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </FormItem>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                  >
                    Skip for now
                  </Button>
                  <Button
                    type="submit"
                    className="ml-3"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
