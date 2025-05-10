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
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function DietaryProfileForm({
  userId,
  existingProfile,
  onComplete,
}: DietaryProfileFormProps) {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
      id: "pescatarian",
      label: "Pescatarian",
      description: "Avoids meat but consumes fish and seafood",
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

  const steps = [
    {
      title: "What allergies do you have?",
      description: "Select all that apply",
      fieldName: "allergies" as const,
      options: allergyOptions,
      gradientColors: [
        "from-green-300 to-blue-400", // Light green to blue
        "from-purple-300 to-pink-400", // Light purple to pink
        "from-yellow-300 to-orange-400", // Light yellow to orange
        "from-blue-300 to-indigo-400", // Light blue to indigo
        "from-red-300 to-pink-400", // Light red to pink
        "from-teal-300 to-cyan-400", // Light teal to cyan
        "from-indigo-300 to-purple-400", // Light indigo to purple
        "from-orange-300 to-red-400", // Light orange to red
        "from-pink-300 to-rose-400", // Light pink to rose
      ],
    },
    {
      title: "What are your dietary preferences?",
      description: "Select all that apply",
      fieldName: "dietaryPreferences" as const,
      options: dietaryPreferenceOptions,
      gradientColors: [
        "from-blue-300 to-purple-400", // Light blue to purple
        "from-green-300 to-teal-400", // Light green to teal
        "from-yellow-300 to-amber-400", // Light yellow to amber
        "from-red-300 to-orange-400", // Light red to orange
        "from-indigo-300 to-blue-400", // Light indigo to blue
        "from-pink-300 to-purple-400", // Light pink to purple
        "from-teal-300 to-green-400", // Light teal to green
        "from-amber-300 to-yellow-400", // Light amber to yellow
        "from-purple-300 to-indigo-400", // Light purple to indigo
      ],
    },
    {
      title: "Do you have any health restrictions?",
      description: "Select all that apply",
      fieldName: "healthRestrictions" as const,
      options: healthRestrictionOptions,
      gradientColors: [
        "from-purple-300 to-blue-400", // Light purple to blue
        "from-green-300 to-emerald-400", // Light green to emerald
        "from-rose-300 to-red-400", // Light rose to red
        "from-amber-300 to-orange-400", // Light amber to orange
        "from-blue-300 to-cyan-400", // Light blue to cyan
        "from-pink-300 to-rose-400", // Light pink to rose
        "from-emerald-300 to-teal-400", // Light emerald to teal
        "from-orange-300 to-amber-400", // Light orange to amber
      ],
    },
  ];

  const currentStepData = steps[currentStep];

  const onSubmit = async (values: DietaryProfileFormValues) => {
    setIsSubmitting(true);

    const requestBody = {
      allergies: values.allergies || [],
      dietaryPreferences: values.dietaryPreferences || [],
      healthRestrictions: values.healthRestrictions || [],
    };

    const queryKey = [`/api/dietary-profile/${userId}`];
    const previousData =
      queryClient.getQueryData<DietaryProfileFormValues>(queryKey);

    queryClient.setQueryData(queryKey, {
      ...previousData,
      ...requestBody,
    });

    toast({
      title: "Profile Updated",
      description: "Your dietary profile has been updated.",
      duration: 3000,
    });

    try {
      await apiRequest("POST", "/api/dietary-profile", requestBody);
      queryClient.invalidateQueries({ queryKey });
      onComplete();
    } catch (error) {
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData);
      }
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    console.log(`Current step: ${currentStep}, Total steps: ${steps.length}`);
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Only submit when on the last step
      form.handleSubmit(onSubmit)();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          {currentStepData.title}
        </h2>
        <p className="text-gray-500 mt-2">{currentStepData.description}</p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name={currentStepData.fieldName}
          render={() => (
            <div className="space-y-4">
              {currentStepData.options.map((option, index) => {
                const isSelected = form
                  .watch(currentStepData.fieldName)
                  ?.includes(option.id);
                const gradientColor =
                  currentStepData.gradientColors[
                    index % currentStepData.gradientColors.length
                  ];

                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      const currentValues =
                        form.getValues(currentStepData.fieldName) || [];
                      const newValues = isSelected
                        ? currentValues.filter((val) => val !== option.id)
                        : [...currentValues, option.id];
                      form.setValue(currentStepData.fieldName, newValues, {
                        shouldValidate: true,
                      });
                    }}
                    className={cn(
                      "flex items-center space-x-3 py-4 px-8 rounded-full cursor-pointer transition-all duration-500 shadow-sm border",
                      isSelected
                        ? `bg-gradient-to-r ${gradientColor} text-white border-transparent`
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gradient-to-r hover:from-green-300 hover:to-gray-200"
                    )}
                  >
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-base font-semibold",
                          isSelected ? "text-white" : "text-gray-900"
                        )}
                      >
                        {option.label}
                      </p>
                      <p
                        className={cn(
                          "text-sm",
                          isSelected
                            ? "text-white text-opacity-90"
                            : "text-gray-500"
                        )}
                      >
                        {option.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        />
        <FormMessage />
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            // Prevent form submission on Enter key
            if (currentStep < steps.length - 1) {
              e.preventDefault();
              handleNext();
            } else {
              form.handleSubmit(onSubmit)(e);
            }
          }}
          className="space-y-8"
        >
          {renderStep()}
          <div className="flex justify-between pt-6">
            {currentStep > 0 ? (
              <Button type="button" variant="outline" onClick={handlePrev}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
            )}

            <Button
              type="button"
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={
                currentStep === steps.length - 1
                  ? form.handleSubmit(onSubmit)
                  : handleNext
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Saving..."
              ) : currentStep === steps.length - 1 ? (
                "Save to Profile"
              ) : (
                <>
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
